'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js');
require('../public/js/plugins.js');
require('../public/js/plug-leaflet.js');
const inst = new global.marked.Marked();
inst.use(global.MDPluginUseObjects.leaflet);
const F = '```';

const cfg = '{"center":[47.5,19],"zoom":10}';
const html = inst.parse(F + 'leaflet\n' + cfg + '\n' + F + '\n');
assert(html.includes('<div class="mdp-map" data-map="leaflet"'), 'map box');
assert(html.includes('data-src="{&quot;center&quot;:[47.5,19],&quot;zoom&quot;:10}"'), 'config escaped carried');

// markers accepted shape
const html2 = inst.parse(F + 'leaflet\n{"center":[0,0],"markers":[{"lat":1,"lon":2,"title":"x"}]}\n' + F + '\n');
assert(html2.includes('mdp-map'), 'markers config box');

// other lang untouched
const html3 = inst.parse(F + 'python\nx\n' + F + '\n');
assert(!html3.includes('mdp-map'), 'other langs untouched');

// the OSM tiles = an EXPLICIT opt-in key, never default
const cfgRow = global.MDPlugins.byId.leaflet;
assert.strictEqual(cfgRow.egress, false, 'leaflet row itself is offline-first (no egress flag)');

// the enhancer registered
assert.strictEqual(typeof global.MDPluginEnhancers.leaflet, 'function', 'enhancer registered');
console.log('ok test-leaflet');