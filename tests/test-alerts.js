'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plug-alerts.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.alerts);

// NOTE case
const html = inst.parse('> [!NOTE]\n> careful note text\n');
assert(html.includes('<blockquote class="mdp-callout mdp-note">'), 'note callout');
assert(html.includes('careful note text'), 'content carried');
assert(!html.includes('[!NOTE]'), 'marker consumed');

// all five kinds get their class
['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'].forEach(function (k) {
  const h = inst.parse('> [!' + k + ']\n> x content\n');
  assert(h.includes('mdp-callout mdp-' + k.toLowerCase()), k + ' class');
});

// plain blockquote untouched
const html2 = inst.parse('> plain quote\n');
assert(html2.includes('<blockquote>'), 'plain blockquote unclassed');
assert(!html2.includes('mdp-callout'), 'no callout class on plain');

// unknown [!X] marker = the plain blockquote with the literal marker
const html3 = inst.parse('> [!MYSTERY]\n> y\n');
assert(!html3.includes('mdp-callout'), 'unknown kind not a callout');
assert(html3.includes('[!MYSTERY]'), 'unknown marker literal');

// nested code inside the callout carried intact
const html4 = inst.parse('> [!WARNING]\n> look:\n>\n> ```js\n> let x = 1;\n> ```\n');
assert(html4.includes('mdp-callout mdp-warning'), 'callout with nested');
assert(html4.includes('let x = 1;'), 'nested code intact');

console.log('ok test-alerts');