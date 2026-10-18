/* md-docs plugin: Chart.js blocks (census 35).
 * fence: ```chart -> .mdp-chart placeholder with the raw config in
 * data-src (single-escaped). enhance: lazy-load chart.js, JSON.parse
 * the config, a <canvas> + new Chart(canvas, config); any parse/render
 * failure = the source-visible fallback (never blank, never silent). */
(function (g) {
  'use strict';
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function chartCode(code, infostring) {
    var lang = typeof infostring === 'string' ? infostring.split(/\s+/)[0] : '';
    if (lang !== 'chart') return false;
    return '<div class="mdp-chart" data-chart="chartjs" data-src="' + esc(String(code || '')) + '"></div>';
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.chartjs = { renderer: { code: chartCode } };
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.chartjs = function (rootEl) {
    if (!g.document || !rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll('.mdp-chart[data-chart="chartjs"]').forEach(function (box) {
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
          var config = JSON.parse(src);
          if (!config || typeof config !== 'object') return fallback();
          var canvas = g.document.createElement('canvas');
          box.innerHTML = '';
          box.appendChild(canvas);
          new g.Chart(canvas, config);
        } catch (e) { fallback(); }
      };
      if (typeof g.Chart === 'function') return go();
      if (g.MDPluginLoader) {
        g.MDPluginLoader.ensureLoaded('chartjs').then(function () {
          if (typeof g.Chart !== 'function') return fallback();
          go();
        }).catch(fallback);
      } else fallback();
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);