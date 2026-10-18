/* md-docs plugin: Graphviz viz.js (census 2). Fence: ```dot -> placeholder.
 * enhance: lazy-load the WASM standalone bundle; @viz-js/viz exposes an
 * async instance (Viz.instance().then(viz => viz.renderSVGElement(src)))
 * or direct renderSVGElement on some builds; the svg element goes into
 * the box; failure = source-visible fallback. */
(function (g) {
  'use strict';
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function graphvizCode(code, infostring) {
    var lang = typeof infostring === 'string' ? infostring.split(/\s+/)[0] : '';
    if (lang !== 'dot') return false;
    return '<div class="mdp-diagram mdp-diagram-dot" data-diagram="dot" data-src="' + esc(String(code || '')) + '"></div>';
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.graphviz = { renderer: { code: graphvizCode } };
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.graphviz = function (rootEl) {
    if (!g.document || !rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll('.mdp-diagram[data-diagram="dot"]').forEach(function (box) {
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
      var boot = function (viz) {
        try {
          if (typeof viz.renderSVGElement !== 'function') return fallback();
          viz.renderSVGElement(src).then(function (el) {
            box.innerHTML = '';
            box.appendChild(el);
          }).catch(fallback);
        } catch (e) { fallback(); }
      };
      var go = function () {
        if (!g.Viz) return fallback();
        if (typeof g.Viz.instance === 'function') g.Viz.instance().then(boot, fallback);
        else boot(g.Viz);
      };
      if (g.Viz) return go();
      if (g.MDPluginLoader) {
        g.MDPluginLoader.ensureLoaded('graphviz').then(go).catch(fallback);
      } else fallback();
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);