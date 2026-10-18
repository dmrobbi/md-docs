/* md-docs plugin: attributes (census 27). Self-authored; scope = heading
 * tails only: '# Title {.red #id k="v"}' -> id/class/safe key-values.
 * Allow-list for key=value attrs: title + data-* ONLY (event handlers
 * are never emitted, ever). Tokens that are not .class/#id/key=value
 * shapes are ignored silently (the block stays plain text). */
(function (g) {
  'use strict';
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function decodeEnt(s) {
    return String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  }
  function parseAttrs(str) {
    var cls = [];
    var id = '';
    var extra = '';
    String(str || '').trim().split(/\s+/).forEach(function (tok) {
      if (!tok) return;
      if (/^\.[\w-]+$/.test(tok)) { cls.push(tok.slice(1)); return; }
      if (/^#[\w-]+$/.test(tok)) { if (!id) id = tok.slice(1); return; }
      var m = /^(\.?)([\w-]+)=(.*)$/.exec(tok);
      if (m) {
        var k = m[2].toLowerCase();
        var v = m[3].replace(/^"(.*)"$/, '$1');
        if (/^(title|data-[a-z][\w-]*)$/.test(k) && v) extra += ' ' + k + '="' + esc(v) + '"';
      }
      /* anything else (bare words, javascript:, handlers) = ignored */
    });
    var s = id ? ' id="' + esc(id) + '"' : '';
    if (cls.length) s += ' class="' + esc(cls.join(' ')) + '"';
    return s + extra;
  }
  function attrsHook(html) {
    return String(html).replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/g, function (h, lvl, existingAttrs, inner) {
      var am = /\{([^\n{}]*)\}\s*$/.exec(inner);
      if (!am) return h;
      var attrs = parseAttrs(decodeEnt(am[1]));
      var title = inner.slice(0, am.index).replace(/\s+$/, '');
      return '<h' + lvl + existingAttrs + attrs + '>' + title + '</h' + lvl + '>';
    });
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.attributes = { hooks: { postprocess: attrsHook } };
})(typeof window !== 'undefined' ? window : globalThis);