/* md-docs plugin: Vega / Vega-Lite (census 36). KROKI-ONLY by design
 * (egress row — the registry marks egress:true, default-off): the
 * ```vega / ```vegalite fence becomes an <img> pointed at the kroki
 * encoder with the spec passed as POST-like embedded data via the URL
 * form kroki supports (png/svg + deflate+base64). enhance: builds the
 * encoded URL; the egress badge/confirm flow lives in the loader.
 * NO kroki global configured = the source-visible fallback. */
(function (g) {
  'use strict';
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function vegaCode(code, infostring) {
    var lang = typeof infostring === 'string' ? infostring.split(/\s+/)[0] : '';
    if (lang !== 'vega' && lang !== 'vegalite' && lang !== 'vega-lite') return false;
    return '<div class="mdp-vega" data-vega-kind="' + lang + '" data-src="' + esc(String(code || '')) + '"></div>';
  }
  function b64(src) {
    try {
      /* deflate+base64 = kroki's compact form; pako absent = plain b64 */
      if (g.pako && g.pako.gzip) {
        var bin = g.pako.gzip(src, { to: 'string' });
        return g.btoa(bin);
      }
      return g.btoa(unescape(encodeURIComponent(src)));
    } catch (e) { return ''; }
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.vega = { renderer: { code: vegaCode } };
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.vega = function (rootEl) {
    if (!g.document || !rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll('.mdp-vega').forEach(function (box) {
      if (box.dataset.mdpWired) return;
      box.dataset.mdpWired = '1';
      var src = box.getAttribute('data-src') || '';
      var enc = b64(src);
      var fallback = function () {
        var pre = g.document.createElement('pre');
        var c = g.document.createElement('code');
        c.textContent = src;
        pre.appendChild(c);
        box.innerHTML = '';
        box.appendChild(pre);
      };
      if (!enc) return fallback();
      /* kroki endpoint: the loader's egress confirm gate already ran */
      var url = 'https://kroki.io/vegalite/svg/' + enc;
      var kind = box.getAttribute('data-vega-kind');
      if (kind === 'vega') url = 'https://kroki.io/vega/svg/' + enc;
      try {
        var img = g.document.createElement('img');
        img.src = url;
        img.alt = 'vega diagram';
        img.onerror = fallback;
        box.innerHTML = '';
        box.appendChild(img);
      } catch (e) { fallback(); }
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);