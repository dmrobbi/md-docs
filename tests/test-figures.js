'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plug-figures.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.figures);

// alt image -> figure + figcaption
const html = inst.parse('![A red apple](https://example.com/apple.png)\n');
assert(html.includes('<figure class="mdp-figure">'), 'figure wrapped');
assert(html.match(/<figcaption>A red apple<\/figcaption>/), 'caption = alt');

// no-alt = untouched
const html2 = inst.parse('![](https://example.com/noalt.png)\n');
assert(!html2.includes('<figure'), 'no-alt = plain');
assert(html2.includes('<img src="https://example.com/noalt.png" alt="">'), 'img intact');

// images not alone in a paragraph stay untouched
const html3 = inst.parse('inline ![x](y.png) text\n');
assert(!html3.includes('<figure'), 'inline img not wrapped');

console.log('ok test-figures');