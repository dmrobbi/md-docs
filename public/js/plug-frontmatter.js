/* md-docs plugin: YAML front-matter (census 32). Self-authored.
 * preprocess: a leading ---\n<yaml>\n--- block is stripped before parse;
 * the title/description keys (single-line, quotes stripped) stash into
 * window.MDFrontmatter for pane/API readers. A doc without front-matter
 * nulls the stash and passes the source untouched. */
(function (g) {
  'use strict';
  function preprocess(src) {
    var s = String(src);
    var m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(s);
    if (!m) { g.MDFrontmatter = null; return s; }
    var yaml = m[1];
    var fm = {};
    var t = /^title:\s*(.*)$/m.exec(yaml);
    if (t) fm.title = t[1].trim().replace(/^["']|["']$/g, '');
    var d = /^description:\s*(.*)$/m.exec(yaml);
    if (d) fm.description = d[1].trim().replace(/^["']|["']$/g, '');
    g.MDFrontmatter = fm;
    return s.slice(m[0].length);
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.frontmatter = { hooks: { preprocess: preprocess } };
})(typeof window !== 'undefined' ? window : globalThis);