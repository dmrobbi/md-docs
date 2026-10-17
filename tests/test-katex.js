'use strict';
const assert = require('assert');
global.window = global;
require('../public/js/plug-katex.js');
const K = global.MDPluginEnhancers.katex;

let calls = [];
global.renderMathInElement = function (el, opts) { calls.push({ el, opts }); };
const fakeRoot = { id: 'docBody' };
K(fakeRoot);
assert.strictEqual(calls.length, 1, 'one render pass');
const opts = calls[0].opts;

// THE CRITICAL: pre + code ignored (the math-in-code test's basis)
assert(opts.ignoredTags.indexOf('pre') !== -1, 'pre ignored');
assert(opts.ignoredTags.indexOf('code') !== -1, 'code ignored');

// no bare-$ delimiter (the currency false-positive class)
assert.deepStrictEqual(opts.delimiters.map((d) => d.left), ['$$', '\\[', '\\('], 'delimiters: $$ + brackets only');
assert.strictEqual(opts.delimiters[0].display, true, '$$ display');
assert.strictEqual(opts.delimiters[2].display, false, '\\( inline');
assert.strictEqual(opts.throwOnError, false, 'bad latex = visible-not-crash');

// absence of the global = graceful no-op
delete global.renderMathInElement;
calls = [];
K(fakeRoot);
assert.strictEqual(calls.length, 0, 'no renderMathInElement = no-op');

// restore + the fake-root-shape variance (no id)
global.renderMathInElement = function (el, o) { calls.push({ el, o }); };
K({ id: 'other' });
assert.strictEqual(calls.length, 1, 'any root works');

console.log('ok test-katex');