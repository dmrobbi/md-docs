/* md-docs plugin: nomnoml (census 3). Same shape as mermaid's, smaller:
 * fence: ```nomnoml -> .mdp-diagram placeholder; enhance: lazy-load +
 * nomnoml.renderSvg(src) -> the svg string injected into the box;
 * failure = the source-visible fallback. */
(function (g) {
  'use strict';
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nomnomlCode(code, infostring) {
    var lang = typeof infostring === 'string' ? infostring.split(/\s+/)[0] : '';
    if (lang !== 'nomnoml') return false;
    return '<div class="mdp-diagram mdp-diagram-nomnoml" data-diagram="nomnoml" data-src="' + esc(String(code || '')) + '"></div>';
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.nomnoml = { renderer: { code: nomnomlCode } };
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.nomnoml = function (rootEl) {
    if (!g.document || !rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll('.mdp-diagram[data-diagram="nomnoml"]').forEach(function (box) {
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
        try {
          var svg = g.nomnoml.renderSvg(src);
          box.innerHTML = svg;
        } catch (e) { fallback(); }
      };
      if (g.nomnoml) return go();
      if (g.MDPluginLoader) {
        g.MDPluginLoader.ensureLoaded('nomnoml').then(go).catch(fallback);
      } else fallback();
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);