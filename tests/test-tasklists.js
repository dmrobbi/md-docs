'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plug-tasklists.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.tasklists || {});

// marked's GFM task default = disabled checkboxes (the enhancer's raw material)
const html = inst.parse('- [ ] open\n- [x] done\n');
assert(html.includes('type="checkbox"'), 'checkboxes rendered: ' + html.slice(0, 200));
assert((html.match(/disabled/g) || []).length === 2, 'marked default disables both');
assert(html.includes('checked=""') || html.includes('checked'), 'done has checked');

// the enhancer registered (the DOM wiring is browser-side)
assert.strictEqual(typeof global.MDPluginEnhancers.tasklists, 'function', 'enhancer registered');

console.log('ok test-tasklists');