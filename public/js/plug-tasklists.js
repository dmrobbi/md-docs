/* md-docs plugin: interactive task lists (census 34). Self-authored.
 * Marked's default renders GFM task items as disabled checkboxes; the
 * enhancer un-disables them and persists per-doc state keyed by item
 * index in localStorage (mdp.tasklist.<docId>). One change-listener per
 * rendered root (the doc body is rebuilt per render, so no leak). */
(function (g) {
  'use strict';
  function taskKey(docId) { return 'mdp.tasklist.' + (docId || 'anon'); }
  function loadState(docId) {
    var s = {};
    try { s = JSON.parse(g.localStorage.getItem(taskKey(docId)) || '{}') || {}; } catch (e) { s = {}; }
    if (!s || typeof s !== 'object') s = {};
    return s;
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.tasklists = function (rootEl) {
    if (!g.document || !rootEl || !rootEl.querySelectorAll) return;
    var docId = (g.MDApp && g.MDApp.currentDoc) || '';
    var saved = loadState(docId);
    rootEl.querySelectorAll('li input[type="checkbox"]').forEach(function (cb, idx) {
      cb.disabled = false;
      cb.dataset.mdpTaskIdx = String(idx);
      if (saved[idx] !== undefined) cb.checked = !!saved[idx];
    });
    rootEl.addEventListener('change', function (e) {
      var cb = e.target && e.target.closest && e.target.closest('input[data-mdp-task-idx]');
      if (!cb) return;
      var st = loadState(docId);
      st[cb.dataset.mdpTaskIdx] = cb.checked;
      try { g.localStorage.setItem(taskKey(docId), JSON.stringify(st)); } catch (err) { /* ignore */ }
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);