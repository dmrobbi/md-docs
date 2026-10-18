/* md-docs plugin: backlinks (census 51). Self-authored, zero-dep. T6.1.
 * The client mention graph over the hub API: when a doc renders, the
 * module scans the hub's doc list + fetches each neighbor's source
 * (throttled workers, session-cached) and lists every doc whose source
 * references the current doc through the hub hash scheme (#/doc/<id>,
 * raw + percent-encoded forms). Title-word mentioning is deliberately
 * NOT part of the graph (the false-positive class: every README, every
 * "notes" word). Pure parts = testable without DOM (createScanner deps).
 * Enhance = the sync placeholder + the async fill; box staleness and
 * scan errors degrade to a status line. Styles = mdp-plugins.css (INT).
 */
(function (g) {
  'use strict';
  /* session caches (throttle + cache per the task line) */
  var textCache = new Map();  // doc id -> source text
  var indexCache = new Map(); // cur doc id -> {fp, entries}

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* API base from document.baseURI: '/' standalone, '/docs/' when the
   * dashboard nginx mounts it — mirrors app.js's own resolution. */
  function apiBase() {
    try {
      var p = new URL(g.document.baseURI).pathname;
      return p.endsWith('/') ? p : p + '/';
    } catch (e) { return '/'; }
  }

  /* quick boolean: does src reference the doc by the hub hash scheme? */
  function mentionsSrc(src, docId) {
    if (!src || !docId) return false;
    var s = String(src);
    var pat = '#/doc/';
    if (s.indexOf(pat + docId) !== -1) return true;
    var enc = null;
    try { enc = encodeURIComponent(docId); } catch (e) { enc = docId; }
    return enc !== docId && s.indexOf(pat + enc) !== -1;
  }

  /* decoded list of every hash-reference target in a source (order kept) */
  function collectRefs(src) {
    var out = [];
    var re = /#\s*\/doc\/([^\s"'<>)]+)/g;
    var m;
    while ((m = re.exec(String(src || ''))) !== null) {
      var dec = m[1];
      try { dec = decodeURIComponent(m[1]); } catch (e) { /* keep raw */ }
      out.push(dec);
    }
    return out;
  }

  /* pure combiner: the backlink entries for curId, in docs order */
  function buildGraphEntries(docs, contents, curId) {
    var hits = [];
    (docs || []).forEach(function (d) {
      if (!d || !d.id || d.id === curId) return;
      var refs = collectRefs(contents[d.id] || '');
      if (refs.indexOf(curId) !== -1) hits.push({ id: d.id, title: d.title || d.id });
    });
    return hits;
  }

  /* pure html builder (escaping inside) */
  function sectionHtml(entries, status) {
    var body = status
      ? '<span class="mdp-backlinks-status">' + esc(status) + '</span>'
      : ((entries && entries.length)
        ? '<ul class="mdp-backlinks-list">' + entries.map(function (e) {
            return '<li><a href="#/doc/' + esc(e.id) + '">' + esc(e.title) + '</a></li>';
          }).join('') + '</ul>'
        : '<span class="mdp-backlinks-status">no backlinks found</span>');
    return '<div id="mdp-backlinks" class="mdp-backlinks">'
      + '<div class="mdp-backlinks-head">Backlinks</div>' + body + '</div>';
  }

  /* scanner with injectable deps (tests run this without any DOM/net):
   *   deps.list()    -> Promise of docs [{id,title,mtime,...}]
   *   deps.content(id) -> Promise of the doc source text
   *   deps.concurrency / deps.maxDocs / deps.textCache / deps.indexCache
   * buildIndex(curId): throttled workers fill the text cache, the pure
   * graph builds from it; the fingerprint (ids + mtimes) memoizes the
   * index so unchanged hubs skip the graph step. */
  function createScanner(deps) {
    var d = deps || {};
    var conc = d.concurrency || 6;
    var maxDocs = d.maxDocs || 2000;
    var texts = d.textCache || new Map();
    var idxCache = d.indexCache || new Map();
    function fpOf(docs) {
      return (docs || []).map(function (x) {
        return (x && x.id ? x.id : '?') + ':' + ((x && x.mtime) || '');
      }).join('|');
    }
    function fetchText(id) {
      if (texts.has(id)) return Promise.resolve(texts.get(id));
      return Promise.resolve().then(function () { return d.content(id); }).then(function (t) {
        var v = String(t == null ? '' : t);
        texts.set(id, v);
        return v;
      }).catch(function () { texts.set(id, ''); return ''; });
    }
    function buildIndex(curId) {
      return Promise.resolve().then(function () { return d.list(); }).then(function (docs) {
        docs = (docs || []).filter(function (x) { return x && x.id; }).slice(0, maxDocs);
        var fp = fpOf(docs);
        var hit = idxCache.get(curId);
        if (hit && hit.fp === fp) {
          return { entries: hit.entries, total: docs.length, cached: true };
        }
        var missing = docs.filter(function (x) { return x.id !== curId && !texts.has(x.id); });
        var idx = 0;
        function worker() {
          function next() {
            if (idx >= missing.length) return Promise.resolve();
            var id = missing[idx++].id;
            return fetchText(id).then(next);
          }
          return next();
        }
        var workers = [];
        for (var i = 0; i < conc; i++) workers.push(worker());
        return Promise.all(workers).then(function () {
          var contents = {};
          docs.forEach(function (x) { contents[x.id] = texts.get(x.id) || ''; });
          var entries = buildGraphEntries(docs, contents, curId);
          idxCache.set(curId, { fp: fp, entries: entries });
          return { entries: entries, total: docs.length, cached: false };
        });
      });
    }
    return {
      buildIndex: buildIndex,
      stats: function () { return { texts: texts.size, indexes: idxCache.size }; },
    };
  }

  g.MDBacklinks = {
    apiBase: apiBase,
    mentionsSrc: mentionsSrc,
    collectRefs: collectRefs,
    buildGraphEntries: buildGraphEntries,
    sectionHtml: sectionHtml,
    createScanner: createScanner,
  };

  /* --- DOM wiring --- */
  function netDeps() {
    var base = apiBase();
    var headers = {};
    try {
      var t = (g.localStorage.getItem('mdDocsToken') || '').trim();
      if (t) headers['X-MD-Docs-Token'] = t; /* gated deploys: attach only, never prompt */
    } catch (e) { /* storage unavailable */ }
    return {
      list: function () {
        return fetch(base + 'api/docs', { headers: headers, cache: 'no-store' }).then(function (r) {
          if (!r.ok) throw new Error('api/docs ' + r.status);
          return r.json();
        });
      },
      content: function (id) {
        return fetch(base + 'api/doc/' + encodeURIComponent(id), { headers: headers, cache: 'no-store' }).then(function (r) {
          if (!r.ok) throw new Error('api/doc ' + r.status);
          return r.text();
        });
      },
      concurrency: 6,
      maxDocs: 2000,
      textCache: textCache,
      indexCache: indexCache,
    };
  }

  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.backlinks = function (rootEl) {
    if (!g.document || !rootEl) return;
    if (rootEl.querySelector && rootEl.querySelector('.mdp-backlinks')) return;
    var cur = (g.MDApp && g.MDApp.currentDoc) ? g.MDApp.currentDoc : null;
    if (!cur) return;
    var box = g.document.createElement('div');
    box.id = 'mdp-backlinks';
    box.className = 'mdp-backlinks';
    box.innerHTML = '<div class="mdp-backlinks-head">Backlinks</div>'
      + '<span class="mdp-backlinks-status">backlink scan&hellip;</span>';
    rootEl.appendChild(box);
    createScanner(netDeps()).buildIndex(cur).then(function (res) {
      if (box.isConnected === false) return; /* the page re-rendered first */
      var rows = res.entries.map(function (e) {
        return '<li><a href="#/doc/' + esc(e.id) + '">' + esc(e.title) + '</a></li>';
      }).join('');
      box.innerHTML = '<div class="mdp-backlinks-head">Backlinks'
        + (res.entries.length ? ' (' + res.entries.length + ')' : '') + '</div>'
        + (res.entries.length
          ? '<ul class="mdp-backlinks-list">' + rows + '</ul>'
          : '<span class="mdp-backlinks-status">no backlinks found</span>');
    }).catch(function (e) {
      if (box.isConnected === false) return;
      box.innerHTML = '<div class="mdp-backlinks-head">Backlinks</div>'
        + '<span class="mdp-backlinks-status">unavailable</span>';
      if (g.console && typeof console.warn === 'function') {
        console.warn('[md-docs] backlinks scan failed:', e && e.message);
      }
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);