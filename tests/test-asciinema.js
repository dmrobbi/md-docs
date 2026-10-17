'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js'); // the REAL marked v12
require('../public/js/plug-asciinema.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.asciinema);

// url rides the fence CONTENT (marked v12 keeps only the first word of
// the info string — probed live); url = token.text
const F = '```';
const html = inst.parse(F + 'asciinema\nhttps://example.com/x.cast\n' + F + '\n');
assert(html.includes('<div class="mdp-cast"'), 'placeholder box, got: ' + html.slice(0, 120));
assert(html.includes('data-cast-url="https://example.com/x.cast"'), 'url carried from content');

// insecure scheme = marked's default code render
const html2 = inst.parse(F + 'asciinema\nhttp://insecure/x.cast\n' + F + '\n');
assert(!html2.includes('mdp-cast'), 'http rejected');

// other languages = untouched default
const html3 = inst.parse(F + 'python\nprint(1)\n' + F + '\n');
assert(!html3.includes('mdp-cast'), 'other langs untouched');
assert(html3.includes('language-python'), 'python default render');

// the url = attribute-escaped
const html4 = inst.parse(F + 'asciinema\nhttps://example.com/x.cast?a="1"\n' + F + '\n');
assert(html4.includes('&quot;1&quot;'), 'quote escaped');

// no url content (empty fence) = default render
const html5 = inst.parse(F + 'asciinema\n' + F + '\n');
assert(!html5.includes('mdp-cast'), 'empty content = default');

// the enhancer registered (the box-wiring side)
assert.strictEqual(typeof global.MDPluginEnhancers.asciinema, 'function', 'enhancer registered');

console.log('ok test-asciinema');