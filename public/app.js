'use strict';

const view = document.getElementById('view');

let docsCache = null;
let contentCache = {};
let deepScan = { running: false, done: 0, total: 0 };
const PAGE_SIZE = 20;
let state = { q: '', cat: 'all', sort: 'new', page: 0 };

/* API base resolves from document.baseURI: '/' standalone, '/docs/' when
   mounted under the dashboard's nginx location — enables both. */
const TOKEN_KEY = 'mdDocsToken';
const API_BASE = (() => {
  try {
    const p = new URL(document.baseURI).pathname;
    return p.endsWith('/') ? p : p + '/';
  } catch (e) { return '/'; }
})();

/* shared fetch for every API call: attaches the stashed token when the
   server runs gated (MD_DOCS_TOKEN), prompts once on 401 and retries. */
async function apiFetch(path, opts = {}) {
  for (;;) {
    const headers = Object.assign({}, opts.headers || {});
    const t = (localStorage.getItem(TOKEN_KEY) || '').trim();
    if (t) headers['X-MD-Docs-Token'] = t;
    const r = await fetch(API_BASE + path, Object.assign({}, opts, { headers }));
    if (r.status === 401 && !opts._retryAuth) {
      const tokv = (window.prompt('MD Docs access token:') || '').trim();
      if (!tokv) return r;
      localStorage.setItem(TOKEN_KEY, tokv);
      opts = Object.assign({}, opts, { _retryAuth: true });
      continue;
    }
    return r;
  }
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function fetchDocs() {
  const r = await apiFetch('api/docs', { cache: 'no-store' });
  docsCache = await r.json();
  return docsCache;
}

function invalidateCaches() { docsCache = null; contentCache = {}; }

async function getContent(id) {
  if (contentCache[id]) return contentCache[id];
  const r = await apiFetch('api/doc/' + encodeURIComponent(id), { cache: 'no-store' });
  if (!r.ok) return null;
  contentCache[id] = await r.text();
  return contentCache[id];
}

/* --- source-path / category helpers --- */
function docSource(d) {
  const s = d.description || '';
  const i = s.lastIndexOf('source: ');
  return i >= 0 ? s.slice(i + 8).trim() : '';
}
function catOf(d) {
  const p = docSource(d);
  if (p.startsWith('/home/wez/')) {
    const rest = p.slice('/home/wez/'.length);
    const slash = rest.indexOf('/');
    return slash === -1 ? '~/ <top-level>' : '~/' + rest.slice(0, slash);
  }
  if (p.startsWith('/opt/')) {
    const parts = p.slice(1).split('/');
    return '/opt/' + (parts[1] || '');
  }
  return p ? 'other' : 'no path info';
}
function allCats(docs) {
  const set = new Map();
  for (const d of docs) {
    const c = catOf(d);
    const n = set.get(c) || 0;
    set.set(c, n + 1);
  }
  return [...set.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/* --- filtering / sorting / paging --- */
function computeFiltered(docs) {
  const q = state.q.trim().toLowerCase();
  let list = docs.filter((d) => state.cat === 'all' || catOf(d) === state.cat);
  if (q.length >= 3) {
    list = list.filter((d) =>
      (d.title + ' ' + (d.description || '')).toLowerCase().includes(q) ||
      (contentCache[d.id] || '').toLowerCase().includes(q));
  } else if (q) {
    list = list.filter((d) => (d.title + ' ' + (d.description || '')).toLowerCase().includes(q));
  }
  const sorters = {
    new: (a, b) => (b.mtime || '').localeCompare(a.mtime || ''),
    old: (a, b) => (a.mtime || '').localeCompare(b.mtime || ''),
    az: (a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()),
    za: (a, b) => b.title.toLowerCase().localeCompare(a.title.toLowerCase()),
    big: (a, b) => b.bytes - a.bytes,
    small: (a, b) => a.bytes - b.bytes
  };
  list.sort(sorters[state.sort] || sorters.new);
  return list;
}

/* deep content scan: fills contentCache with limited concurrency */
async function ensureContentScan(docs) {
  const missing = docs.filter((d) => !(d.id in contentCache));
  if (!missing.length) { deepScan = { running: false, done: 0, total: 0 }; return; }
  if (deepScan.running) return;
  deepScan = { running: true, done: 0, total: missing.length };
  let idx = 0;
  const worker = async () => {
    while (idx < missing.length) {
      const d = missing[idx++];
      try {
        const r = await apiFetch('api/doc/' + encodeURIComponent(d.id), { cache: 'no-store' });
        contentCache[d.id] = r.ok ? await r.text() : '';
      } catch (e) { contentCache[d.id] = ''; }
      deepScan.done++;
    }
  };
  await Promise.all(Array.from({ length: 12 }, worker));
  deepScan = { running: false, done: 0, total: 0 };
}

/* --- view bits --- */
function fmtBytes(n) {
  if (n >= 1048576) return (n / 1048576).toFixed(1) + ' MB';
  return Math.max(1, Math.round(n / 1024)) + ' KB';
}
function fmtDate(iso) {
  try { const d = iso ? new Date(iso) : null; return d ? d.toLocaleString() : ''; } catch (e) { return ''; }
}

function addFormHTML() {
  return `
  <form id="addForm" class="addform">
    <div class="row">
      <input id="f-title" placeholder="Title (optional — file name used otherwise)">
      <input id="f-desc" placeholder="Description (stored locally with the doc)">
    </div>
    <div class="row wide">
      <input type="file" id="f-file" accept=".md,.markdown,.txt">
      <textarea id="f-text" rows="4" placeholder="…or paste markdown here"></textarea>
    </div>
    <button type="submit">+ Add doc</button>
  </form>`;
}

async function showList() {
  /* remember focused control + caret so re-render doesn't drop focus while typing */
  const prevFocus = document.activeElement && document.activeElement.id ? document.activeElement.id : '';
  const prevCaret = (prevFocus === 'search' && document.activeElement.selectionStart != null)
    ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
  let docs = [];
  try { docs = await fetchDocs(); } catch (e) {
    view.innerHTML = '<p class="empty">API unreachable — is the server running?</p>';
    return;
  }

  const q = state.q.trim();
  let scanPromise = null;
  if (q.length >= 3 && docs.some((d) => !(d.id in contentCache))) {
    if (!deepScan.running) {
      scanPromise = ensureContentScan(docs).then(() => { if (state.q === q) showList(); });
    }
  }

  const list = computeFiltered(docs);
  const lastPage = Math.max(0, Math.floor((list.length - 1) / PAGE_SIZE));
  if (state.page > lastPage) state.page = lastPage;
  if (state.page < 0) state.page = 0;
  const start = state.page * PAGE_SIZE;
  const slice = list.slice(start, start + PAGE_SIZE);

  const cats = allCats(docs);
  const catOpts = ['<option value="all">All sources</option>']
    .concat(cats.map(([c, n]) => `<option value="${esc(c)}" ${c === state.cat ? 'selected' : ''}>${esc(c)} (${n})</option>`)).join('');
  const sortOpts = [
    ['new', 'Newest first'], ['old', 'Oldest first'],
    ['az', 'Title A–Z'], ['za', 'Title Z–A'],
    ['big', 'Largest'], ['small', 'Smallest']
  ].map(([v, l]) => `<option value="${v}" ${state.sort === v ? 'selected' : ''}>${l}</option>`).join('');

  const cards = slice.map((d) => `
    <div class="card">
      <div class="card-top">
        <h3><a href="#/doc/${esc(d.id)}">${esc(d.title)}</a></h3>
        <button class="btn danger" data-del="${esc(d.id)}" title="remove">✕</button>
      </div>
      <p class="desc">${esc(d.description || '')}</p>
      <p class="tiny muted">${esc(d.id)} • ${fmtBytes(d.bytes)} • ${fmtDate(d.added)}</p>
    </div>`).join('');

  const pager = list.length > PAGE_SIZE ? `
    <div class="pager">
      <button class="btn" id="pgPrev" ${state.page === 0 ? 'disabled' : ''}>&larr; Prev</button>
      <span class="muted tiny">page ${state.page + 1} / ${lastPage + 1} — docs ${start + 1}–${Math.min(start + PAGE_SIZE, list.length)} of ${list.length}</span>
      <button class="btn" id="pgNext" ${state.page >= lastPage ? 'disabled' : ''}>Next &rarr;</button>
    </div>` : '';

  const deepStatus = deepScan.running && q.length >= 3
    ? `<span class="muted tiny" id="deepStatus">deep scan ${deepScan.done}/${deepScan.total}…</span>` : '';

  view.innerHTML = `
    ${addFormHTML()}
    <div class="controls">
      <input id="search" value="${esc(state.q)}" placeholder="Search title, description, content (3+ chars)…">
      <select id="catSel" class="btn">${catOpts}</select>
      <select id="sortSel" class="btn">${sortOpts}</select>
    </div>
    <div class="statusline">${deepStatus}<span class="muted tiny">${list.length ? `showing ${start + 1}–${Math.min(start + PAGE_SIZE, list.length)} of ${list.length} filtered (${docs.length} total)` : 'no docs match'}</span></div>
    <div class="grid">${cards}</div>
    ${pager}`;

  document.getElementById('addForm').addEventListener('submit', addDoc);
  const s = document.getElementById('search');
  s.addEventListener('input', () => { state.q = s.value; state.page = 0; showList(); });
  document.getElementById('catSel').addEventListener('change', (e) => { state.cat = e.target.value; state.page = 0; showList(); });
  document.getElementById('sortSel').addEventListener('change', (e) => { state.sort = e.target.value; state.page = 0; showList(); });
  const prev = document.getElementById('pgPrev');
  const next = document.getElementById('pgNext');
  if (prev) prev.addEventListener('click', () => { state.page--; showList(); });
  if (next) next.addEventListener('click', () => { state.page++; showList(); });
  if (scanPromise) { /* re-render fires when scan completes */ }
  /* restore focus + caret to the control that triggered the re-render */
  const cur = prevFocus ? document.getElementById(prevFocus) : null;
  if (cur && (prevFocus === 'search' || prevFocus === 'catSel' || prevFocus === 'sortSel' ||
      prevFocus.startsWith('pg'))) {
    cur.focus();
    if (prevCaret && typeof cur.setSelectionRange === 'function') {
      try { cur.setSelectionRange(prevCaret[0], prevCaret[1]); } catch (e) {}
    }
  }
}

/* --- markdown renderers --- */
function fallbackRender(src) {
  const lines = String(src).split(/\r?\n/);
  const out = [];
  const escd = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) => escd(s)
    .replace(/`([^`]+)`/g, (m, c) => '<code>' + c + '</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  const sepRow = (r) => /^\s*\|?[\s:\-|]+\|?\s*$/.test(r) && r.includes('-');
  const rowCells = (r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  let inCode = false, codeBuf = [], listTag = null, tableBuf = [];
  const flushList = () => { if (listTag) { out.push('</' + listTag + '>'); listTag = null; } };
  const flushTable = () => {
    if (!tableBuf.length) return;
    const hdr = tableBuf.length >= 2 && sepRow(tableBuf[1]);
    let i = 0, html = '<table>';
    while (i < tableBuf.length) {
      if (sepRow(tableBuf[i])) { i++; continue; }
      const tag = hdr && i === 0 ? 'th' : 'td';
      html += '<tr>' + rowCells(tableBuf[i]).map((c) => '<' + tag + '>' + inline(c) + '</' + tag + '>').join('') + '</tr>';
      i++;
    }
    out.push(html + '</table>');
    tableBuf = [];
  };
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      if (inCode) { out.push('<pre><code>' + codeBuf.join('\n') + '</code></pre>'); inCode = false; codeBuf = []; }
      else { inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(escd(line)); continue; }
    if (line.includes('|') && (line.trim().startsWith('|') || tableBuf.length)) { flushList(); tableBuf.push(line); continue; }
    if (tableBuf.length) flushTable();
    if (!line.trim()) { flushList(); continue; }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flushList(); const n = h[1].length; out.push('<h' + n + '>' + inline(h[2]) + '</h' + n + '>'); continue; }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { flushList(); out.push('<hr>'); continue; }
    const qm = line.match(/^\s*>\s?(.*)$/);
    if (qm) { flushList(); out.push('<blockquote>' + inline(qm[1]) + '</blockquote>'); continue; }
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) { if (listTag !== 'ul') { flushList(); out.push('<ul>'); listTag = 'ul'; } out.push('<li>' + inline(ul[1]) + '</li>'); continue; }
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ol) { if (listTag !== 'ol') { flushList(); out.push('<ol>'); listTag = 'ol'; } out.push('<li>' + inline(ol[1]) + '</li>'); continue; }
    flushList();
    out.push('<p>' + inline(line.trim()) + '</p>');
  }
  if (inCode) out.push('<pre><code>' + codeBuf.join('\n') + '</code></pre>');
  if (tableBuf.length) flushTable();
  flushList();
  return out.join('\n');
}

function renderMd(src) {
  var html = MDPipeline.render(src, MDPluginLoader.transformers());
  if (html == null) return fallbackRender(src);
  return html;
}

/* --- doc view --- */
var docBusy = false;
var lastDocId = null;
window.MDApp = { rerender: function () { if (lastDocId) showDoc(lastDocId); }, get currentDoc() { return lastDocId; } };
async function showDoc(id, anchor) {
  if (docBusy) return;
  docBusy = true;
  lastDocId = id;
  let meta = null;
  try {
    const docs = docsCache || await fetchDocs();
    meta = docs.find((d) => d.id === id) || null;
  } catch (e) { /* non-fatal */ }
  const text = await getContent(id);
  try { await MDPluginLoader.ensureActive(); } catch (err) { /* degrade: plain render */ }
  if (text == null) {
    view.innerHTML = '<p class="empty">doc not found</p><p style="text-align:center"><a href="#/">back to list</a></p>';
    docBusy = false;
    return;
  }
  const url = location.origin + location.pathname + '#/doc/' + encodeURIComponent(id);
  view.innerHTML = `
    <div class="topbar">
      <a href="#/">&larr; all docs</a>
      <span class="grow"></span>
      <button class="btn" id="rawToggle">Source</button>
      <button class="btn" id="copyBtn">Copy link</button>
      <button class="btn danger" data-del="${esc(id)}">Remove</button>
    </div>
    <div class="meta"><strong>${esc(meta ? meta.title : id)}</strong>${meta && meta.description ? ' — ' + esc(meta.description) : ''}</div>
    <div class="copyrow"><input id="hashUrl" readonly value="${esc(url)}"></div>
    <article class="doc" id="docBody">${renderMd(text)}</article>`;
  MDPluginLoader.enhance(document.getElementById('docBody'));
  if (anchor) {
    var tEl = document.getElementById('mdp-' + anchor);
    if (tEl && tEl.scrollIntoView) tEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const doCopy = () => {
    const inp = document.getElementById('hashUrl');
    const done = () => { inp.style.color = 'var(--text)'; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(() => { inp.focus(); inp.select(); try { document.execCommand('copy'); done(); } catch (e) {} });
    } else {
      inp.focus(); inp.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
    }
  };
  document.getElementById('copyBtn').addEventListener('click', doCopy);
  document.getElementById('hashUrl').addEventListener('focus', () => document.getElementById('hashUrl').select());
  let showRaw = false;
  document.getElementById('rawToggle').addEventListener('click', (e) => {
    showRaw = !showRaw;
    const body = document.getElementById('docBody');
    if (showRaw) { body.innerHTML = '<pre><code>' + esc(text) + '</code></pre>'; e.target.textContent = 'Render'; }
    else { body.innerHTML = renderMd(text); e.target.textContent = 'Source'; }
    MDPluginLoader.enhance(body);
  });
  docBusy = false;
}

/* --- actions --- */
async function addDoc(e) {
  e.preventDefault();
  const file = document.getElementById('f-file').files[0];
  const title = document.getElementById('f-title').value.trim();
  const description = document.getElementById('f-desc').value.trim();
  let content = document.getElementById('f-text').value;
  if (file && file.name) {
    try { content = await file.text(); } catch (err) { alert('could not read file: ' + err); return; }
  }
  if (!content || !content.trim()) { alert('pick a file or paste markdown first'); return; }
  const r = await apiFetch('api/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title || (file ? file.name : 'Untitled'), description, content })
  });
  const j = await r.json();
  if (!r.ok) { alert(j.error || 'add failed'); return; }
  invalidateCaches();
  location.hash = '#/doc/' + j.id;
}

async function removeDoc(id) {
  try { await apiFetch('api/doc/' + encodeURIComponent(id), { method: 'DELETE' }); } catch (e) {}
  invalidateCaches();
  location.hash = '#/';
  route();
}

/* in-page mdp anchors: prevent default hash routing, smooth-scroll to the
 * target, keep the router state coherent via replaceState (footnote refs,
 * backrefs, heading copy-links) */
view.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#mdp-"]');
  if (!a) return;
  e.preventDefault();
  const frag = decodeURIComponent(a.getAttribute('href').slice(1));
  const tEl = document.getElementById(frag);
  if (tEl && tEl.scrollIntoView) tEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const hh = parseHash();
  if (hh.arg) {
    try { history.replaceState(null, '', '#/doc/' + encodeURIComponent(hh.arg) + '/' + frag.replace(/^mdp-/, '')); } catch (err) {}
  }
});

/* global delegated delete handling (cards + doc view) */
view.addEventListener('click', (e) => {
  const b = e.target.closest('[data-del]');
  if (!b) return;
  const id = b.getAttribute('data-del');
  const meta = (docsCache || []).find((x) => x.id === id);
  if (confirm('Remove "' + (meta ? meta.title : id) + '"?')) removeDoc(id);
});

/* --- router (#/ = list, #/doc/<id> = rendered doc) --- */
function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const parts = h.split('/');
  return { page: parts[0] || 'list', arg: parts[1] || null, anchor: parts[2] ? decodeURIComponent(parts[2]) : null };
}
async function route() {
  const { page, arg, anchor } = parseHash();
  if (page === 'doc' && arg) return showDoc(decodeURIComponent(arg), anchor);
  return showList();
}
window.addEventListener('hashchange', route);
route();