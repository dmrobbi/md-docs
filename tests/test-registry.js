'use strict';
const assert = require('assert');
global.window = global; // the module pattern attaches to globalThis
require('../public/js/plugins.js');

const reg = global.MDPlugins;
assert.ok(reg && Array.isArray(reg.rows), 'registry object exists');
assert.ok(reg.byId && typeof reg.byId === 'object', 'byId map exists');

// plugin rows == census-derived count: 53 options - #37 (merged comment)
// - #40/#41 (one module) = 51
const plugins = reg.rows.filter((r) => r.kind === 'plugin');
assert.strictEqual(plugins.length, 51, 'plugin row count (census-derived)');

// ids unique across all rows (incl. verify kind)
const ids = reg.rows.map((r) => r.id);
assert.strictEqual(new Set(ids).size, ids.length, 'unique ids');

// every js/css url = https OR a tool-internal module path (js/…, css/…)
for (const r of plugins) {
  for (const u of (r.urls && r.urls.js) || []) assert.ok(/^https:\/\//.test(u) || /^(js|css)\//.test(u), 'https-or-internal js: ' + u);
  for (const u of (r.urls && r.urls.css) || []) assert.ok(/^https:\/\//.test(u) || /^(js|css)\//.test(u), 'https-or-internal css: ' + u);
}

// egress rows: default off, pane-gated
for (const r of plugins) {
  if (r.egress) assert.ok(!r.default, 'egress row default-off: ' + r.id);
}

// gated rows: default off
for (const r of plugins) {
  if (r.gated) assert.ok(!r.default, 'gated row default-off: ' + r.id);
}

// verify kind: exactly 2, phase 7, not loadable data shape
const verifies = reg.rows.filter((r) => r.kind === 'verify');
assert.strictEqual(verifies.length, 2, 'two verify rows');
verifies.forEach((r) => assert.ok(r.phase === 7, 'verify phase 7'));

// default batch ids (the owner-named first batch toggles)
const def = plugins.filter((r) => r.default).map((r) => r.id).sort();
assert.deepStrictEqual(def, ['alerts', 'asciinema', 'fencechrome', 'footnotes', 'headingids', 'katex', 'readingtime'], 'default batch');

// census cross-refs present on the scheduled rows
for (const r of plugins) {
  if (r.phase !== null) assert.ok(r.census !== null && r.census !== undefined, 'census ref: ' + r.id);
}

console.log('ok test-registry');