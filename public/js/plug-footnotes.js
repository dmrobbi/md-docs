/* md-docs plugin: footnotes (census 24). Self-authored, zero-dep.
 * WHY pre+post: marked treats "[^id]: text" as a link-reference
 * definition and silently consumes it — a postprocess-only detector
 * would never see it. The preprocess strips the def lines first
 * (single-line + indented continuation), stashing them; the
 * postprocess converts the [^id] refs to <sup> links and appends the
 * footnote section (the first-ref order, backrefs). The stash resets
 * at every preprocess, so stale state never crosses renders.
 * Missing definitions stay literal. */
(function (g) {
  'use strict';
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var stash = null;
  function preprocess(src) {
    stash = new Map();
    var lines = String(src).split('\n');
    var out = [];
    var defId = null;
    for (var i = 0; i < lines.length; i++) {
      var m = /^\[\^([A-Za-z0-9_-]+)\]:\s?(.*)$/.exec(lines[i]);
      if (m) { defId = m[1]; stash.set(defId, m[2]); continue; }
      if (defId && /^\s+\S/.test(lines[i])) {
        stash.set(defId, stash.get(defId) + '\n' + lines[i].trim());
        continue;
      }
      if (defId && lines[i].trim() === '') { defId = null; out.push(lines[i]); continue; }
      defId = null;
      out.push(lines[i]);
    }
    return out.join('\n');
  }
  function postprocess(html) {
    if (!stash || !stash.size) return html;
    var defs = stash;
    var order = [];
    var seen = new Set();
    html = String(html).replace(/\[\^([A-Za-z0-9_-]+)\]/g, function (m, id) {
      if (!defs.has(id)) return m;
      if (order.indexOf(id) === -1) order.push(id);
      var idAttr = seen.has(id) ? '' : ' id="mdp-fnref-' + esc(id) + '"';
      seen.add(id);
      return '<sup class="mdp-fn-ref"' + idAttr + '><a href="#mdp-fn-' + esc(id) + '">[' + esc(id) + ']</a></sup>';
    });
    var items = order.map(function (id) {
      return '<li id="mdp-fn-' + esc(id) + '"><span class="mdp-fn-text">' + defs.get(id) + '</span> <a href="#mdp-fnref-' + esc(id) + '" class="mdp-fn-back">&#8617;</a></li>';
    }).join('');
    return html + '<section class="mdp-footnotes"><hr><ol>' + items + '</ol></section>';
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.footnotes = { hooks: { preprocess: preprocess, postprocess: postprocess } };
})(typeof window !== 'undefined' ? window : globalThis);