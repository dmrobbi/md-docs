/* md-docs plugin: mermaid (census 1) — the flagship diagram renderer.
 * fence: ```mermaid -> .mdp-diagram placeholder carrying the raw source
 * in data-src (single-escaped; getAttribute = decoded by the DOM).
 * enhance: initialize once (startOnLoad:false, securityLevel:strict),
 * the source goes into the box, mermaid.run renders it in place; any
 * failure = the source-visible fallback <pre>. */
(function (g) {
  'use strict';
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function mermaidCode(code, infostring) {
    var lang = typeof infostring === 'string' ? infostring.split(/\s+/)[0] : '';
    if (lang !== 'mermaid') return false;
    return '<div class="mdp-diagram mdp-diagram-mermaid" data-diagram="mermaid" data-src="' + esc(String(code || '')) + '"></div>';
  }
  var initialized = false;
  function ensureInit() {
    if (initialized || !g.mermaid) return;
    g.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
    initialized = true;
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.mermaid = { renderer: { code: mermaidCode } };
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.mermaid = function (rootEl) {
    if (!g.document || !rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll('.mdp-diagram[data-diagram="mermaid"]').forEach(function (box) {
      if (box.dataset.mdpWired) return;
      box.dataset.mdpWired = '1';
      var src = box.getAttribute('data-src') || '';
      var fallback = function () {
        var pre = g.document.createElement('pre');
        var c = g.document.createElement('code');
        c.textContent = src;
        pre.appendChild(c);
        box.innerHTML = '';
        box.appendChild(pre);
      };
      var go = function () {
        if (!g.mermaid) return fallback();
        ensureInit();
        try {
          box.textContent = src;
          g.mermaid.run({ nodes: [box] }).catch(fallback);
        } catch (e) { fallback(); }
      };
      if (g.mermaid) return go();
      if (g.MDPluginLoader) {
        g.MDPluginLoader.ensureLoaded('mermaid').then(go).catch(fallback);
      } else fallback();
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);