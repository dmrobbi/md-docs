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
const loader = global.MDPluginLoader;
const pipeline = global.MDPipeline;
loader.setStoreHost({ get: () => null, set: () => {} }); // the defaults + phase-3 on? hmm: defaults = 7; diagrams = default:false — enable explicitly:

const DIAGRAMS_ON = { mermaid: true, nomnoml: true, mscgen: true, wavedrom: true, graphviz: true };
loader.setStoreHost({ get: () => JSON.stringify(DIAGRAMS_ON), set: () => {} });

const F = '```';
const fixture = [
  '# Graphs',
  '',
  F + 'mermaid',
  'flowchart LR',
  '  a --> b',
  F,
  '',
  F + 'nomnoml',
  '[A] -> [B]',
  F,
  '',
  F + 'mscgen',
  'msc { a => b; }',
  F,
  '',
  F + 'wavedrom',
  '{ signal: [{ name: "clk", wave: "p....." }] }',
  F,
  '',
  F + 'dot',
  'digraph { a -> b }',
  F,
  '',
  F + 'python',
  'x = 1',
  F,
  '',
  'text [^1]',
  '',
  '[^1]: note',
  '',
].join('\n');

const html = pipeline.render(fixture, loader.transformers(), global.marked);
assert.strictEqual((html.match(/mdp-diagram-mermaid/g) || []).length, 1, 'mermaid box once: ' + html.slice(0, 120));
assert.strictEqual((html.match(/mdp-diagram-nomnoml/g) || []).length, 1, 'nomnoml box once');
assert.strictEqual((html.match(/mdp-diagram-mscgen/g) || []).length, 1, 'mscgen box once');
assert.strictEqual((html.match(/mdp-diagram-wavedrom/g) || []).length, 1, 'wavedrom box once');
assert.strictEqual((html.match(/mdp-diagram-dot/g) || []).length, 1, 'dot box once');
assert(html.includes('data-lang="python"'), 'python fenced via fencechrome box (lang carried)');
assert(html.includes('mdp-fn-ref'), 'footnotes still chained alongside diagrams');
assert(html.includes('mdp-heading'), 'heading ids still chained');

// determinism x2 (the regen gate)
const html2 = pipeline.render(fixture, loader.transformers(), global.marked);
assert.strictEqual(html, html2, 'deterministic combined diagrams render');

// all-off vs defaults-only: the diagrams' absence changes but the rest = stable
loader.setStoreHost({ get: () => JSON.stringify({ mermaid: false, nomnoml: false, mscgen: false, wavedrom: false, graphviz: false }), set: () => {} });
const noDiagrams = pipeline.render(fixture, loader.transformers(), global.marked);
assert(!noDiagrams.includes('mdp-diagram'), 'all-off = no diagram boxes');
assert(noDiagrams.includes('data-lang="mermaid"'), 'mermaid fence falls through to the fencechrome box (the lang preserved)');

loader.setStoreHost({ get: () => null, set: () => {} });
console.log('ok battery-diagrams');