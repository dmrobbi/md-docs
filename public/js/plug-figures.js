/* md-docs plugin: figures (census 33). Self-authored.
 * postprocess: a standalone-paragraph <p><img ... alt="X" ...></p>
 * becomes <figure class="mdp-figure"><img ...><figcaption>X</figcaption></figure>.
 * Images without alt text are left untouched (the caption needs text).
 * The alt/caption = marked-escaped already (kept raw-in-html). */
(function (g) {
  'use strict';
  function figuresHook(html) {
    return String(html).replace(/<p><img\s([^>]*)alt="([^"]+)"([^>]*)><\/p>/g, function (m, a1, alt, a2) {
      var img = '<img ' + a1 + 'alt="' + alt + '"' + a2 + '>';
      return '<figure class="mdp-figure">' + img + '<figcaption>' + alt + '</figcaption></figure>';
    });
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.figures = { hooks: { postprocess: figuresHook } };
})(typeof window !== 'undefined' ? window : globalThis);