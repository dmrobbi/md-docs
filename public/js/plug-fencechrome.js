/* md-docs plugin: fence chrome (census 23). Self-authored.
 * postprocess(html): <pre><code> blocks -> .mdp-pre box with the lang
 * label, a copy button, and per-line spans (the css counter line
 * numbers). The copy copies the RAW text (textContent = decoded — the
 * html-entities copy bug class avoided).
 * enhance(rootEl): wires the copy clicks via per-box dataset guard. */
(function (g) {
  'use strict';
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fenceChromeHook(html) {
    return String(html).replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, function (m, attrs, inner) {
      var lang = '';
      var lm = /language-([\w+#.-]+)/.exec(attrs || '');
      if (lm) lang = lm[1];
      var lines = inner.split('\n');
      while (lines.length && lines[lines.length - 1] === '') lines.pop();
      var numbered = lines.map(function (l) {
        return '<span class="mdp-line">' + l + '\n</span>';
      }).join('');
      return '<div class="mdp-pre" data-lang="' + esc(lang) + '" data-lines="' + lines.length + '">' +
        '<span class="mdp-lang">' + esc(lang) + '</span>' +
        '<button type="button" class="mdp-copy">copy</button>' +
        '<pre><code class="mdp-code">' + numbered + '</code></pre>' +
        '</div>';
    });
  }
  g.MDPluginUseObjects = g.MDPluginUseObjects || {};
  g.MDPluginUseObjects.fencechrome = { hooks: { postprocess: fenceChromeHook } };
  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.fencechrome = function (rootEl) {
    if (!g.document || !rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll('.mdp-pre').forEach(function (box) {
      if (box.dataset.mdpWired) return;
      box.dataset.mdpWired = '1';
      var btn = box.querySelector('.mdp-copy');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var code = box.querySelector('.mdp-code');
        var text = code ? code.textContent : '';
        try { if (g.navigator && g.navigator.clipboard) g.navigator.clipboard.writeText(text); } catch (e) { /* ignore */ }
        btn.textContent = 'copied';
        setTimeout(function () { btn.textContent = 'copy'; }, 1200);
      });
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);