/* md-docs plugin: MscGen (census 4). Fence: ```mscgen -> placeholder.
 * enhance: lazy-load the mscgenjs bundle, try the browser render-Msc API
 * variants (string or promise; some builds return {svg}), inject the
 * svg; unknown-API/global-failure = the source-visible fallback. */
(function (g) {
  'use strict';
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function mscgenCode(code, infostring) {
    var lang = typeof infostring === 'string' ? infostring.split(/\s+/)[0] : '';
    if (lang !== 'mscgen') return false;
    return '<div class="mdp-diagram mdp-diagram-mscgen" data-diagram="mscgen" data-src="' + esc(String(code || '')) + '"></div>';
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.mscgen = { renderer: { code: mscgenCode } };
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.mscgen = function (rootEl) {
    if (!g.document || !rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll('.mdp-diagram[data-diagram="mscgen"]').forEach(function (box) {
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
      var injectSvg = function (out) {
        var svg = (out && typeof out === 'object' && typeof out.svg === 'string') ? out.svg : String(out || '');
        if (svg.indexOf('<svg') === -1) return fallback();
        box.innerHTML = svg;
      };
      var go = function () {
        var lib = g.mscgenjs || g.mscgen_js;
        try {
          if (!lib || typeof lib.renderMsc !== 'function') return fallback();
          var out = lib.renderMsc(src, { format: 'svg' });
          if (out && typeof out.then === 'function') out.then(injectSvg, fallback);
          else injectSvg(out);
        } catch (e) { fallback(); }
      };
      if (g.mscgenjs || g.mscgen_js) return go();
      if (g.MDPluginLoader) {
        g.MDPluginLoader.ensureLoaded('mscgen').then(go).catch(fallback);
      } else fallback();
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);