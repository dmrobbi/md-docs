/* md-docs plugin: heading ids + copy-link (census 29). Self-authored.
 * postprocess(html): h1-h6 -> id="mdp-<slug>" with per-render dedupe
 * (-1, -2 suffixes) + class mdp-heading.
 * enhance(rootEl): a hover "link" button per heading copying the
 * router-coherent shareable "#/doc/<id>/<slug>" form. */
(function (g) {
  'use strict';
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function headingIdsHook(html) {
    var counts = new Map();
    return String(html).replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, function (m, lvl, inner) {
      var text = inner
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
        trimmed = text.trim();
      var base = (trimmed.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')) || 'section';
      var n = counts.get(base) || 0;
      counts.set(base, n + 1);
      var slug = n === 0 ? base : base + '-' + n;
      return '<h' + lvl + ' id="mdp-' + esc(slug) + '" class="mdp-heading">' + inner + '</h' + lvl + '>';
    });
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.headingids = { hooks: { postprocess: headingIdsHook } };
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.headingids = function (rootEl) {
    if (!g.document || !rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll('.mdp-heading').forEach(function (h) {
      if (h.querySelector('.mdp-copy-link')) return;
      var btn = g.document.createElement('button');
      btn.type = 'button';
      btn.className = 'mdp-copy-link';
      btn.textContent = 'link';
      btn.setAttribute('aria-label', 'copy link to ' + h.textContent.slice(0, 50));
      btn.addEventListener('click', function () {
        var docId = (g.MDApp && g.MDApp.currentDoc) || '';
        var url = String(g.location.href).split('#')[0] + '#/doc/' + encodeURIComponent(docId) + '/' + h.id.replace(/^mdp-/, '');
        try { if (g.navigator && g.navigator.clipboard) g.navigator.clipboard.writeText(url); } catch (e) { /* ignore */ }
        btn.textContent = 'copied';
        setTimeout(function () { btn.textContent = 'link'; }, 1200);
      });
      h.appendChild(btn);
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);