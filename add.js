#!/usr/bin/env node
// usage: node add.js <file.md> [title] [description]
// POSTs the file into the (locally running) md-docs server and prints the id.
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');

const CONF_PATH = process.env.MD_DOCS_CONF || path.join(__dirname, 'md-docs.conf');
const conf = {};
try {
  for (const line of fs.readFileSync(CONF_PATH, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    conf[t.slice(0, i).trim().toLowerCase()] = t.slice(i + 1).trim();
  }
} catch (e) { /* conf optional */ }

const bindHost = process.env.MD_DOCS_HOST || conf.host || '127.0.0.1';
const HOST = (!bindHost || bindHost === '0.0.0.0') ? '127.0.0.1' : bindHost;
const PORT = parseInt(process.env.MD_DOCS_PORT || conf.port || '9991', 10);
const TOKEN = (process.env.MD_DOCS_TOKEN || conf.token || '').trim();

const [file, ...rest] = process.argv.slice(2);
if (!file) { console.error('usage: add.js <file.md> [title] [description]'); process.exit(2); }

let content;
try { content = fs.readFileSync(file, 'utf8'); } catch (e) {
  console.error('cannot read file:', e.message); process.exit(1);
}
const body = JSON.stringify({ title: rest[0] || '', description: rest[1] || '', content });
const req = http.request({
  host: HOST,
  port: PORT,
  path: '/api/docs',
  method: 'POST',
  headers: Object.assign(
    { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    TOKEN ? { Authorization: 'Bearer ' + TOKEN } : {}
  )
}, (res) => {
  let data = '';
  res.on('data', (c) => (data += c));
  res.on('end', () => console.log(res.statusCode, data));
});
req.on('error', (e) => { console.error('add failed (is the server running?):', e.message); process.exit(1); });
req.end(body);