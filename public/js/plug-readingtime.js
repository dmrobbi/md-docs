/* md-docs plugin: reading time + word count (census 49). Enhancer-only.
 * Prepends ONE .mdp-reading badge: "~N min read · W words" (220 wpm,
 * min 1). Idempotent via the badge's presence check. */
(function (g) {
  'use strict';
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.readingtime = function (rootEl) {
    if (!g.document || !rootEl) return;
    if (rootEl.querySelector('.mdp-reading')) return;
    var text = (rootEl.textContent || '').trim();
    var words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    var mins = Math.max(1, Math.round(words / 220));
    var d = g.document.createElement('div');
    d.className = 'mdp-reading';
    d.textContent = '~' + mins + ' min read · ' + words + ' words';
    rootEl.insertBefore(d, rootEl.firstChild);
  };
})(typeof window !== 'undefined' ? window : globalThis);