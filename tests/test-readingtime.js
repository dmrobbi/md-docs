'use strict';
const assert = require('assert');
global.window = global;
global.document = { createElement: function (tag) { return { tag: tag, className: '', textContent: '' }; } };
require('../public/js/plug-readingtime.js');
const R = global.MDPluginEnhancers.readingtime;

function fakeEl() {
  return {
    _first: null,
    _inserted: null,
    textContent: '',
    firstChild: { id: 'h-first' },
    querySelector: (s) => null,
    insertBefore: function (n) { this._first = n; this._inserted = n.textContent; },
  };
}

// 3 words -> minimum 1 min
const root = fakeEl();
root.textContent = 'one two three';
R(root);
assert.match(root._inserted, /~1 min read/, 'min 1');
assert.match(root._inserted, / · 3 words/, 'word count shown');

// 441 words at 220 wpm = 2 min
const root2 = fakeEl();
root2.textContent = Array.from({ length: 441 }, () => 'w').join(' ');
R(root2);
assert.match(root2._inserted, /~2 min read/, 'wpm math');

// idempotent: the badge present -> no second insert
const root3 = fakeEl();
root3.querySelector = (s) => ({ className: s });
R(root3);
assert.strictEqual(root3._inserted, null, 'no re-insert when present');

// empty doc = 0 words, still min-1
const root4 = fakeEl();
R(root4);
assert.match(root4._inserted, /~1 min read · 0 words/, 'empty doc shape');

console.log('ok test-readingtime');