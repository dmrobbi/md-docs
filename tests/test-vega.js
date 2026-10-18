'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plugins.js');
require('../public/js/plug-vega.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.vega);
const F = '```';

// both spec kinds get their boxes
const html = inst.parse(F + 'vegalite\n{"mark":"bar"}\n' + F + '\n');
assert(html.includes('<div class="mdp-vega" data-vega-kind="vegalite"'), 'vegalite box');
const html2 = inst.parse(F + 'vega\n{"mark":"bar"}\n' + F + '\n');
assert(html2.includes('data-vega-kind="vega"'), 'vega box');

// other lang untouched
const html3 = inst.parse(F + 'python\nx\n' + F + '\n');
assert(!html3.includes('mdp-vega'), 'other langs untouched');

// the enhancer registered; vega = the egress:true row (the loader gates the load/enable until confirmEgress)
assert.strictEqual(typeof global.MDPluginEnhancers.vega, 'function', 'enhancer registered');
const row = global.MDPlugins.byId.vega;
assert.strictEqual(row.egress, true, 'vega = the egress row by design');
assert.strictEqual(row.default, false, 'egress rows never default-on');
console.log('ok test-vega');