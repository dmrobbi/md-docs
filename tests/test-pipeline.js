'use strict';
const assert = require('assert');
global.window = global;
require('../public/js/md-pipeline.js');
const pipeline = global.MDPipeline;

const fakeMarkedGlobal = {
  Marked: function () {
    this.used = [];
    this.use = (x) => { this.used.push(x); return this; };
    this.parse = (src) => 'parsed[' + src + ']:' + this.used.join('|');
  },
};
global.marked = fakeMarkedGlobal;

const transformers = [
  { id: 'bplug', phase: 2, fn: (m) => m.use('b') },
  { id: 'aplug', phase: 1, fn: (m) => m.use('a') },
  { id: 'cplug', phase: 2, fn: (m) => m.use('c') },
];

// registry order: phase asc, then id
assert.strictEqual(pipeline.render('S', transformers), 'parsed[S]:a|b|c', 'order phase,id');
// determinism x2 (the regen gate): same input twice = byte-equal
assert.strictEqual(pipeline.render('S', transformers), pipeline.render('S', transformers), 'deterministic x2');

// empty transformers = clean parse
assert.strictEqual(pipeline.render('X', []), 'parsed[X]:', 'no transformers');

// no marked instance API -> null (fallback path)
assert.strictEqual(pipeline.render('Y', transformers, {}), null, 'no Marked API -> null');
assert.ok(pipeline.render('Y', transformers, undefined), 'undefined markedGlobal defaults to the global');

// transformers: not mutated (slice)
const original = [transformers[1], transformers[0]];
assert.strictEqual(pipeline.render('Z', original), 'parsed[Z]:a|b', 'input order irrelevant');
assert.strictEqual(original[0], transformers[1], 'input array untouched');

// phase default 999 for non-number phase
const mixed = [
  { id: 'gated', phase: null, fn: (m) => m.use('g') },
  { id: 'first', phase: 3, fn: (m) => m.use('f') },
];
assert.strictEqual(pipeline.render('M', mixed), 'parsed[M]:f|g', 'null-phase = last');

console.log('ok test-pipeline');