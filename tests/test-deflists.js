'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plug-deflists.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.deflists);

const html = inst.parse('Term A\n: def one\n: def two\n');
assert(html.includes('<dl>'), 'dl built (the collapsed form): ' + html.slice(0, 150));
assert(html.includes('<dt>Term A</dt>'), 'term');
assert(html.includes('<dd>def one</dd>'), 'def 1');
assert(html.includes('<dd>def two</dd>'), 'def 2');

// no defs = no dl (plain paragraphs untouched)
const html2 = inst.parse('A normal para\n\nthen another\n');
assert(!html2.includes('<dl>'), 'no dl without def paragraphs');
assert(html2.includes('A normal para'), 'content intact');

// colon mid-text = never a def
const html3 = inst.parse('Time: 10:30 now\n');
assert(!html3.includes('<dl>'), 'mid-text colon not a def');
assert(html3.includes('Time: 10:30 now'), 'text intact');

console.log('ok test-deflists');