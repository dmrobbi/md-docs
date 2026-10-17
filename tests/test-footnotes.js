'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js'); // the REAL marked v12
require('../public/js/plug-footnotes.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.footnotes);

const html = inst.parse('Text with a ref[^1] here.\n\n[^1]: The footnote text.\n');
assert(html.includes('<sup class="mdp-fn-ref"'), 'ref rendered');
assert(html.includes('href="#mdp-fn-1"'), 'ref href');
assert(html.includes('<section class="mdp-footnotes"'), 'section appended');
assert(html.includes('id="mdp-fn-1"'), 'def li');
assert(html.includes('mdp-fn-back'), 'backref link');
assert(html.includes('The footnote text.'), 'def text carried');
assert(!html.includes('[^1]:'), 'def line consumed');

// missing definition = the literal survives untouched
const html2 = inst.parse('Unresolved[^zz] tail.\n');
assert(html2.includes('Unresolved[^zz]'), 'missing def = literal');

// mixed id chars
const html3 = inst.parse('a[^a_b-2]\n\n[^a_b-2]: mixed id\n');
assert(html3.includes('mdp-fn-a_b-2'), 'mixed id carried');

// indented continuation collects
const html4 = inst.parse('x[^m]\n\n[^m]: first line\n    continued line\n');
assert(html4.includes('first line'), 'cont: first line');
assert(html4.includes('continued line'), 'cont: continued line');

// per-render freshness: a new parse restarts the stash (no -2/dupes)
const html5 = inst.parse('Second doc[^1] here.\n\n[^1]: second def\n');
assert(html5.includes('second def'), 'fresh render stash');
assert(!html5.includes('The footnote text'), 'no stale defs across renders');

// first-ref order of the section items
const html6 = inst.parse('use[^b] then[^a]\n\n[^a]: def a\n[^b]: def b\n');
const section = html6.slice(html6.indexOf('<section'));
assert(section.indexOf('mdp-fn-b') < section.indexOf('mdp-fn-a'), 'section = first-ref order');

console.log('ok test-footnotes');