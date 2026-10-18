'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plug-frontmatter.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.frontmatter);

const out = inst.parse('---\ntitle: My Doc\ndescription: test desc\n---\n\n# Heading\n');
assert.strictEqual(global.window.MDFrontmatter.title, 'My Doc', 'title stash');
assert.strictEqual(global.window.MDFrontmatter.description, 'test desc', 'description stash');
assert(out.includes('<h1'), 'renders after the strip');
assert(!out.includes('title:'), 'yaml gone from render');

// quoted values unquoted
const out3 = inst.parse('---\ntitle: "Quoted Title"\n---\n\nx\n');
assert.strictEqual(global.window.MDFrontmatter.title, 'Quoted Title', 'quotes stripped');

// no front-matter: untouched render + null stash
const out2 = inst.parse('# Plain\n');
assert(global.window.MDFrontmatter === null || global.window.MDFrontmatter === undefined, 'no-fm stash');
assert(out2.includes('Plain'), 'clean render intact');
assert(!out2.includes('---'), 'no stray rule');

// hr still renders (the non-fm --- mid-page must NOT be eaten)
const out4 = inst.parse('# T\n\n---\n\nafter the rule\n');
assert(out4.includes('<hr'), 'mid-page hr survives');
assert(out4.includes('after the rule'), 'content survives');

console.log('ok test-frontmatter');