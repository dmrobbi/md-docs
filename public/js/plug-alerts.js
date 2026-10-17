/* md-docs plugin: GitHub-style alerts (census 25). Self-authored.
 * postprocess(html): "> [!KIND]" blockquote openers (NOTE/TIP/IMPORTANT/
 * WARNING/CAUTION) -> callout blockquotes with per-kind classes; the
 * marker paragraph is removed (the visible title = css ::before);
 * plain blockquotes and unknown [!X] markers stay untouched. */
(function (g) {
  'use strict';
  function alertsHook(html) {
    return String(html).replace(/<blockquote>\n<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n/g, function (m, kind) {
      return '<blockquote class="mdp-callout mdp-' + kind.toLowerCase() + '">\n<p>';
    });
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.alerts = { hooks: { postprocess: alertsHook } };
})(typeof window !== 'undefined' ? window : globalThis);