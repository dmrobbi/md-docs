'use strict';
// T6.4 — the experience-family battery (phase 6 gate): registry rows,
// the combo render determinism, the solo-store isolation, the pure parts
// of all three plugins together on one fixture.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
global.window = global;
global.marked = require('../public/vendor/marked.min.js'); // the REAL marked
require('../public/js/plugins.js');
require('../public/js/plugin-loader.js');
require('../public/js/md-pipeline.js');
require('../public/js/plug-backlinks.js');
require('../public/js/plug-slides.js');
require('../public/js/plug-printcss.js');
// the phase-2 chain the combo stage enables (battery-charts parity: the
// store rows without their modules = silent no-op transforms — the exact
// bug this battery caught on the first run)
require('../public/js/plug-footnotes.js');
require('../public/js/plug-alerts.js');
require('../public/js/plug-headingids.js');
require('../public/js/plug-fencechrome.js');
require('../public/js/plug-readingtime.js');
require('../public/js/plug-katex.js');
require('../public/js/plug-asciinema.js');
const loader = global.MDPluginLoader;
const pipeline = global.MDPipeline;
const reg = global.MDPlugins;
const B = global.MDBacklinks;
const S = global.MDSlides;

// --- the rows carry the phase-6 modules (zero CDN = local files only) ---
assert.deepStrictEqual(reg.byId.backlinks.urls, { js: ['js/plug-backlinks.js'] }, 'backlinks row urls');
assert.deepStrictEqual(reg.byId.slides.urls, { js: ['js/plug-slides.js'] }, 'slides row urls');
assert.deepStrictEqual(reg.byId.printcss.urls, { js: ['js/plug-printcss.js'], css: ['css/print.css'] }, 'printcss row urls');
['backlinks', 'slides', 'printcss'].forEach(function (k) {
  const r = reg.byId[k];
  assert.strictEqual(r.kind, 'plugin', k + ' toggleable kind');
  assert.strictEqual(r.gated, false, k + ' not gated');
  assert.strictEqual(r.egress, false, k + ' local-only (no egress)');
  assert.strictEqual(r.phase, 6, k + ' phase 6');
});

const F = '```';
const fixture = [
  '# Experience fixture',
  '',
  'intro para',
  '',
  '---',
  '',
  'slide two with a fence:',
  F + 'text',
  'fenced',
  F,
  '',
  'and a footnote[^1]',
  '',
  '---',
  '',
  'final slide',
  '',
  '[^1]: the footnote rides along',
  '',
].join('\n');

// --- combo render: deterministic x2 (the regen gate); the hr split
// markers survive; the phase-2 default chain stays intact ---
loader.setStoreHost({
  get: () => JSON.stringify({ backlinks: true, slides: true, printcss: true, fencechrome: true, footnotes: true, headingids: true, alerts: true, readingtime: true }),
  set: () => {},
});
const html = pipeline.render(fixture, loader.transformers(), global.marked);
assert(html.includes('<hr>'), 'hr split markers present for the deck');
assert((html.match(/class="mdp-pre"/g) || []).length === 1, 'fence chrome once (full-scoped count)');
assert(html.includes('mdp-fn-ref') || html.includes('footnote'), 'footnotes chain rides along');
const html2 = pipeline.render(fixture, loader.transformers(), global.marked);
assert.strictEqual(html, html2, 'deterministic combined exp render');

// --- solo-store isolation: with the three enabled ALONE (or off) the
// pipeline html must be byte-identical across them (enhance-only family:
// zero pipeline perturbation even solo) ---
const stores = [{}, { backlinks: true }, { slides: true }, { printcss: true }];
const soloRefs = stores.map(function (st) {
  loader.setStoreHost({
    get: () => JSON.stringify(st),
    set: () => {},
  });
  return pipeline.render(fixture, loader.transformers(), global.marked);
});
soloRefs.forEach(function (h, ix) {
  assert.strictEqual(h, soloRefs[0], 'solo store #' + ix + ' renders like the empty store: ' + JSON.stringify(stores[ix]));
});

// --- backlinks: the mini-hub graph + the section surface ---
loader.setStoreHost({
  get: () => JSON.stringify({ backlinks: true, slides: true, printcss: true }),
  set: () => {},
});
const docs = [{ id: 'x.md', title: 'X' }, { id: 'y.md', title: 'Y' }];
const contents = { 'x.md': 'goes #/doc/y.md', 'y.md': 'lonely' };
assert.deepStrictEqual(
  B.buildGraphEntries(docs, contents, 'y.md'),
  [{ id: 'x.md', title: 'X' }],
  'mini hub graph');
assert(B.sectionHtml([{ id: 'y.md', title: 'Y' }]).includes('mdp-backlinks-head'), 'backlinks section marker');
assert(B.mentionsSrc('ref #/doc/y.md', 'y.md'), 'detection rides');

// --- slides: the fixture's deck math + the key surface ---
assert.deepStrictEqual(
  S.groupIndices(['H1', 'P', 'HR', 'P', 'HR', 'P']),
  [{ start: 0, end: 1 }, { start: 3, end: 3 }, { start: 5, end: 5 }],
  'fixture grouping (3 slides)');
const km = S.keyMap();
assert(km.exit.indexOf('Escape') !== -1, 'deck exit reachable');

// --- print: the sheet rides the row + stays print-scoped ---
const css = fs.readFileSync(path.join(__dirname, '../public/css/print.css'), 'utf8');
assert(css.includes('@media print'), 'print sheet scoped');
assert(css.includes('.mdp-print-ctl') && css.includes('.mdp-slides-ctl'), 'plugin controls hidden on paper');
assert(typeof global.MDPluginEnhancers.printcss === 'function', 'print control enhancer present');

console.log('ok battery-exp');