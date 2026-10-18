/* md-docs plugin: media players (census 40/41 — one module).
 * Enhancer-only: bare links to media files become native players
 * in place — video (.mp4/.webm/.mov) and audio (.mp3/.ogg/.wav).
 * The link element is consumed (the player replaces it — the href
 * moves into the player element). Idempotent per link. */
(function (g) {
  'use strict';
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.media = function (rootEl) {
    if (!g.document || !rootEl || !rootEl.querySelectorAll) return;
    var VID = 'a[href$=".mp4"],a[href$=".webm"],a[href$=".mov"]';
    var AUD = 'a[href$=".mp3"],a[href$=".ogg"],a[href$=".wav"]';
    rootEl.querySelectorAll(VID).forEach(function (a) {
      if (a.dataset.mdpMedia) return;
      a.dataset.mdpMedia = '1';
      var v = g.document.createElement('video');
      v.controls = true;
      v.src = a.getAttribute('href');
      v.style.maxWidth = '100%';
      var p = a.closest && a.closest('p');
      if (p) { p.innerHTML = ''; p.appendChild(v); }
      else { a.innerHTML = ''; a.appendChild(v); }
    });
    rootEl.querySelectorAll(AUD).forEach(function (a) {
      if (a.dataset.mdpMedia) return;
      a.dataset.mdpMedia = '1';
      var au = g.document.createElement('audio');
      au.controls = true;
      au.src = a.getAttribute('href');
      var p = a.closest && a.closest('p');
      if (p) { p.innerHTML = ''; p.appendChild(au); }
      else { a.innerHTML = ''; a.appendChild(au); }
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);