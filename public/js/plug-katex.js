/* md-docs plugin: KaTeX + mhchem (census 17). Enhancer-only: the marked
 * side stays untouched; the math render pass runs post-render on the
 * doc body (auto-render), so code fences and inline code stay code.
 * Deliberately matches ONLY $$ and the bracket forms — no bare inline
 * $..$ (the currency false-positive class in real docs). mhchem loads
 * before auto-render (the registry's js array order). Absence of the
 * global = graceful no-op; throwOnError:false = the bad LaTeX stays
 * visible (visible-not-crash). */
(function (g) {
  'use strict';
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.katex = function (rootEl) {
    if (!rootEl) return;
    if (typeof g.renderMathInElement !== 'function') return;
    try {
      g.renderMathInElement(rootEl, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false },
        ],
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        throwOnError: false,
      });
    } catch (e) { /* visible-not-crash: raw text remains */ }
  };
})(typeof window !== 'undefined' ? window : globalThis);