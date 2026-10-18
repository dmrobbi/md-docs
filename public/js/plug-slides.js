/* md-docs plugin: slideshow mode (census 52). Self-authored, zero-dep.
 * T6.2. Direct-child <hr> elements (the rendered form of the --- separator)
 * split the rendered document into slides; the control opens a fullscreen
 * deck overlay built from CLONES — the underlying view is never mutated,
 * so exiting restores the normal view by simply removing the overlay.
 * Keys (while the deck is open): ArrowRight / Space / PageDown / n = next;
 * ArrowLeft / PageUp / p = prev; Home / End = first / last; Escape = exit.
 * Buttons mirror the keys. Styles = mdp-plugins.css (the INT task);
 * groupIndices() = the pure deck math (tests cover it without DOM).
 * NOTE on pure-vs-hr: any direct-child <hr> splits (*** / ___ render to
 * hr too) — the census says the --- separators; hr = the rendered form.
 */
(function (g) {
  'use strict';

  var KEYS = {
    next: ['ArrowRight', 'PageDown', ' ', 'n'],
    prev: ['ArrowLeft', 'PageUp', 'p'],
    first: ['Home'],
    last: ['End'],
    exit: ['Escape'],
  };
  function keyMap() { return JSON.parse(JSON.stringify(KEYS)); }

  /* tags: node-name sequence of direct children. Returns [{start,end}]
   * slide index ranges: boundaries at every 'HR'; empty groups never
   * emitted (edges / adjacent hrs). A doc with NO hr at all = the whole
   * doc as one slide (the fallback). A pure-hr doc falls the same way —
   * the DOM deck builder drops whitespace-only groups and refuses to
   * open a slideless deck (kept as the whole-doc group here so the
   * pure math stays total). */
  function groupIndices(tags) {
    var groups = [];
    var start = -1;
    for (var i = 0; i <= tags.length; i++) {
      var t = i < tags.length ? tags[i] : 'HR'; /* sentinel closes the tail */
      if (t === 'HR') {
        if (start >= 0 && i > start) groups.push({ start: start, end: i - 1 });
        start = -1;
      } else if (start < 0) {
        start = i;
      }
    }
    return groups.length ? groups : (tags.length ? [{ start: 0, end: tags.length - 1 }] : []);
  }

  g.MDSlides = { groupIndices: groupIndices, keyMap: keyMap };

  /* --- DOM wiring --- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  g.MDPluginEnhancers = g.MDPluginEnhancers || {};
  g.MDPluginEnhancers.slides = function (rootEl) {
    if (!g.document || !rootEl) return;
    if (rootEl.querySelector && rootEl.querySelector('.mdp-slides-ctl')) return;
    var doc = g.document;
    var ctl = doc.createElement('div');
    ctl.className = 'mdp-slides-ctl';
    var open = doc.createElement('button');
    open.className = 'mdp-slides-open btn tiny';
    open.innerHTML = 'Slideshow';
    ctl.appendChild(open);
    rootEl.insertBefore(ctl, rootEl.firstChild);
    open.addEventListener('click', function () { openDeck(rootEl, open); });
  };

  function openDeck(rootEl, returnFocus) {
    var doc = g.document;
    if (doc.getElementById && doc.getElementById('mdp-deck')) return; /* one deck at a time */
    var kids = [];
    for (var i = 0; i < rootEl.children.length; i++) kids.push(rootEl.children[i]);
    var tags = kids.map(function (el) { return el.nodeName; });
    var groups = groupIndices(tags).map(function (gi) {
      return kids.slice(gi.start, gi.end + 1).filter(function (el) {
        if ((el.textContent || '').trim() !== '') return true;
        return /IMG|SVG|CANVAS|VIDEO|AUDIO|IFRAME/.test(el.nodeName || '')
          || (el.querySelector && el.querySelector('img,svg,canvas,video,audio,iframe,pre,table'));
      });
    }).filter(function (gr) { return gr.length; });
    if (!groups.length) return; /* slideless: keep the normal view */

    var overlay = doc.createElement('div');
    overlay.id = 'mdp-deck';
    overlay.className = 'mdp-deck-overlay';
    overlay.setAttribute('tabindex', '0');
    var frame = doc.createElement('div');
    frame.className = 'mdp-slide-frame';
    var slides = [];
    groups.forEach(function (gr) {
      var s = doc.createElement('div');
      s.className = 'mdp-slide';
      gr.forEach(function (el) { s.appendChild(el.cloneNode(true)); });
      frame.appendChild(s);
      slides.push(s);
    });
    var count = doc.createElement('div');
    count.className = 'mdp-slide-count';
    var controls = doc.createElement('div');
    controls.className = 'mdp-slide-controls';
    ['mdp-slide-first', 'mdp-slide-prev', 'mdp-slide-next', 'mdp-slide-last', 'mdp-slide-exit'].forEach(function (cls, ix) {
      var b = doc.createElement('button');
      b.className = 'btn tiny ' + cls;
      b.innerHTML = esc(['&laquo; first', '&larr; prev', 'next &rarr;', 'last &raquo;', 'exit (Esc)'][ix]);
      controls.appendChild(b);
    });
    overlay.appendChild(frame);
    overlay.appendChild(count);
    overlay.appendChild(controls);
    doc.body.appendChild(overlay);

    var at = 0;
    function show() {
      for (var i = 0; i < slides.length; i++) {
        slides[i].className = 'mdp-slide' + (i === at ? ' mdp-slide-active' : '');
      }
      count.innerHTML = esc((at + 1) + ' / ' + slides.length);
    }
    function move(d) { jump(at + d); }
    function jump(to) { at = Math.max(0, Math.min(slides.length - 1, to)); show(); }
    function close() {
      doc.removeEventListener('keydown', onKey, true);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (returnFocus && returnFocus.focus) returnFocus.focus();
    }
    function keyAction(k) {
      if (KEYS.exit.indexOf(k) !== -1) return close();
      if (KEYS.next.indexOf(k) !== -1) return move(1);
      if (KEYS.prev.indexOf(k) !== -1) return move(-1);
      if (KEYS.last.indexOf(k) !== -1) return jump(slides.length - 1);
      if (KEYS.first.indexOf(k) !== -1) return jump(0);
    }
    function onKey(e) { keyAction(e.key); }
    for (var c = 0; c < controls.children.length; c++) {
      (function (el) {
        el.addEventListener('click', function () {
          if (el.className.indexOf('mdp-slide-first') !== -1) return jump(0);
          if (el.className.indexOf('mdp-slide-prev') !== -1) return move(-1);
          if (el.className.indexOf('mdp-slide-next') !== -1) return move(1);
          if (el.className.indexOf('mdp-slide-last') !== -1) return jump(slides.length - 1);
          if (el.className.indexOf('mdp-slide-exit') !== -1) return close();
        });
      })(controls.children[c]);
    }
    doc.addEventListener('keydown', onKey, true);
    show();
    if (overlay.focus) overlay.focus();
  }
})(typeof window !== 'undefined' ? window : globalThis);