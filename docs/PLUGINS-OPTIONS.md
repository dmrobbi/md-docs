# Markdown rendering plugin options — md-docs

Counted, categorized option list for the renderer checkbox panel
(pick rows; each row = lazy-loadable browser-side plugin for the vendored
marked core). Continuous numbering for reference: 53 options.

Weight: tiny (< 50 KB) / small (< 200 KB) / medium (< 1 MB) / heavy (>= 1 MB).
Egress = the doc's text leaves the LAN to a remote service; default off.

## A. Diagrams — client-side renderers (text → SVG, no egress)

1. **Mermaid** — flowchart / sequence / class / state / ER / gantt / pie /
   gitgraph / mindmap / timeline / quadrant / sankey / xychart / block /
   kanban / C4 / ZenUML. Dep: CDN ~1.2 MB, lazy-load on first use. The
   flagship example.
2. **Graphviz (viz.js / @viz-js/viz)** — DOT language, WASM engine.
   Dep: WASM ~2 MB.
3. **nomnoml** — compact box-and-arrow UML; pure JS, tiny, offline-able.
4. **MscGen (mscgen_js)** — message-sequence charts; pure JS, small.
5. **WaveDrom** — digital timing / waveform diagrams; pure JS, small.
6. **pikchr** — SQLite's diagram language; small JS port, offline-able.
7. **bpmn-js** — BPMN 2.0 XML → interactive diagram; medium.
8. **Svgbob** — ASCII art → SVG; small wasm/kroki.
9. **Excalidraw (viewer)** — `.excalidraw` JSON scenes; medium-heavy.
10. **Diagrams.net viewer** — hosted XML via iframe; egress only if using
    their viewer host (self-hostable lite version exists).
11. **D2 (@terrastruct/d2-wasm)** — modern declarative diagram lang;
    WASM is heavy (tens of MB) — prefer kroki unless vendored.
12. **TikZJax** — TikZ/LaTeX in the browser; WASM, heavy.

## B. Diagrams — remote-encode services (all default off: egress)

13. **Kroki** — one endpoint, ~20 backends (plantuml, ditaa, erd,
    bytefield, blockdiag, vega, lilypond, structurizr, excalidraw, d2,
    svgbob, packetdiag …). Egress: the entire diagram text egresses.
14. **PlantUML server** — needs a PlantUML server (self-hostable — the
    safer route: no external egress, LAN-only). Medium.
15. **WebSequenceDiagrams** — hosted service; egress.
16. **QuickChart** — hosted chart-URL service; egress.

## C. Math

17. **KaTeX** (+ marked-katex-extension) — fast, synchronous; inline
    `$..$` / block `$$..$$`; mhchem macros give chemistry (equations,
    isotopes). small. Offline-able (vendored fonts).
18. **MathJax 3** — maximum LaTeX/package coverage incl. physics +
    circuit macros; heavier, slower parse.
19. **ASCIIMath** (KaTeX asciimath module) — friendly plain-text math.

## D. Code presentation

20. **highlight.js** (+ marked-highlight) — 190+ languages + autodetect;
    small; offline-able.
21. **Prism** — alternative grader with a strong plugin set
    (line-numbers, copy-button, diff-highlight, command-line, toolbar).
22. **Shiki / starry-night** — highest-fidelity grading (grammar-based);
    prebuilt theme assets; heavier.
23. **Fence chrome: copy buttons + line numbers + terminal/diff styling** —
    tiny custom renderer over the core.

## E. Markdown syntax extensions

24. **Footnotes** (marked-gfm-footnote) — `[^1]` references + section.
25. **GitHub-style alerts** — `> [!NOTE] / [!TIP] / [!IMPORTANT] /
    [!WARNING] / [!CAUTION]` blocks render as callouts. Tiny custom.
26. **Admonitions / containers** — `::: note|warning|tip|danger …` blocks
    (markdown-it-container style) with custom titles/icons.
27. **Attributes** — `{.class #id key=val}` on headings/spans/images for
    styling and galleries.
28. **Emoji shortcodes** (marked-emoji + gemoji data) — `:tada:` → emoji.
29. **Heading IDs + anchor links** (marked-gfm-heading-id) + copy-link on
    hover. Tiny.
30. **Superscript / subscript / mark / insert** — `^sup^ ^sub~ ==mark== 
    ++ins++`. Tiny custom.
31. **Definition lists** — `term : definition`. Tiny custom.
32. **YAML front-matter** — strip or render as a metadata block.
33. **Figures** — image fences/directives → `<figure>` + `<figcaption>`.
34. **Interactive task lists** — checkboxes toggleable in the viewer with
    persisted state (custom; localStorage).

## F. Charts / data

35. **Chart.js blocks** — ```chart fences with JSON/YAML config → canvas
    charts; small; offline-able.
36. **Vega / Vega-Lite** — declarative viz spec blocks; local heavy
    (~1.5 MB wasm) or via kroki (egress).
37. **Mermaid xychart** — included with the Mermaid row.

## G. Media embeds

38. **Asciinema inline player** — code-block with a `.cast` URL renders the
    inline player (the estate already self-hosts the player at `/player/`;
    vendoring it keeps zero-egress). ESTATE-NATIVE.
39. **YouTube / Vimeo block embeds** — bare links → privacy-friendly
    (nocookie) iframes (egress at view time; default off).
40. **Video file player** — mp4/webm links/fences → `<video controls>`.
41. **Audio player** — mp3/ogg/wav links → `<audio controls>`.
42. **PDF.js inline viewer** — pdf links → in-page viewer; medium.
43. **Image lightbox + gallery** (glightbox) — click-to-zoom, grouped
    galleries via attributes.
44. **Twitter/X post embed** — widgets.js; egress + rate limits; default off.
45. **CodePen / JSFiddle embeds** — hosted iframes; egress.
46. **Spotify embed** — hosted iframe (music/episodes); egress.

## H. Maps / specialized data

47. **Leaflet map blocks** — lat/lon markers or GeoJSON fences →
    interactive map (OSM tiles = egress at view time; offline tiles possible).
48. **Molecule viewer** — SMILES strings → 2D/3D molecule rendering
    (smiles-drawer); small; fun for chem notes.

## I. Reading experience (checkboxable, non-renderer)

49. **Reading time + word count** badge in the card header. Tiny.
50. **Auto TOC** — sticky sidebar or in-page, from heading depth; tiny.
51. **Backlinks** — client-side doc cross-reference index (doc-id mention
    graph); small custom (pairs well with the doc-hub id scheme).
52. **Slideshow mode** — `---` separators → reveal.js or a custom
    fullscreen slide deck; medium; great for the pitch docs.
53. **Print / PDF export stylesheet** — page-break-aware print view;
    tiny custom. (Math + mermaid render with it too.)

## Panel architecture recommendation

- `index.html`: a "Renderer" pane — one checkbox per active row +
  a global "load only client-local plugins" mode.
- Choices persist in `localStorage`; each plugin loads its script ONCE
  lazily from CDN when first enabled; re-render on toggle.
- The zero-dependency core stays untouched; per-plugin CDNs (or later
  vendoring for mermaid/katex/highlight.js) keep offline use possible.
- Default batch: 24 (footnotes), 25 (alerts), 29 (heading ids), 17
  (KaTeX), 38 (asciinema), 23/49 (fence chrome + reading time).
- Egress class (13-16, 39/44-46, 44/46, 50/51-tiles) = visible warning,
  individually opt-in.