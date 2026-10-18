'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plug-mscgen.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.mscgen);
const F = '```';

const html = inst.parse(F + 'mscgen\nmsc { a => b; }\n' + F + '\n');
assert(html.includes('<div class="mdp-diagram mdp-diagram-mscgen" data-diagram="mscgen"'), 'placeholder box');
assert(html.includes('data-src="msc { a =&gt; b; }"'), 'src escaped: ' + html.slice(0, 160));

assert.strictEqual(typeof global.MDPluginEnhancers.mscgen, 'function', 'enhancer registered');
console.log('ok test-mscgen');