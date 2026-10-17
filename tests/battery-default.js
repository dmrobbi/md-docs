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
const loader = global.MDPluginLoader;
const pipeline = global.MDPipeline;

// defaults-only state (the registry's default:true = the seven)
loader.setStoreHost({ get: () => null, set: () => {} });

const F = '```';
const fixture = [
  '# Heading One',
  '',
  'Some text with $$x = 1 + 2$$ and a footnote[^1].',
  '',
  '> [!NOTE]',
  '> careful',
  '',
  F + 'python',
  'a = 1',
  'b = 2',
  F,
  '',
  F + 'asciinema',
  'https://example.com/x.cast',
  F,
  '',
  '## Heading Two',
  '',
  '[^1]: The note text.',
  '',
].join('\n');

const html = pipeline.render(fixture, loader.transformers(), global.marked);
assert.ok(html && html.length > 50, 'render works');

// each plugin's marker present in the COMBINED render (the hook-chain works)
assert(html.includes('mdp-fn-ref'), 'footnotes: ref');
assert(html.includes('id="mdp-fn-1"'), 'footnotes: def item');
assert(html.includes('<section class="mdp-footnotes"'), 'footnotes: section');
assert(html.includes('<blockquote class="mdp-callout mdp-note">'), 'alerts: callout');
assert(!html.includes('[!NOTE]'), 'alerts: marker consumed');
assert(html.includes('<h1 id="mdp-heading-one"'), 'headingids: slug');
assert(html.includes('<h2 id="mdp-heading-two"'), 'headingids: h2 slug');
assert(html.includes('<div class="mdp-pre" data-lang="python" data-lines="2"'), 'fencechrome: box');
assert(html.includes('<span class="mdp-line">a = 1'), 'fencechrome: line spans');
assert(html.includes('<div class="mdp-cast" data-cast-url="https://example.com/x.cast"'), 'asciinema: box');
assert(html.includes('$$x = 1 + 2$$'), 'katex: untouched at the marked layer (render = enhance-side)');

// determinism x2 (the regen gate)
const html2 = pipeline.render(fixture, loader.transformers(), global.marked);
assert.strictEqual(html, html2, 'deterministic combined render');

// the solo-isolation: each plugin alone on the same fixture
['footnotes', 'alerts', 'headingids', 'fencechrome', 'readingtime', 'katex', 'asciinema'].forEach(function (k) {
  const soloState = { footnotes: false, alerts: false, headingids: false, fencechrome: false, readingtime: false, katex: false, asciinema: false };
  soloState[k] = true;
  loader.setStoreHost({ get: () => JSON.stringify(soloState), set: () => {} });
  const solo = pipeline.render(fixture, loader.transformers(), global.marked);
  const markers = {
    footnotes: () => (solo || '').includes('mdp-fn-ref'),
    alerts: () => (solo || '').includes('mdp-callout mdp-note'),
    headingids: () => (solo || '').includes('mdp-heading'),
    fencechrome: () => (solo || '').includes('mdp-pre'),
    readingtime: () => (solo || '').length > 50, // enhancer-only: render still fine
    katex: () => (solo || '').length > 50,       // enhancer-only
    asciinema: () => (solo || '').includes('mdp-cast'),
  };
  assert.ok(markers[k](), 'solo render works: ' + k);
});
loader.setStoreHost({ get: () => null, set: () => {} });

console.log('ok battery-default');