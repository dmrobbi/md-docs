/* md-docs plugin: image lightbox + galleries (census 43, glightbox).
 * Enhancer-only: initializes GLightbox over doc images once per render.
 * The library lazy-loads through the registry; the load/init failure =
 * a graceful no-op (the images stay plain). */
(function (g) {
  'use strict';
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.lightbox = function (rootEl) {
    if (typeof g.GLightbox === 'function') {
      try { g.GLightbox({ selector: '#docBody img' }); } catch (e) { /* no-op */ }
      return;
    }
    if (g.MDPluginLoader) {
      g.MDPluginLoader.ensureLoaded('lightbox').then(function () {
        try { if (typeof g.GLightbox === 'function') g.GLightbox({ selector: '#docBody img' }); } catch (e) { /* no-op */ }
      }).catch(function () { /* no-op */ });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);