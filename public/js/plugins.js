/* md-docs renderer plugin registry — the 53-option census (docs/PLUGINS-OPTIONS.md) as data.
 * kind: 'plugin' rows = buildable module rows (urls:null = zero-dep self-authored module);
 * kind: 'verify' rows = Phase-7 core-check flags, never pane-toggleable, never loadable.
 * phase = the scheduled build phase; null = unscheduled (pane shows it greyed "not built").
 * egress = the doc's text leaves the LAN; deny-by-default until confirmEgress().
 * census #37: mermaid xychart — included with the mermaid module.
 */
(function (g) {
  'use strict';
  function p(id, census, title, category, urls, opts) {
    opts = opts || {};
    return {
      kind: opts.kind || 'plugin',
      id: id,
      census: census,
      title: title,
      category: category,
      urls: urls,
      egress: !!opts.egress,
      gated: !!opts.gated,
      default: !!opts.default,
      phase: opts.phase === undefined ? null : opts.phase,
    };
  }
  var CDNP = 'https://cdn.jsdelivr.net/npm/';
  var rows = [
    p('mermaid', 1, 'Mermaid', 'diagrams', { js: [CDNP + 'mermaid@10.9.1/dist/mermaid.min.js'] }, { phase: 3 }),
    p('graphviz', 2, 'Graphviz (viz.js)', 'diagrams', { js: [CDNP + '@viz-js/viz@3.11.0/lib/viz-standalone.js'] }, { phase: 3 }),
    p('nomnoml', 3, 'nomnoml', 'diagrams', { js: [CDNP + 'nomnoml@1.6.2/dist/nomnoml.min.js'] }, { phase: 3 }),
    p('mscgen', 4, 'MscGen', 'diagrams', { js: [CDNP + 'mscgenjs@7.3.0/index/require-paths-mscgenjs.min.js'] }, { phase: 3 }),
    p('wavedrom', 5, 'WaveDrom', 'diagrams', { js: [CDNP + 'wavedrom@3.5.0/wavedrom.min.js'] }, { phase: 3 }),
    p('pikchr', 6, 'pikchr', 'diagrams', null, { egress: true }), // census #6: no reliable browser build -> rendered via kroki encode
    p('bpmn', 7, 'bpmn-js viewer', 'diagrams', { js: [CDNP + 'bpmn-js@18.6.1/dist/bpmn-navigated-viewer.production.min.js'] }, { gated: true }),
    p('svgbob', 8, 'Svgbob', 'diagrams', null, { egress: true }),
    p('excalidraw', 9, 'Excalidraw viewer', 'diagrams', null, { gated: true }),
    p('diagramsnet', 10, 'Diagrams.net viewer', 'diagrams', null, { egress: true }),
    p('d2', 11, 'D2', 'diagrams', null, { gated: true }),
    p('tikzjax', 12, 'TikZJax', 'diagrams', null, { gated: true }),
    p('kroki', 13, 'Kroki (generic)', 'services', null, { egress: true }),
    p('plantuml', 14, 'PlantUML server', 'services', null, { egress: true }),
    p('webseq', 15, 'WebSequenceDiagrams', 'services', null, { egress: true }),
    p('quickchart', 16, 'QuickChart', 'services', null, { egress: true }),
    p('katex', 17, 'KaTeX + mhchem', 'math', {
      js: ['js/plug-katex.js', CDNP + 'katex@0.16.11/dist/katex.min.js', CDNP + 'katex@0.16.11/dist/contrib/mhchem.min.js', CDNP + 'katex@0.16.11/dist/contrib/auto-render.min.js'],
      css: [CDNP + 'katex@0.16.11/dist/katex.min.css'],
    }, { default: true, phase: 2 }),
    p('mathjax', 18, 'MathJax 3', 'math', { js: [CDNP + 'mathjax@3.2.2/es5/tex-chtml.js'] }, { gated: true }),
    p('asciimath', 19, 'ASCIIMath (MathJax)', 'math', { js: [CDNP + 'mathjax@3.2.2/es5/asciimath-chtml.js'] }, { gated: true }),
    p('highlightjs', 20, 'highlight.js', 'code', {
      js: [CDNP + '@highlightjs/cdn-assets@11.10.0/highlight.min.js'],
      css: [CDNP + '@highlightjs/cdn-assets@11.10.0/styles/github-dark.min.css'],
    }, { gated: true }),
    p('prism', 21, 'Prism', 'code', null, { gated: true }),
    p('shiki', 22, 'Shiki', 'code', null, { gated: true }),
    p('fencechrome', 23, 'Fence chrome (copy / line numbers / lang)', 'code', { js: ['js/plug-fencechrome.js'] }, { default: true, phase: 2 }),
    p('footnotes', 24, 'Footnotes', 'syntax', { js: ['js/plug-footnotes.js'] }, { default: true, phase: 2 }),
    p('alerts', 25, 'GitHub-style alerts', 'syntax', { js: ['js/plug-alerts.js'] }, { default: true, phase: 2 }),
    p('admonitions', 26, 'Admonitions ::: blocks', 'syntax', null, { phase: 4 }),
    p('attributes', 27, 'Attributes {.cls #id}', 'syntax', null, { phase: 4 }),
    p('emoji', 28, 'Emoji shortcodes', 'syntax', null, { phase: 4 }),
    p('headingids', 29, 'Heading IDs + copy-link', 'syntax', { js: ['js/plug-headingids.js'] }, { default: true, phase: 2 }),
    p('supsub', 30, 'Superscript / subscript / mark / ins', 'syntax', null, { gated: true }),
    p('deflists', 31, 'Definition lists', 'syntax', null, { phase: 4 }),
    p('frontmatter', 32, 'YAML front-matter', 'syntax', null, { phase: 4 }),
    p('figures', 33, 'Figures (figcaption)', 'syntax', null, { phase: 4 }),
    p('tasklists', 34, 'Interactive task lists', 'syntax', null, { phase: 4 }),
    p('chartjs', 35, 'Chart.js blocks', 'charts', { js: [CDNP + 'chart.js@4.4.7/dist/chart.umd.js'] }, { phase: 5 }),
    p('vega', 36, 'Vega / Vega-Lite', 'charts', null, { egress: true, phase: 5 }),
    p('asciinema', 38, 'Asciinema inline player', 'media', {
      js: ['js/plug-asciinema.js', CDNP + 'asciinema-player@3.8.1/dist/asciinema-player.min.js'],
      css: [CDNP + 'asciinema-player@3.8.1/dist/asciinema-player.min.css'],
    }, { default: true, phase: 2 }),
    p('ytvimeo', 39, 'YouTube / Vimeo embeds', 'embeds', null, { egress: true }),
    p('media', '40,41', 'Video + audio players', 'media', null, { phase: 4 }),
    p('pdf', 42, 'PDF.js inline viewer', 'media', {
      js: [CDNP + 'pdfjs-dist@4.10.38/build/pdf.min.mjs', CDNP + 'pdfjs-dist@4.10.38/build/pdf.worker.min.mjs'],
    }, { phase: 4 }),
    p('lightbox', 43, 'Image lightbox + galleries', 'media', {
      js: [CDNP + 'glightbox@3.3.1/dist/js/glightbox.min.js'],
      css: [CDNP + 'glightbox@3.3.1/dist/css/glightbox.min.css'],
    }, { phase: 4 }),
    p('xembed', 44, 'Twitter/X embeds', 'embeds', null, { egress: true }),
    p('codepen', 45, 'CodePen / JSFiddle embeds', 'embeds', null, { egress: true }),
    p('spotify', 46, 'Spotify embeds', 'embeds', null, { egress: true }),
    p('leaflet', 47, 'Leaflet map blocks', 'maps', {
      js: [CDNP + 'leaflet@1.9.4/dist/leaflet.js'],
      css: [CDNP + 'leaflet@1.9.4/dist/leaflet.css'],
    }, { phase: 5 }),
    p('molecule', 48, 'Molecule viewer (SMILES)', 'maps', null, { gated: true }),
    p('readingtime', 49, 'Reading time + word count', 'experience', { js: ['js/plug-readingtime.js'] }, { default: true, phase: 2 }),
    p('autotoc', 50, 'Auto TOC', 'experience', null, { gated: true }),
    p('backlinks', 51, 'Backlinks', 'experience', { js: ['js/plug-backlinks.js'] }, { phase: 6 }),
    p('slides', 52, 'Slideshow mode', 'experience', { js: ['js/plug-slides.js'] }, { phase: 6 }),
    p('printcss', 53, 'Print / PDF stylesheet', 'experience', { js: ['js/plug-printcss.js'], css: ['css/print.css'] }, { phase: 6 }),
    p('search-verify', null, 'search (core check)', 'experience', null, { kind: 'verify', phase: 7 }),
    p('darkmode-verify', null, 'dark mode (core check)', 'experience', null, { kind: 'verify', phase: 7 }),
  ];
  var byId = {};
  rows.forEach(function (r) {
    if (byId[r.id]) throw new Error('dup registry id: ' + r.id);
    byId[r.id] = r;
  });
  g.MDPlugins = { rows: rows, byId: byId };
})(typeof window !== 'undefined' ? window : globalThis);