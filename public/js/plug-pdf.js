/* md-docs plugin: PDF embeds (census 42). Enhancer-only, DEPENDENCY-FREE:
 * links to .pdf become the browser's native pdf embed (<embed
 * type="application/pdf">) in place of the link. Idempotent per link;
 * the embed-tag absence degrades to a plain link (untouched). */
(function (g) {
  'use strict';
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.pdf = function (rootEl) {
    if (!g.document || !rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll('a[href$=".pdf"]').forEach(function (a) {
      if (a.dataset.mdpPdf) return;
      a.dataset.mdpPdf = '1';
      var wrap = g.document.createElement('div');
      wrap.className = 'mdp-pdf';
      var emb = g.document.createElement('embed');
      emb.type = 'application/pdf';
      emb.src = a.getAttribute('href');
      wrap.appendChild(emb);
      var p = a.closest && a.closest('p');
      if (p) { p.innerHTML = ''; p.appendChild(wrap); }
      else if (a.parentNode) { a.parentNode.insertBefore(wrap, a); }
      try { a.remove && a.remove(); } catch (e) { if (a.parentNode) a.parentNode.removeChild(a); }
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);