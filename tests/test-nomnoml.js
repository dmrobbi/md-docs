'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plug-nomnoml.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.nomnoml);
const F = '```';

const html = inst.parse(F + 'nomnoml\n[A] -> [B]\n' + F + '\n');
assert(html.includes('<div class="mdp-diagram mdp-diagram-nomnoml" data-diagram="nomnoml"'), 'placeholder box');
assert(html.includes('data-src="[A] -&gt; [B]"'), 'src carried escaped');

// other lang untouched (incl. the sibling diagram langs = the chain)
const html2 = inst.parse(F + 'mermaid\nflowchart\n' + F + '\n');
assert(!html2.includes('mdp-diagram-nomnoml'), 'mermaid lang not claimed by nomnoml');

assert.strictEqual(typeof global.MDPluginEnhancers.nomnoml, 'function', 'enhancer registered');
console.log('ok test-nomnoml');