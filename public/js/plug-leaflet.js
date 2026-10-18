/* md-docs plugin: Leaflet map blocks (census 47). OFFLINE-TILES-FIRST:
 * ```leaflet fences with a small JSON block ({markers:..., center, zoom})
 * -> a placeholder box; enhance: lazy-load leaflet (the registry's own
 * css/js), build the map WITHOUT tile layers by default (the offline
 * first: the map = markers + coordinates only); a "tiles" key set to
 * "osm" = the explicit opt-in to OSM's hosted tiles (egress at view
 * time). The parse/render failure = the source-visible fallback. */
(function (g) {
  'use strict';
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function leafletCode(code, infostring) {
    var lang = typeof infostring === 'string' ? infostring.split(/\s+/)[0] : '';
    if (lang !== 'leaflet') return false;
    return '<div class="mdp-map" data-map="leaflet" data-src="' + esc(String(code || '')) + '"></div>';
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.leaflet = { renderer: { code: leafletCode } };
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.leaflet = function (rootEl) {
    if (!g.document || !rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll('.mdp-map[data-map="leaflet"]').forEach(function (box) {
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
          var cfg = JSON.parse(src);
          if (!cfg || typeof cfg !== 'object') return fallback();
          box.innerHTML = '';
          box.style.height = (cfg.height ? String(cfg.height) : '280px');
          var map = g.L.map(box, { center: cfg.center || [0, 0], zoom: cfg.zoom || 3, scrollWheelZoom: false });
          (cfg.markers || []).forEach(function (m) {
            try { g.L.marker([m.lat, m.lon]).addTo(map).bindPopup(m.title || ''); } catch (e) { /* skip marker */ }
          });
          if (cfg.tiles === 'osm') {
            /* the EXPLICIT egress opt-in: hosted OSM tiles */
            g.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: 'OpenStreetMap',
              maxZoom: 19,
            }).addTo(map);
          } else {
            /* offline-first: a plain background, no external tiles */
            box.style.background = 'var(--panel, #f4f4f4)';
          }
        } catch (e) { fallback(); }
      };
      if (g.L) return go();
      if (g.MDPluginLoader) {
        g.MDPluginLoader.ensureLoaded('leaflet').then(go).catch(fallback);
      } else fallback();
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);