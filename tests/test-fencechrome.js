'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plug-fencechrome.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.fencechrome);

const html = inst.parse('```python\na = 1 < 2 & 3\nb = "x"\n```\n');
assert(html.includes('<div class="mdp-pre" data-lang="python"'), 'box + lang');
assert(html.match(/data-lines="2"/), 'two lines counted');
assert(html.includes('<span class="mdp-lang">python</span>'), 'lang label');
assert(html.match(/<button type="button" class="mdp-copy">copy<\/button>/), 'copy button');
assert(html.includes('&lt;'), 'esc preserved in html (the raw copy = decode at click)');
assert(html.includes('<span class="mdp-line">a = 1 &lt; 2 &amp; 3'), 'line span 1');
assert(html.includes('<span class="mdp-line">b = &quot;x&quot;'), 'line span 2');

// no-lang fence = the empty lang
const html2 = inst.parse('```\nplain\n```\n');
assert(html2.includes('data-lang=""'), 'no lang = empty');

// the infostring's extra args = the first token = the lang
const html3 = inst.parse('```js extra args\nx\n```\n');
assert(html3.includes('data-lang="js"'), 'first token lang');
assert(html3.includes('data-lines="1"'), 'single line');

// inline code untouched
const html4 = inst.parse('use `inline code` here\n');
assert(!html4.includes('mdp-pre'), 'inline code not boxed');
assert(html4.includes('<code>inline code</code>'), 'inline intact');

// the copy = the RAW: the esc's entities decode via textContent — the wire's
// read path is browser-side; here we assert the raw-equivalent presence
const inner = html4.includes('inline code');
assert(inner, 'sanity');
// the enhancer registers
assert.strictEqual(typeof global.MDPluginEnhancers.fencechrome, 'function', 'enhancer registered');

console.log('ok test-fencechrome');