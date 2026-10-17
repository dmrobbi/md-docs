'use strict';
const assert = require('assert');
global.window = global;
require('../public/js/plugins.js');
require('../public/js/renderer-ui.js');
const R = global.MDRendererUI;
const reg = global.MDPlugins;

// the pane's row-source = the pure builder against the REAL registry
const enabled = { footnotes: true, katex: true, alerts: true, asciinema: true, fencechrome: true, headingids: true, readingtime: true };
const data = R.buildRows(reg, enabled);

// groups: first = diagrams, last = experience; only the non-empty groups
assert.strictEqual(data[0].group, 'diagrams', 'first group');
assert.strictEqual(data[data.length - 1].group, 'experience', 'last group');
assert.strictEqual(data[data.length - 1 - 1].group, 'maps', 'second-to-last group');

// per-row states
const flat = [];
data.forEach((d) => d.rows.forEach((r) => flat.push(r)));
assert.strictEqual(flat.length, 51, 'all plugin rows appear');

const rowOf = (id) => flat.find((r) => r.id === id);
assert.strictEqual(rowOf('katex').checked, true, 'default on');
assert.strictEqual(rowOf('mermaid').checked, false, 'non-default off');
const bpmn = rowOf('bpmn');
assert.strictEqual(bpmn.checked, false, 'gated unchecked');
assert.strictEqual(bpmn.disabled, true, 'gated disabled');
assert.strictEqual(bpmn.badge, 'not built', 'gated badge');
const kroki = rowOf('kroki');
assert.strictEqual(kroki.disabled, false, 'egress-non-gated knob enabled');
assert.strictEqual(kroki.badge, 'requires network', 'egress badge');
assert.strictEqual(kroki.kind, 'warn', 'egress warn kind');
assert.strictEqual(rowOf('footnotes').checked, true, 'footnotes on');

// gated overrides any enabled-state (double-safety)
const bad = Object.assign({}, enabled); bad['bpmn'] = true;
assert.strictEqual(R.buildRows(reg, bad).reduce((a, d) => a.concat(d.rows), []).find((r) => r.id === 'bpmn').checked, false, 'gated stays unchecked');

// counts
assert.strictEqual(R.enabledCount(enabled), 7, 'enabled count');
assert.strictEqual(R.enabledCount({}), 0, 'empty = 0');
const truthyFalse = Object.assign({}, enabled); truthyFalse['alerts'] = false;
assert.strictEqual(R.enabledCount(truthyFalse), 6, 'false override excludes');

console.log('ok test-renderer-ui');