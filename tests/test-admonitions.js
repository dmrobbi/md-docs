'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plug-admonitions.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.admonitions);

const html = inst.parse('::: warning Watch out\n\nplain **bold** text\n\n:::\n');
assert(html.includes('<div class="mdp-admonition mdp-warning">'), 'warning div: ' + html.slice(0, 150));
assert(html.indexOf('Watch out') !== -1, 'title carried');
assert(html.includes('<strong>bold</strong>'), 'inline inside');

// unclosed = plain paragraphs, content survives
const html2 = inst.parse('::: note never closed here\n');
assert(html2.includes('never closed'), 'content survives');
assert(!html2.includes('mdp-admonition'), 'unclosed = no div');

// unknown kind -> note-default class
const html3 = inst.parse('::: mystery body\n\nx\n\n:::\n');
assert(html3.includes('mdp-admonition mdp-note'), 'unknown kind = note default');

// nested code fence inside carried intact
const html4 = inst.parse('::: note t\n\n```js\nlet x = 1;\n```\n\n:::\n');
assert(html4.includes('let x = 1;'), 'nested fence intact');
assert(html4.includes('mdp-admonition'), 'container built');

// no default title when absent
const html5 = inst.parse('::: info\n\nbare\n\n:::\n');
assert(html5.includes('mdp-admonition mdp-info'), 'info class');
assert(!html5.includes('mdp-adv-title'), 'no title div when absent');

console.log('ok test-admonitions');