'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js'); // the REAL marked v12
require('../public/js/plug-mermaid.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.mermaid);
const F = '```';

const html = inst.parse(F + 'mermaid\nflowchart LR\n  a-->b\n' + F + '\n');
assert(html.includes('<div class="mdp-diagram mdp-diagram-mermaid" data-diagram="mermaid"'), 'placeholder box');
assert(html.includes('data-src="flowchart LR\n  a--&gt;b"'), 'raw src single-escaped: ' + html.slice(0, 160));

// other lang = the full default fall-through
const html2 = inst.parse(F + 'python\nx\n' + F + '\n');
assert(!html2.includes('mdp-diagram'), 'other lang untouched');
assert(html2.includes('language-python'), 'python default render');

// the enhancer registered
assert.strictEqual(typeof global.MDPluginEnhancers.mermaid, 'function', 'enhancer registered');

console.log('ok test-mermaid');