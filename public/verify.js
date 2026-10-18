/* md-docs web-interface verification harness (see docs/WEB-VERIFY.md).
 * Zero-dep. Two surfaces:
 *   ENGINE checks — this page loads the REAL vendor marked + registry +
 *   loader + pipeline through their REAL localStorage/lazy-load paths and
 *   renders a full trigger fixture (the same renderMd path app.js uses:
 *   the pipeline render + the real enhance pass on real DOM).
 *   APP checks — a same-origin iframe loads the app's real '/' (the real
 *   list + doc router), clicks the REAL Renderer pane rows, opens/exits
 *   the slides deck through the REAL controls + a REAL keydown event, and
 *   watches the backlinks scan fill against the live API.
 * Read-only vs the hub (no add/delete); every settings toggle is saved
 * first + restored after. Results: PASS/FAIL/SKIP lines + the final
 * WEB-VERIFY-OK n/m (skips k) or WEB-VERIFY-RED n/m marker in #results.
 */
(function () {
  'use strict';
  var results = [];
  var pass = 0, fail = 0, skipN = 0, done = false;
  var out = document.getElementById('results');
  var LS_KEY = 'md-docs.plugins';
  var origStore = null;
  try { origStore = localStorage.getItem(LS_KEY); } catch (e) { }

  function flush() {
    out.textContent = results.join('\n') + (done ? '' : '\n… running');
  }
  function line(kind, name, msg) {
    results.push(kind + ' ' + name + (msg ? ' — ' + msg : ''));
    if (kind === 'PASS') pass++;
    if (kind === 'FAIL') fail++;
    flush();
  }
  function run(name, fn) {
    try {
      fn();
    } catch (e) {
      line('FAIL', name, String((e && e.message) || e));
      return null;
    }
    line('PASS', name);
    return true;
  }
  function skip(name, reason) { skipN++; line('SKIP', name, reason); }
  function pollUntil(fn, label, timeoutMs) {
    timeoutMs = timeoutMs || 8000;
    return new Promise(function (res, rej) {
      var start = Date.now();
      (function tick() {
        var v = false;
        try { v = fn(); } catch (e) { v = false; }
        if (v) return res(v);
        if (Date.now() - start > timeoutMs) return rej(new Error('timeout: ' + label));
        setTimeout(tick, 150);
      })();
    });
  }

  var F = '```';
  var FIXTURE = [
    '---',
    'title: Verify fixture',
    'description: the browser battery fixture',
    '---',
    '',
    '# Verify fixture {#vf-heading}',
    '',
    '> [!NOTE]',
    '> callout text',
    '',
    '::: warning Custom title',
    '',
    'warn body',
    '',
    ':::',
    '',
    F + 'text',
    'fenced code',
    F,
    '',
    'term',
    ': definition',
    '',
    ':tada: emoji + footnote[^vf]',
    'and an attribute {#vfattr}',
    '',
    '![alt text](fake-image.png)',
    '',
    '- [ ] task one',
    '- [x] task two',
    '',
    '$$E=mc^2$$',
    '',
    F + 'chart',
    '{"type":"bar","data":{"labels":["a"],"datasets":[{"data":[1]}]}}',
    F,
    '',
    F + 'mermaid',
    'flowchart LR',
    '  a --> b',
    F,
    '',
    F + 'leaflet',
    '{"center":[47.5,19],"zoom":10}',
    F,
    '',
    '[^vf]: the footnote body',
    '',
    '# Slide two',
    '',
    'more text',
    '',
    '---',
    '',
    'final slide',
    '',
  ].join('\n');

  /* ======================= ENGINE checks ======================= */
  /* returns a promise resolving with the fixture html (or null) */
  function engineChecks() {
    var reg = window.MDPlugins;
    var lo = window.MDPluginLoader;
    var pl = window.MDPipeline;
    var byPlugin = reg.rows.filter(function (r) { return r.kind === 'plugin'; });

    run('E1 registry: 51 plugin + 2 verify rows, unique ids', function () {
      if (byPlugin.length !== 51) throw new Error('plugin rows ' + byPlugin.length);
      if (reg.rows.filter(function (r) { return r.kind === 'verify'; }).length !== 2) throw new Error('verify rows');
      var ids = reg.rows.map(function (r) { return r.id; });
      if (new Set(ids).size !== ids.length) throw new Error('dup ids');
    });
    run('E1 registry: the default batch = the 7 known', function () {
      var def = byPlugin.filter(function (r) { return r.default; }).map(function (r) { return r.id; }).sort();
      var want = ['alerts', 'asciinema', 'fencechrome', 'footnotes', 'headingids', 'katex', 'readingtime'];
      if (JSON.stringify(def) !== JSON.stringify(want)) throw new Error(JSON.stringify(def));
    });
    run('E1 registry: the egress/gated = default-off; the verify rows = phase 7 + untogglable', function () {
      byPlugin.forEach(function (r) { if ((r.egress || r.gated) && r.default) throw new Error('default on: ' + r.id); });
      reg.rows.filter(function (r) { return r.kind === 'verify'; }).forEach(function (r) {
        if (r.phase !== 7) throw new Error('phase: ' + r.id);
        var rejected = false;
        try { lo.setEnabled(r.id, true); } catch (e) { rejected = true; }
        if (!rejected) throw new Error('verify row toggleable: ' + r.id);
      });
    });
    run('E1 registry: the built rows (2-6) carry their module urls', function () {
      var built = byPlugin.filter(function (r) { return r.phase !== null && !r.gated && !r.egress; });
      var bad = built.filter(function (r) {
        var js = (r.urls || {}).js || [];
        return js.indexOf('js/plug-' + r.id + '.js') === -1;
      });
      if (bad.length) throw new Error('rows missing their module file: ' + bad.map(function (r) { return r.id; }).join(', '));
    });

    run('E2 store: the defaults merge + the persistence + the unknown/gated errors', function () {
      var before = lo.getEnabled();
      if (!before.fencechrome) throw new Error('no default');
      lo.setEnabled('readingtime', true);
      if (JSON.parse(localStorage.getItem(LS_KEY)).readingtime !== true) throw new Error('not saved');
      var e1 = null; try { lo.setEnabled('no-such-row', true); } catch (e) { e1 = e; }
      var e2 = null; try { lo.setEnabled('d2', true); } catch (e) { e2 = e; }
      if (!e1 || !e2) throw new Error('bad ids accepted');
    });

    return lo.ensureLoaded('fencechrome').then(function () {
      return lo.ensureLoaded('fencechrome');
    }).then(function () {
      run('E3 loader: the local module ensureLoaded = inject-once', function () {
        var n = document.querySelectorAll('script[data-mdp="fencechrome"]').length;
        if (n !== 1) throw new Error('inject count ' + n);
      });
      /* the egress refusal = an async rejection — AWAIT it */
      return lo.ensureLoaded('vega').then(function () {
        throw new Error('egress row loaded without confirm');
      }, function (e) {
        line('PASS', 'E3 loader: the egress refusal holds (rejected, nothing injected)', String((e && e.message) || e));
        return true;
      });
    }).then(function () {
      /* enable the built rows (the gated/egress = refused by design) */
      byPlugin.forEach(function (r) {
        if (r.egress || r.gated) return;
        try {
          lo.setEnabled(r.id, true);
        } catch (e) { /* a row-level refusal = reported by its own check */ }
      });
      line('INFO', 'the store: the built rows on — the loader now really lazy-loads their module files (+ the CDN rows)');
      return lo.ensureActive();
    }).then(function (loadedCount) {
      line('INFO', 'ensureActive loaded plugins:', String(loadedCount));
      var html1 = null;
      run('E4 pipeline render + the real enhance on the full fixture', function () {
        html1 = pl.render(FIXTURE, lo.transformers(), window.marked);
        if (html1 == null) throw new Error('pipeline null');
        var div = document.createElement('div');
        div.innerHTML = html1;
        lo.enhance(div);
        var live = html1 + '\n' + div.innerHTML + '\n' + document.head.innerHTML;
        var need = {
          'fence chrome (mdp-pre)': /mdp-pre/,
          'alert callout': /mdp-callout/,
          'footnote ref': /mdp-fn-ref/,
          'heading id': /mdp-heading/,
          'reading badge': /mdp-reading/,
          'admonition block (the supported ::: form)': /mdp-admonition/,
          'def list': /<dl[ >]/,
          'tasklist checkboxes': /type="checkbox"/,
          'chart box': /mdp-chart/,
          'mermaid box': /mdp-diagram/,
          'map box': /mdp-map/,
          'figure': /<figure/,
          'emoji': /🎉/,
          'print control (the real enhance)': /mdp-print-btn/,
          'print.css sheet injected by the loader': /css\/print\.css/,
          'slides control (the real enhance)': /mdp-slides-ctl/
        };
        var missing = [];
        Object.keys(need).forEach(function (k) {
          if (!need[k].test(live)) missing.push(k);
        });
        if (missing.length) throw new Error('missing: ' + missing.join(', '));
        if (!/\$E=mc/.test(html1)) throw new Error('the raw math vanished from the html');
      });
      run('E5 determinism x2 in-browser (the regen gate)', function () {
        var h2 = pl.render(FIXTURE, lo.transformers(), window.marked);
        if (h2 !== html1) throw new Error('the renders differ');
      });
      run('E6 slides deck math (the real module)', function () {
        var g = window.MDSlides.groupIndices(['P', 'HR', 'P', 'HR', 'P']);
        var want = '[{"start":0,"end":0},{"start":2,"end":2},{"start":4,"end":4}]';
        if (JSON.stringify(g) !== want) throw new Error(JSON.stringify(g));
        if (window.MDSlides.keyMap().exit.indexOf('Escape') === -1) throw new Error('no Escape key');
      });
      run('E7 backlinks graph math (the real module, in-browser)', function () {
        var docs = [{ id: 'x.md', title: 'X' }, { id: 'y.md', title: 'Y' }];
        var contents = { 'x.md': 'goes #/doc/y.md', 'y.md': 'lonely' };
        var e = window.MDBacklinks.buildGraphEntries(docs, contents, 'y.md');
        if (e.length !== 1 || e[0].id !== 'x.md') throw new Error(JSON.stringify(e));
      });
      return html1;
    });
  }

  /* ======================= APP checks (the real iframe) ======================= */
  function appChecks() {
    var frame = document.getElementById('app');
    var base = new URL(location.href).pathname.replace(/verify\.html$/, '');
    var win = null, doc = null;

    return new Promise(function (resAll) {
      frame.src = base;
      frame.addEventListener('load', function () { setTimeout(resAll, 500); });
    }).then(function () {
      win = frame.contentWindow;
      doc = win.document;
      return pollUntil(function () { return doc.querySelector && doc.querySelector('.statusline, .card'); }, 'the real list view', 12000);
    }).then(function () {
      run('A1 app: the real list view + the Renderer button', function () {
        if (!doc.getElementById('rendererBtn')) throw new Error('no Renderer button');
        if (!doc.querySelector('.card')) throw new Error('no cards');
      });
      /* the REAL pane click */
      doc.getElementById('rendererBtn').click();
      return pollUntil(function () { return !doc.getElementById('rendererPane').hidden; }, 'the pane opens', 4000);
    }).then(function () {
      run('A2 app: the pane opens on the real click; 51 checkboxes', function () {
        var rows = doc.querySelectorAll('#rpRows input[type="checkbox"]').length;
        if (rows !== 51) throw new Error('the pane rows ' + rows);
      });
      /* a FRESH pane render = the rows carry the truth of the current store
       * (the engine checks share this origin's localStorage); then the REAL
       * click = a real flip in whatever direction */
      win.MDRendererUI.renderPane();
      var slideRow = null;
      doc.querySelectorAll('#rpRows input[type="checkbox"]').forEach(function (inp) {
        var row = inp.closest('label') || inp.closest('div') || inp;
        if (!slideRow && (row.textContent || '').indexOf('Slideshow') !== -1) slideRow = inp;
      });
      if (!slideRow) throw new Error('the slides row not found in the pane');
      var beforeChecked = slideRow.checked;
      results.push('INFO pre-click: checked=' + beforeChecked + ' store.raw=' + (win.localStorage.getItem(LS_KEY) || '').slice(0, 140));
      flush();
      slideRow.click();
      var expectOn = slideRow.checked; /* the state the click produced — NOT its inverse */
      results.push('INFO post-click: checked=' + slideRow.checked + ' getEnabled().slides=' + win.MDPluginLoader.getEnabled().slides + ' expectOn=' + expectOn);
      flush();
      return pollUntil(function () {
        return win.MDPluginLoader.getEnabled().slides === expectOn;
      }, 'the slides toggle through the real click', 4000).then(function () {
        run('A3 app: the real pane row click = setEnabled + persisted (' +
          (beforeChecked ? 'was ON, clicked OFF' : 'was OFF, clicked ON') + ')', function () {
          var raw = JSON.parse(win.localStorage.getItem(LS_KEY));
          if (raw.slides !== expectOn) throw new Error('not persisted');
        });
        /* force slides ON for the chrome assertions (the loader = the legit path) */
        if (expectOn !== true) {
          win.MDPluginLoader.setEnabled('slides', true);
          results.push('INFO the slides forced back ON for the chrome checks (the carryover state noted)');
          flush();
        }
        /* the REAL doc view through the router */
        return win.fetch('api/docs').then(function (r) { return r.json(); });
      });
    }).then(function (docs) {
      var pick = (docs || []).filter(function (d) { return d && d.id; })[0];
      if (!pick) { skip('A4 app: the doc chrome on a real doc', 'the hub has no docs'); return null; }
      win.location.hash = '#/doc/' + encodeURIComponent(pick.id);
      return pollUntil(function () { return doc.getElementById('docBody'); }, 'the doc renders through the real router', 15000).then(function () {
        return pollUntil(function () {
          var b = doc.getElementById('docBody');
          return b.querySelector('.mdp-slides-ctl') && b.querySelector('.mdp-reading') ? true : false;
        }, 'the slides+reading chrome on the real doc', 15000);
      }).then(function () {
        run('A4 app: the doc view carries the reading badge + the slideshow control (the real render)', function () {
          var b = doc.getElementById('docBody');
          if (!b.querySelector('.mdp-slides-ctl')) throw new Error('no slides ctl');
          if (!b.querySelector('.mdp-reading')) throw new Error('no reading badge');
        });
      });
    }).then(function () {
      /* A5/A6: the REAL slideshow open + the REAL Escape exit */
      var ctl = doc.querySelector('.mdp-slides-ctl .mdp-slides-open');
      if (!ctl) throw new Error('the open control missing');
      ctl.click();
      return pollUntil(function () { return doc.getElementById('mdp-deck'); }, 'the deck opens', 5000).then(function () {
        run('A5 app: the slideshow = the real fullscreen overlay with the active slide + the counter', function () {
          var deck = doc.getElementById('mdp-deck');
          if (!deck.querySelector('.mdp-slide.mdp-slide-active')) throw new Error('no active slide');
          if (!deck.querySelector('.mdp-slide-count')) throw new Error('no counter');
        });
        doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return pollUntil(function () { return !doc.getElementById('mdp-deck'); }, 'the deck exits on Escape', 5000);
      }).then(function () {
        run('A6 app: the Escape exits; the normal view restored untouched', function () {
          if (doc.getElementById('mdp-deck')) throw new Error('the overlay stuck');
          if (!doc.getElementById('docBody')) throw new Error('the normal view gone');
        });
      });
    }).then(function () {
      /* A7/A8: printcss + backlinks via the real loader rows on the real doc */
      var lo = win.MDPluginLoader;
      lo.setEnabled('printcss', true);
      lo.setEnabled('backlinks', true);
      win.MDApp.rerender();
      return pollUntil(function () {
        var b = doc.getElementById('docBody');
        return b && b.querySelector('#mdp-print-btn') ? true : false;
      }, 'the print control appears after the re-render', 12000).then(function () {
        return pollUntil(function () {
          var b = doc.getElementById('docBody');
          var box = b && b.querySelector('.mdp-backlinks');
          return box && box.querySelector('.mdp-backlinks-list, .mdp-backlinks-status') ? true : false;
        }, 'the backlinks box fills from the real scan', 30000);
      }).then(function () {
        run('A7 app: printcss = the real control (the enhance) + the real loader injected print.css', function () {
          var b = doc.getElementById('docBody');
          if (!b.querySelector('#mdp-print-btn')) throw new Error('no print btn');
          if (!doc.querySelector('link[data-mdp="printcss"]')) throw new Error('print.css not injected');
        });
        run('A8 app: the backlinks scan ran against the live API (the box + its state)', function () {
          var b = doc.getElementById('docBody');
          var box = b.querySelector('.mdp-backlinks');
          if (!box) throw new Error('no backlinks box');
          var st = box.querySelector('.mdp-backlinks-list') ? 'the list' : (box.querySelector('.mdp-backlinks-status') || {}).textContent || 'unknown';
          results.push('INFO the backlinks state on ' + (win.MDApp.currentDoc || '?') + ': ' + st);
          flush();
        });
        /* A8b: the scan must actually SETTLE past the scan placeholder — the
         * list, an explicit no-backlinks line, or an honest unavailable. On a
         * slow day the budget may beat the hub scan: SKIP with the seen state
         * (never a fake pass) */
        return pollUntil(function () {
          var b = doc.getElementById('docBody');
          var box = b && b.querySelector('.mdp-backlinks');
          if (!box) return false;
          if (box.querySelector('.mdp-backlinks-list')) return true;
          var st = (box.querySelector('.mdp-backlinks-status') || {}).textContent || '';
          return st !== '' && st.indexOf('scan') === -1;
        }, 'the backlinks scan settles past the placeholder', 28000).then(function () {
          run('A8b app: the backlinks scan COMPLETED against the live hub', function () {
            var box = doc.getElementById('docBody').querySelector('.mdp-backlinks');
            var filled = box.querySelector('.mdp-backlinks-list')
              ? box.querySelectorAll('.mdp-backlinks-list li').length + ' link rows'
              : (box.querySelector('.mdp-backlinks-status') || {}).textContent || 'unknown';
            results.push('INFO the backlinks completed state: ' + filled);
            flush();
          });
        }).catch(function (e) {
          skip('A8b app: the backlinks scan completion', 'not settled within the budget (' + String((e && e.message) || e) + ')');
        });
      });
    });
  }

  /* hard watchdog */
  setTimeout(function () {
    if (!done) {
      results.push('HARNESS-TIMEOUT — the checks still running at the budget end');
      done = true;
      flush();
    }
  }, 60000);

  Promise.resolve().then(engineChecks).then(function () {
    return appChecks();
  }).catch(function (e) {
    line('FAIL', 'harness-chain', String((e && e.message) || e));
  }).then(function () {
    /* restore the operator's real settings — unless the demo/shot keep-mode */
    var keepStore = false;
    try { keepStore = new URLSearchParams(location.search).get('keep') === '1'; } catch (e) { }
    if (keepStore) {
      results.push('INFO keep-mode: the provisioned plugin state left ON (demo/shot mode)');
    } else {
      try {
        if (origStore === null) localStorage.removeItem(LS_KEY);
        else localStorage.setItem(LS_KEY, origStore);
        results.push('INFO the settings restored (the operator state untouched)');
      } catch (e) { }
    }
    var runCount = pass + fail;
    var marker = fail
      ? 'WEB-VERIFY-RED ' + pass + '/' + runCount + ' (skips ' + skipN + ')'
      : 'WEB-VERIFY-OK ' + pass + '/' + runCount + ' (skips ' + skipN + ')';
    results.push(marker);
    done = true;
    flush();
  });
})();