'use strict';
// T6.1 tests: backlinks pure parts (detection, graph, html, scanner)
const assert = require('assert');
global.window = global;
global.document = { baseURI: 'https://md.example/docs/' };
require('../public/js/plug-backlinks.js');
const B = global.MDBacklinks;

assert.strictEqual(B.apiBase(), '/docs/', 'baseURI path resolution');

// --- detection (the doc-id hash scheme; raw + percent-encoded) ---
assert.strictEqual(B.mentionsSrc('see #/doc/notes.md please', 'notes.md'), true, 'raw mention');
assert.strictEqual(B.mentionsSrc('see #/doc/na%20tes.md please', 'na tes.md'), true, 'encoded mention');
assert.strictEqual(B.mentionsSrc('no mention here', 'notes.md'), false, 'absent');
assert.strictEqual(B.mentionsSrc('', 'notes.md'), false, 'empty src');
assert.strictEqual(B.mentionsSrc('#/doc/x', ''), false, 'empty id');
assert.strictEqual(B.mentionsSrc('#/doc/hub.md twice: #/doc/hub.md', 'hub.md'), true, 'repeated ref');

// decoded reference collection (order kept, decode errors tolerated)
assert.deepStrictEqual(
  B.collectRefs('a #/doc/na%20tes.md b #/doc/z.md'),
  ['na tes.md', 'z.md'],
  'collect + decode');

// --- the graph combiner: deterministic docs-order, self excluded ---
const docs = [
  { id: 'a.md', title: 'A' },
  { id: 'b.md', title: 'B' },
  { id: 'hub.md', title: 'Hub' },
];
const contents = {
  'a.md': 'link #/doc/hub.md',
  'b.md': 'nothing relevant',
  'hub.md': '#/doc/hub.md self',
};
assert.deepStrictEqual(
  B.buildGraphEntries(docs, contents, 'hub.md'),
  [{ id: 'a.md', title: 'A' }],
  'graph built; self excluded');

// --- section html: escaping + statuses ---
const html = B.sectionHtml([{ id: 'a<b>.md', title: 'Ti<tle>' }], null);
assert(html.includes('href="#/doc/a&lt;b&gt;.md"'), 'escaped href attr');
assert(html.includes('Ti&lt;tle&gt;'), 'escaped title text');
assert(B.sectionHtml([], 'scanning…').includes('scanning'), 'status line shape');
assert(B.sectionHtml(null, 'token needed').includes('token needed'), 'null entries + status');
assert(B.sectionHtml([], null).includes('no backlinks found'), 'empty state');

// --- the scanner: throttle + cache with fake async deps ---
(function () {
  let listCalls = 0;
  const contentCalls = {};
  let live = 0;
  let peak = 0;
  const deps = {
    list: () => { listCalls++; return Promise.resolve(docs); },
    content: (id) => {
      contentCalls[id] = (contentCalls[id] || 0) + 1;
      live++;
      peak = Math.max(peak, live);
      return new Promise((res) => setTimeout(() => { live--; res('ref #/doc/hub.md ' + id); }, 5));
    },
    concurrency: 2,
    textCache: new Map(),
    indexCache: new Map(),
  };
  const sc = B.createScanner(deps);
  sc.buildIndex('hub.md').then((r1) => {
    assert.deepStrictEqual(r1.entries.map((e) => e.id), ['a.md', 'b.md'], 'doc order preserved');
    assert.strictEqual(r1.cached, false, 'first build uncached');
    assert(peak <= 2, 'throttle respected (peak ' + peak + ' <= 2)');
    return sc.buildIndex('hub.md').then((r2) => {
      assert.strictEqual(r2.cached, true, 'second build hits the index cache');
      assert.strictEqual(listCalls, 2, 'list re-read once per build (fingerprint source)');
      assert.strictEqual(contentCalls['a.md'], 1, 'content fetched ONCE across builds (text cache)');
      assert.strictEqual(sc.stats().texts, 2, 'neighbor texts cached (self excluded)');
      console.log('ok test-backlinks');
    });
  }).catch((e) => { console.error(e); process.exit(1); });
})();