'use strict';
const assert = require('assert');
global.window = global;
require('../public/js/plug-lightbox.js');
const L = global.MDPluginEnhancers.lightbox;

// GLightbox present: init called with the doc-scoped selector
let inited = null;
global.GLightbox = (opts) => { inited = opts; };
L({});
assert(inited && inited.selector === '#docBody img', 'selector scoped');

// absent + no loader: silent no-op
delete global.GLightbox;
global.MDPluginLoader = undefined;
L({});
assert.strictEqual(global.__mdpNoCrash, undefined, 'no crash');
console.log('ok test-lightbox');