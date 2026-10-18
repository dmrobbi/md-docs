'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plug-attributes.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.attributes);

// class + id on a heading
const html = inst.parse('# Title {.red #mine}\n');
assert(html.includes('<h1 id="mine" class="red">'), 'id+class: ' + html.slice(0, 140));

// data-attr (quoted value)
const html2 = inst.parse('## Two {.data-x="1"}\n');
assert(html2.includes('data-x="1"'), 'data attr ok');

// event handlers NEVER emitted
const html3 = inst.parse('### Bad {onclick="alert(1)"}\n');
assert(!html3.includes('onclick'), 'no handlers ever: ' + html3.slice(0, 160));

// title attr ok
const html4 = inst.parse('### Safe {title="note"}\n');
assert(html4.includes('title="note"'), 'title attr ok');

// javascript: value form rejected
const html5 = inst.parse('## Evil {href="javascript:x"}\n');
assert(!html5.includes('javascript'), 'javascript value dropped: ' + html5.slice(0, 160));

// plain heading untouched
const html6 = inst.parse('# Plain Heading\n');
assert(!html6.includes('id="'), 'no attrs injected on plain');
assert(html6.includes('Plain Heading'), 'title intact');

console.log('ok test-attributes');