/* md-docs plugin: WaveDrom (census 5). Fence: ```wavedrom -> placeholder.
 * enhance: lazy-load + WaveDrom render into the box; the svg-presence
 * check decides success vs the source-visible fallback. */
(function (g) {
  'use strict';
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function wavedromCode(code, infostring) {
    var lang = typeof infostring === 'string' ? infostring.split(/\s+/)[0] : '';
    if (lang !== 'wavedrom') return false;
    return '<div class="mdp-diagram mdp-diagram-wavedrom" data-diagram="wavedrom" data-src="' + esc(String(code || '')) + '"></div>';
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.wavedrom = { renderer: { code: wavedromCode } };
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.wavedrom = function (rootEl) {
    if (!g.document || !rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll('.mdp-diagram[data-diagram="wavedrom"]').forEach(function (box) {
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
          box.innerHTML = '';
          var ok = false;
          if (typeof g.WaveDrom === 'undefined') return fallback();
          if (typeof g.WaveDrom.renderWaveForm === 'function') {
            g.WaveDrom.renderWaveForm(0, { source: src }, box);
            ok = !!box.querySelector('svg');
          } else if (typeof g.WaveDrom.processAll === 'function') {
            box.textContent = src;
            box.className = (box.className || '') + ' WaveDrom';
            g.WaveDrom.processAll();
            ok = !!box.querySelector('svg');
          }
          if (!ok) fallback();
        } catch (e) { fallback(); }
      };
      if (g.WaveDrom) return go();
      if (g.MDPluginLoader) {
        g.MDPluginLoader.ensureLoaded('wavedrom').then(go).catch(fallback);
      } else fallback();
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);