'use strict';
const assert = require('assert');
global.window = global;
global.marked = require('../public/vendor/marked.min.js'); // the REAL marked
require('../public/js/plugins.js');
require('../public/js/plugin-loader.js');
require('../public/js/md-pipeline.js');
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
const loader = global.MDPluginLoader;
const pipeline = global.MDPipeline;

// all ten phase-4 plugins on
const ON = {
  admonitions: true, attributes: true, emoji: true, deflists: true,
  frontmatter: true, figures: true, tasklists: true, media: true,
  lightbox: true, pdf: true,
};
loader.setStoreHost({ get: () => JSON.stringify(ON), set: () => {} });

const fixture = [
  '---',
  'title: The Fixture',
  'description: syntax battery',
  '---',
  '',
  '# Attrs {.red #x}',
  '',
  'Terms',
  ': def one',
  '',
  '::: warning Watch out',
  '',
  'body **bold**',
  '',
  ':::',
  '',
  '![A red apple](https://example.com/apple.png)',
  '',
  'See :tada: and :fire:',
  '',
  '- [ ] task one',
  '',
  '[Demo video](https://example.com/demo.mp4)',
  '',
  '[Report](https://example.com/report.pdf)',
  '',
].join('\n');

const html = pipeline.render(fixture, loader.transformers(), global.marked);
assert.ok(html && html.length > 50, 'render works');

// per-plugin markers in the COMBINED render (the hook-chain intact)
assert(html.includes('mdp-admonition mdp-warning'), 'admonition div');
assert(html.includes('Watch out'), 'admonition title carried');
assert(html.includes('id="x"'), 'attribute id applied');
assert(html.includes('class="red"'), 'attribute class applied');
assert(html.includes('🎉'), 'emoji tada');
assert(html.includes('🔥'), 'emoji fire');
assert(html.includes('<dl>'), 'deflist built (the collapsed form)');
assert(html.includes('<dt>Terms</dt>'), 'deflist term');
assert(html.includes('<dd>def one</dd>'), 'deflist def');
assert(html.includes('<figure class="mdp-figure">'), 'figure wrapped');
assert(html.match(/<figcaption>A red apple<\/figcaption>/), 'figure caption');
assert(html.includes('type="checkbox"'), 'tasklist checkbox rendered');
assert(!html.includes('title: The Fixture'), 'front-matter stripped');

// determinism x2 (the regen gate)
const html2 = pipeline.render(fixture, loader.transformers(), global.marked);
assert.strictEqual(html, html2, 'deterministic combined render');

// solo-isolation spot: deflists off alone
loader.setStoreHost({
  get: () => JSON.stringify(Object.assign({}, ON, { deflists: false })),
  set: () => {},
});
const noDeflists = pipeline.render(fixture, loader.transformers(), global.marked);
assert(!noDeflists.includes('<dl>'), 'deflists off = no dl');
assert(noDeflists.includes('mdp-admonition'), 'the rest still active');

// solo: attributes off alone
loader.setStoreHost({
  get: () => JSON.stringify(Object.assign({}, ON, { attributes: false })),
  set: () => {},
});
const noAttrs = pipeline.render(fixture, loader.transformers(), global.marked);
assert(!noAttrs.includes('id="x"'), 'attributes off = plain heading');
assert(noAttrs.includes('mdp-admonition'), 'rest intact');

loader.setStoreHost({ get: () => JSON.stringify(ON), set: () => {} });
console.log('ok battery-syntax');