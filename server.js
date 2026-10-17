#!/usr/bin/env node
'use strict';

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONF_PATH = process.env.MD_DOCS_CONF || path.join(ROOT, 'md-docs.conf');

/* --- md-docs.conf parsing: key = value lines, '#' comments --- */
function parseConf(file) {
  const out = {};
  try {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      out[t.slice(0, i).trim().toLowerCase()] = t.slice(i + 1).trim();
    }
  } catch (e) { /* conf file optional */ }
  return out;
}

const conf = parseConf(CONF_PATH);

/* precedence: env override > md-docs.conf > built-in defaults */
const HOST = process.env.MD_DOCS_HOST || conf.host || '0.0.0.0';
const PORT = parseInt(process.env.MD_DOCS_PORT || conf.port || '9991', 10);
const MDS = path.resolve(process.env.MD_DOCS_DIR || conf.docsdir || path.join(ROOT, 'mds'));

const PUB = path.join(ROOT, 'public');
const META = path.join(MDS, '.metadata.json');

/* optional bearer gate: if MD_DOCS_TOKEN (env) or token (conf file) is set,
   every /api request must carry Authorization: Bearer <token> or
   X-MD-Docs-Token: <token>; static UI stays open. Empty = open (lab mode). */
const TOKEN = (process.env.MD_DOCS_TOKEN || conf.token || '').trim();

function tokenOk(req) {
  if (!TOKEN) return true;
  const given = String(req.headers['x-md-docs-token'] || '').trim()
    || String(req.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim();
  if (!given) return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(TOKEN).digest();
  return crypto.timingSafeEqual(a, b);
}

const ID_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const MAX_BODY = 20 * 1024 * 1024;

fs.mkdirSync(MDS, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function readMeta() {
  try { return JSON.parse(fs.readFileSync(META, 'utf8')); }
  catch (e) { return {}; }
}
function writeMeta(meta) {
  const tmp = META + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(meta, null, 2) + '\n');
  fs.renameSync(tmp, META);
}
function slugify(t) {
  const s = String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 79);
  return s || 'doc';
}
function uniqueId(meta, base) {
  const id0 = slugify(base);
  const exists = (x) => !!meta[x] || fs.existsSync(path.join(MDS, x + '.md'));
  if (!exists(id0)) return id0;
  let n = 2;
  while (exists(id0 + '-' + n)) n++;
  return id0 + '-' + n;
}
function listDocs() {
  const meta = readMeta();
  const out = [];
  let names = [];
  try { names = fs.readdirSync(MDS); } catch (e) { names = []; }
  for (const f of names) {
    if (!f.endsWith('.md') || f.startsWith('.')) continue;
    const id = f.slice(0, -3);
    if (!ID_RE.test(id)) continue;
    let st;
    try { st = fs.statSync(path.join(MDS, f)); } catch (e) { continue; }
    const m = meta[id] || {};
    out.push({
      id,
      title: m.title || id,
      description: m.description || '',
      added: m.added || st.mtime.toISOString(),
      bytes: st.size,
      mtime: st.mtime.toISOString()
    });
  }
  out.sort((a, b) => (b.mtime || '').localeCompare(a.mtime || ''));
  return out;
}

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function serveStatic(res, pathname) {
  let rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const fp = path.normalize(path.join(PUB, rel));
  if (fp !== PUB && !fp.startsWith(PUB + path.sep)) { res.writeHead(403, { 'Content-Type': 'text/plain' }); res.end('forbidden'); return; }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('not found'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(u.pathname);

    if (pathname.startsWith('/api') && !tokenOk(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8', 'WWW-Authenticate': 'Bearer' });
      return res.end(JSON.stringify({ error: 'unauthorized' }));
    }

    if (pathname === '/api/docs') {
      if (req.method === 'GET') return sendJSON(res, 200, listDocs());
      if (req.method === 'POST') {
        let body;
        try { body = JSON.parse((await readBody(req)) || '{}'); }
        catch (e) { return sendJSON(res, 400, { error: 'invalid JSON body: ' + e.message }); }
        const content = typeof body.content === 'string' ? body.content : null;
        if (!content || !content.trim()) return sendJSON(res, 400, { error: 'content required' });
        const meta = readMeta();
        const id = uniqueId(meta, body.title || body.id || 'untitled');
        meta[id] = {
          title: String(body.title || id).slice(0, 200),
          description: String(body.description || '').slice(0, 2000),
          added: new Date().toISOString()
        };
        fs.writeFileSync(path.join(MDS, id + '.md'), content);
        writeMeta(meta);
        console.log('[md-docs] added ' + id + ' (' + content.length + ' bytes)');
        return sendJSON(res, 200, { ok: true, id });
      }
      return sendJSON(res, 405, { error: 'method not allowed' });
    }

    if (pathname.startsWith('/api/doc/')) {
      const id = pathname.slice('/api/doc/'.length);
      if (!ID_RE.test(id)) return sendJSON(res, 400, { error: 'invalid id' });
      const file = path.join(MDS, id + '.md');
      if (req.method === 'GET') {
        let data;
        try { data = fs.readFileSync(file, 'utf8'); }
        catch (e) { return sendJSON(res, 404, { error: 'no such doc' }); }
        res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(data);
      }
      if (req.method === 'DELETE') {
        if (!fs.existsSync(file)) return sendJSON(res, 404, { error: 'no such doc' });
        fs.rmSync(file, { force: true });
        const meta = readMeta();
        if (meta[id]) { delete meta[id]; writeMeta(meta); }
        console.log('[md-docs] removed ' + id);
        return sendJSON(res, 200, { ok: true });
      }
      return sendJSON(res, 405, { error: 'method not allowed' });
    }

    return serveStatic(res, pathname);
  } catch (e) {
    console.error('[md-docs] error:', e && e.message);
    try { sendJSON(res, 500, { error: 'server error: ' + (e && e.message) }); } catch (_) { /* socket gone */ }
  }
});

server.listen(PORT, HOST, () => {
  console.log('[md-docs] listening on http://' + HOST + ':' + PORT +
    ' (conf: ' + CONF_PATH + ', docs dir: ' + MDS + ')');
});