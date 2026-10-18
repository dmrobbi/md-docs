'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plug-emoji.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.emoji);

const html = inst.parse('big :tada: here :fire:\n');
assert(html.includes('🎉'), 'tada');
assert(html.includes('🔥'), 'fire');

// unknown shortcodes = literal (the false-rewrite class)
const html2 = inst.parse(':zz_unknown: stays\n');
assert(html2.includes(':zz_unknown:'), 'unknown = literal');

// +1 / -1
const html3 = inst.parse(':+1: yes :-1: no\n');
assert(html3.includes('👍'), '+1 thumbsup');
assert(html3.includes('👎'), '-1 thumbsdown');

// timestamps never rewritten
const html4 = inst.parse('deployed at 10:30:45 sharp\n');
assert(html4.includes('10:30:45'), 'timestamps intact');

// multi-colon strings (url-ish) never rewritten
const html5 = inst.parse('see redis://127.0.0.1:6379\n');
assert(html5.includes('redis://127.0.0.1:6379'), 'urls intact');

console.log('ok test-emoji');