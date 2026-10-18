/* md-docs plugin: print / PDF stylesheet (census 53). Self-authored. T6.3.
 * Adds the ONE "Print / PDF" control at the article head; the print view
 * itself = css/print.css (this task's exclusive stylesheet — every rule
 * inside @media print, so the loader can inject it as a plain sheet
 * without touching the screen view). Math (KaTeX) and DOM-diagram svg /
 * canvas render in-print because the enhance passes already ran when the
 * doc opened — no second render path, the button just prints the live
 * body. Page-break-aware rules + external-href expansion live in the
 * stylesheet; the control hides itself under print (mdp-print-ctl).
 */
(function (g) {
  'use strict';
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.printcss = function (rootEl) {
    if (!g.document || !rootEl) return;
    if (rootEl.querySelector && rootEl.querySelector('#mdp-print-btn')) return;
    var b = g.document.createElement('button');
    b.id = 'mdp-print-btn';
    b.className = 'mdp-print-ctl btn tiny';
    b.innerHTML = 'Print / PDF';
    b.addEventListener('click', function () {
      if (typeof g.print === 'function') g.print();
    });
    if (rootEl.insertBefore) rootEl.insertBefore(b, rootEl.firstChild);
  };
})(typeof window !== 'undefined' ? window : globalThis);