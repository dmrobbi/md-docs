'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js'); // the REAL marked v12
require('../public/js/plug-chartjs.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.chartjs);
const F = '```';

const src = '{"type":"bar","data":{"labels":["a","b"],"datasets":[{"label":"n","data":[1,2]}]}}';
const html = inst.parse(F + 'chart\n' + src + '\n' + F + '\n');
assert(html.includes('<div class="mdp-chart" data-chart="chartjs"'), 'placeholder box');
assert(html.includes('data-src="' + src.replace(/"/g, '&quot;') + '"'), 'config carried escaped');

// other lang untouched (the fall-through chain intact)
const html2 = inst.parse(F + 'python\nx\n' + F + '\n');
assert(!html2.includes('mdp-chart'), 'other langs untouched');
assert(html2.includes('language-python'), 'python default render');

// the enhancer registered; the bad-JSON = the fallback (the browser-side; the absence of the Chart global here just exercises the guard-free enhance)
assert.strictEqual(typeof global.MDPluginEnhancers.chartjs, 'function', 'enhancer registered');
global.Chart = undefined; // guard-path: no crash without the lib
global.MDPluginEnhancers.chartjs({ dataset: {} }); // the shim-root; the no-crash check
console.log('ok test-chartjs');