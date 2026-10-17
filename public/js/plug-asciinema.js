/* md-docs plugin: asciinema inline player (census 38).
 * FENCE FORM (marked v12 keeps only the FIRST word of the info string —
 * probed live on the vendored copy — so the URL rides the fence CONTENT):
 *     ```asciinema
 *     https://...cast
 *     ```
 * renderer.code: lang's first word = asciinema AND an https content-url
 * -> .mdp-cast placeholder; anything else returns false (marked's
 * default render — verified via the real marked in the tests).
 * enhance: the player global present = inline create; else load-then-
 * create; the failure = a plain link fallback. */
(function (g) {
  'use strict';
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function asciinemaCode(code, infostring, escaped) {
    var lang = typeof infostring === 'string' ? infostring : '';
    if (lang.split(/\s+/)[0] !== 'asciinema') return false;
    var url = typeof code === 'string' ? code.replace(/\s+$/, '').trim() : '';
    if (!/^https:\/\//.test(url)) return false;
    return '<div class="mdp-cast" data-cast-url="' + esc(url) + '"></div>';
  }
  function wireBox(box) {
    if (box.dataset.mdpWired) return;
    box.dataset.mdpWired = '1';
    var url = box.getAttribute('data-cast-url') || '';
    var fallback = function () {
      var a = g.document.createElement('a');
      a.href = url;
      a.textContent = url;
      box.innerHTML = '';
      box.appendChild(a);
    };
    var tryCreate = function () {
      if (g.AsciinemaPlayer && typeof g.AsciinemaPlayer.create === 'function') {
        try { box.innerHTML = ''; g.AsciinemaPlayer.create(url, box); return true; } catch (e) { return false; }
      }
      return false;
    };
    if (tryCreate()) return;
    if (g.MDPluginLoader && typeof g.MDPluginLoader.ensureLoaded === 'function') {
      g.MDPluginLoader.ensureLoaded('asciinema').then(function () {
        if (!tryCreate()) fallback();
      }).catch(function () { fallback(); });
    } else {
      fallback();
    }
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.asciinema = { renderer: { code: asciinemaCode } };
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.asciinema = function (rootEl) {
    if (!g.document || !rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll('.mdp-cast').forEach(wireBox);
  };
})(typeof window !== 'undefined' ? window : globalThis);