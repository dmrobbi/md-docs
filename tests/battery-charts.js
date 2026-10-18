'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js'); // the REAL marked
require('../public/js/plugins.js');
require('../public/js/plugin-loader.js');
require('../public/js/md-pipeline.js');
require('../public/js/plug-footnotes.js');
require('../public/js/plug-alerts.js');
require('../public/js/plug-headingids.js');
require('../public/js/plug-fencechrome.js');
require('../public/js/plug-readingtime.js');
require('../public/js/plug-katex.js');
require('../public/js/plug-asciinema.js');
require('../public/js/plug-mermaid.js');
require('../public/js/plug-nomnoml.js');
require('../public/js/plug-mscgen.js');
require('../public/js/plug-wavedrom.js');
require('../public/js/plug-graphviz.js');
require('../public/js/plug-admonitions.js');
require('../public/js/plug-attributes.js');
require('../public/js/plug-emoji.js');
require('../public/js/plug-deflists.js');
require('../public/js/plug-frontmatter.js');
require('../public/js/plug-figures.js');
require('../public/js/plug-tasklists.js');
require('../public/js/plug-media.js');
require('../public/js/plug-lightbox.js');
require('../public/js/plug-pdf.js');
require('../public/js/plug-chartjs.js');
require('../public/js/plug-vega.js');
require('../public/js/plug-leaflet.js');
const loader = global.MDPluginLoader;
const pipeline = global.MDPipeline;

// phase 5 on: charts + maps (the vega's egress-confirm = the loader's session flag)
loader.confirmEgress();
loader.setStoreHost({
  get: () => JSON.stringify({ chartjs: true, vega: true, leaflet: true, mermaid: true, emoji: true }),
  set: () => {},
});

const F = '```';
const fixture = [
  '# Charts',
  '',
  F + 'chart',
  '{"type":"bar","data":{"labels":["a","b"],"datasets":[{"label":"n","data":[1,2]}]}}',
  F,
  '',
  F + 'vegalite',
  '{"mark":"bar","data":{"values":[1,2]}}',
  F,
  '',
  F + 'leaflet',
  '{"center":[47.5,19],"zoom":10}',
  F,
  '',
  F + 'mermaid',
  'flowchart LR\n  a --> b',
  F,
  '',
  'footnote[^1] and :tada: and :::-free',
  '',
  '[^1]: x',
  '',
].join('\n');

const html = pipeline.render(fixture, loader.transformers(), global.marked);
// class-scoped counts: a bare substring count false-matches the heading
// slug ("# Charts" -> id="mdp-charts" contains "mdp-chart" — probed;
// this exact false positive cost a debug round)
assert.strictEqual((html.match(/class="mdp-chart"/g) || []).length, 1, 'chartjs box once');
assert.strictEqual((html.match(/class="mdp-vega"/g) || []).length, 1, 'vega box once');
assert.strictEqual((html.match(/class="mdp-map"/g) || []).length, 1, 'leaflet box once');
assert(html.includes('mdp-diagram'), 'mermaid box still working alongside');
assert(html.includes('mdp-fn-ref'), 'footnotes chained');
assert(html.includes('🎉'), 'emoji chained');
assert(!html.includes(':::-FREE'), 'garbage check placeholder');

// determinism x2 (the regen gate)
const html2 = pipeline.render(fixture, loader.transformers(), global.marked);
assert.strictEqual(html, html2, 'deterministic combined charts render');

// egress-respect spot: without the confirm reset the vega = loader-gated:
// (the loader's egresConfirmed = module state; a fresh load-path is tested in test-settings)
console.log('ok battery-charts');