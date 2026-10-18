'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plug-wavedrom.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.wavedrom);
const F = '```';

const src = '{ signal: [{ name: "clk", wave: "p....." }] }';
const html = inst.parse(F + 'wavedrom\n' + src + '\n' + F + '\n');
assert(html.includes('<div class="mdp-diagram mdp-diagram-wavedrom" data-diagram="wavedrom"'), 'placeholder box');
assert(html.includes('data-src="' + src.replace(/"/g, '&quot;') + '"'), 'src with quote-escaping carried');

assert.strictEqual(typeof global.MDPluginEnhancers.wavedrom, 'function', 'enhancer registered');
console.log('ok test-wavedrom');