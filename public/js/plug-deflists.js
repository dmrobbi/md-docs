/* md-docs plugin: definition lists (census 31). Self-authored.
 * TWO forms (probed against the real marked):
 * [1] COLLAPSED — marked soft-wraps: "Term\n: def one\n: def two" =
 *     ONE <p> whose first line is the term and whose following lines
 *     all start with optional-space ":" (a def line). -> dl/dt/dd.
 * [2] SEPARATE — <p>term</p> immediately followed by 1+ <p>: def</p>s.
 * A term line with a mid-text colon never matches ([^<>\n:]); plain
 * paragraphs are never touched. The empty-term state is never swallowed. */
(function (g) {
  'use strict';
  function deflistsHook(html) {
    var h = String(html);
    // [1] the collapsed form
    h = h.replace(/<p>([^<>\n:]{1,120})\n([\s\S]*?)<\/p>/g, function (m, term, rest) {
      var lines = rest.split('\n');
      var ok = lines.length && lines.every(function (l) { return /^\s*:\s?\S/.test(l); });
      if (!ok) return m;
      var desc = lines.map(function (l) {
        return '<dd>' + l.replace(/^\s*:\s?/, '') + '</dd>';
      }).join('');
      return '<dl><dt>' + term.trim() + '</dt>' + desc + '</dl>';
    });
    // [2] the separate form
    h = h.replace(
      /<p>([^<]{1,120})<\/p>\s*((?:<p>\s*:\s*[\s\S]*?<\/p>\s*)+)/g,
      function (m, term, defsBlock) {
        var t = term.trim();
        if (!t) return m;
        var desc = defsBlock.replace(/<p>\s*:\s*/g, '<dd>').replace(/<\/p>/g, '</dd>');
        return '<dl><dt>' + t + '</dt>' + desc + '</dl>';
      }
    );
    return h;
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.deflists = { hooks: { postprocess: deflistsHook } };
})(typeof window !== 'undefined' ? window : globalThis);