'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plug-graphviz.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.graphviz);
const F = '```';

const html = inst.parse(F + 'dot\ndigraph { a -> b }\n' + F + '\n');
assert(html.includes('<div class="mdp-diagram mdp-diagram-dot" data-diagram="dot"'), 'placeholder box');
assert(html.includes('data-src="digraph { a -&gt; b }"'), 'src escaped: ' + html.slice(0, 160));

// non-dot langs (the python) = the untouched default
const html2 = inst.parse(F + 'python\nx\n' + F + '\n');
assert(!html2.includes('mdp-diagram'), 'non-dot untouched');

assert.strictEqual(typeof global.MDPluginEnhancers.graphviz, 'function', 'enhancer registered');
console.log('ok test-graphviz');