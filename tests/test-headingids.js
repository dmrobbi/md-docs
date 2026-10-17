'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plug-headingids.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.headingids);

const html = inst.parse('# Alpha\n\n## Alpha\n\n### Beta (x)!\n');
assert(html.includes('<h1 id="mdp-alpha"'), 'h1 slug');
assert(html.includes('<h2 id="mdp-alpha-1"'), 'dedupe suffix');
assert(html.match(/<h3 id="mdp-beta-x"/), 'special chars slug: ' + html.slice(html.indexOf('<h3'), html.indexOf('<h3') + 40));

// per-render freshness: the count map resets across parses
const html2 = inst.parse('# Solo\n');
assert(html2.includes('<h1 id="mdp-solo"'), 'fresh slug, no dedupe left; got: ' + html2.slice(0, 60));

// inline html inside heading = stripped for the slug, kept in the body
const html3 = inst.parse('## A <em>link</em> and & more\n');
assert(html3.match(/id="mdp-a-link-and-more"/) !== null, 'stripped slug: ' + html3.slice(html3.indexOf('<h2'), html3.indexOf('<h2') + 60));
assert(html3.includes('<em>link</em>'), 'body kept');

// punctuation-only heading falls back to the section
const html4 = inst.parse('### !!!\n');
assert(html4.includes('id="mdp-section"'), 'punctuation-only fallback');

// the enhancer registers
assert.strictEqual(typeof global.MDPluginEnhancers.headingids, 'function', 'enhancer registered');

console.log('ok test-headingids');