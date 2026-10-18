/* md-docs plugin: admonitions/containers (census 26). Self-authored.
 * ::: kind [title] ... ::: -> themed div. Marked renders the fence lines
 * as plain paragraphs (<p>::: note T</p> ... <p>:::</p>) so the hook is a
 * single-level pairing over the html. Unclosed fences are never swallowed
 * (they stay as plain paragraphs). Nested code fences inside = carried
 * (the body is the rendered html between the p-markers).
 * Titles carry the inline-rendered fragments as marked emitted them. */
(function (g) {
  'use strict';
  var ALLOWED = { note: 1, tip: 1, warning: 1, danger: 1, info: 1, example: 1, quote: 1 };
  function admonitionHook(html) {
    return String(html).replace(
      /<p>\s*:::\s*([\w-]+)?([^\n<]*)<\/p>([\s\S]*?)<p>\s*:::\s*<\/p>/g,
      function (m, kind, title, body) {
        var k = (kind && ALLOWED[kind.toLowerCase()]) ? kind.toLowerCase() : 'note';
        var t = (title || '').trim();
        return '<div class="mdp-admonition mdp-' + k + '">' +
          (t ? '<div class="mdp-adv-title">' + t + '</div>' : '') +
          body +
          '</div>';
      }
    );
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.admonitions = { hooks: { postprocess: admonitionHook } };
})(typeof window !== 'undefined' ? window : globalThis);