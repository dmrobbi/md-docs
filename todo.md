# todo.md — md-docs renderer plugin panel (phased plan + decomposed task list)

The build plan for the render-plugin checkbox panel. The PICK LIST = the
53-option census in `docs/PLUGINS-OPTIONS.md` (IDs 1-53); this file = the
BUILD ORDER. Both repo lanes build the same tool: thing1 (`/opt/md-docs`,
public GitHub line) + trooper2 (`/bedimsec-md-docs`, internal idm line);
trees = identical at every close-out (tree-hash proof).

Conventions (binding for every task):

- The zero-dependency core (server.js / add.js / marked core) stays
  untouched; plugins = NEW modules + lazy-loaded CDN scripts, vendored
  later only by owner call.
- Per-task EXCLUSIVE files; a file named in only one task per phase.
- SHARED-file edits (app.js, index.html, css/, js/plugins.js, README.md)
  happen ONLY in phase-end INTEGRATION tasks.
- Tests = plain `node:assert` under `tests/`, run via `node tests/run.js` —
  no jsdom, no test packages; DOM work = pure generators + a manual battery
  checklist in the task.
- Each phase = independently landable; a phase's INT task = the phase's
  gate. Nothing ships without its INT green + deploy verify.

---

## Outline (the plan at a glance)

- **Phase 0 — foundation:** test runner; the plugin registry (the census
  as data); the settings store + lazy loader; the re-render pipeline
  (the ONE app.js edit that all later phases ride on).
- **Phase 1 — Renderer pane:** the checkbox popover (js-generated rows),
  the egress-warning rows (deny-by-default + confirm).
- **Phase 2 — default batch (7):** footnotes, GitHub alerts,
  heading-ids+copy-link, KaTeX(+mhchem), asciinema inline player, fence
  chrome (copy/line-numbers/lang), reading time.
- **Phase 3 — diagram family (6):** mermaid (flagship), nomnoml, mscgen,
  wavedrom, pikchr, viz.js(graphviz); heavies (D2/TikZJax) + services
  (kroki family) stay opt-in rows — no scheduled build.
- **Phase 4 — syntax + media (10):** admonitions, attributes, emoji,
  def-lists, front-matter, figures, interactive tasklists, media
  players, galleries/lightbox, pdf.js.
- **Phase 5 — charts + maps (3):** Chart.js blocks; Vega (kroki-only,
  egress row); Leaflet (offline-tiles first, OSM opt-in).
- **Phase 6 — experience (3):** backlinks, slideshow mode, print/PDF
  stylesheet.
- **Phase 7 — close-out:** census shipped-flags; README section; both
  deploys live-verified; lockstep parity push (both remotes) + full suite.

Owner-gated at any point (not scheduled): vendoring big CDN assets into
`public/vendor/` (mermaid ~1.2 MB, viz.js ~2 MB, asciinema player),
enabling egress-class services in the default view, TLS conf for the
thing1 instance reuse (already supported server-side).

---

## Phase 0 — foundation

### T0.1 — minimal zero-dep test runner
- **Files:** `tests/run.js` (new, exclusive)
- **Deps:** none
- **Build:** file-list runner: discovers `tests/test-*.js`, runs each in
  isolation via child_process, aggregates; exit 0 + `TESTS-OK n/n` printed
  on all-green, non-zero + the failing file name otherwise; `--selftest`
  flag exercises the failure path (an intentional red stub).
- **Accept:** `node tests/run.js --selftest` exits non-zero with the stub
  named; on a clean tree prints `TESTS-OK 0/0`. The runner never imports
  app code (isolation guaranteed).
- **Tests:** the runner's own self-test only.

### T0.2 — plugin registry (the census as data)
- **Files:** `public/js/plugins.js` (new), `tests/test-registry.js` (new)
- **Deps:** T0.1
- **Build:** one data module: for EVERY census row (1-43 client-local
  buildable + 44-53 opt-in/egress): `{id, title, category, urls:{js[],css[]},
  egress, default, phase}`; census cross-ref in a comment (`// census #17`).
  Opt-in rows = `default:false, egress:true` (12: census 11-12, 13-16,
  39, 44-46, 50-51-OSM-mode) + the two verify-rows flagged `verify:true`
  (search / dark-mode = check core first).
- **Accept (tests/test-registry.js):** plugin rows == 51 (the census-
  derived count: 53 options - the #37 xychart merged-comment - the
  #40/#41 one-module merge); ids unique; every js/css url = https;
  egress rows default-off; gated rows default-off; the verify-kind rows
  (2) = phase 7, never pane-toggleable.
- **Tests:** test-registry.js only.

### T0.3 — settings store + lazy loader
- **Files:** `public/js/plugin-loader.js` (new), `tests/test-settings.js` (new)
- **Deps:** T0.2
- **Build:** `getEnabled()/setEnabled(id,on)` against
  `localStorage['md-docs.plugins']` (defaults merge for the unset keys);
  `ensureLoaded(k)`: injects `<script>`/`<link rel=stylesheet>` ONCE per
  plugin (id-tagged nodes), returns a load promise; Egress rows =
  `ensureLoaded` refuses (returns a rejected promise + the badge state)
  unless a session-scoped confirm flag is set; no inline JS.
- **Accept (tests/test-settings.js):** defaults round-trip; set/get
  idempotence; unknown id = error; ensureLoaded = inject-once (counter
  mock); egress refusal until confirm.
- **Tests:** test-settings.js only (loader DOM mocked).

### T0.4 — re-render pipeline (the ONE app.js edit)
- **Files:** `public/js/md-pipeline.js` (new), `public/app.js` (edit),
  `public/index.html` (edit — the script tags for js/plugins.js,
  js/plugin-loader.js, js/md-pipeline.js before app.js),
  `tests/test-pipeline.js` (new)
- **Deps:** T0.2, T0.3
- **Build:** the pipeline CORE = pure (no document) in md-pipeline.js:
  `MDPipeline.render(src, transformers)` = marked.Marked() clean
  instance -> the enabled transformers in the registry order ->
  `.parse(src)`; app.js's renderMd = a thin delegate (the null ->
  fallbackRender) + the showDoc add: `MDPluginLoader.enhance(docBody)`
  post-set + a rerender export (`window.MDApp.rerender`), the
  double-render coalesce guard in showDoc.
- **Accept (tests/test-pipeline.js):** order determinism (the same input
  x2 = the same html — the regen gate); disabled plugins = never called;
  enhance receives the root; the coalesce guard fires.
- **Tests:** test-pipeline.js only.

---

## Phase 1 — Renderer pane

### T1.1 — the checkbox popover
- **Files:** `public/index.html` (edit), `public/js/renderer-ui.js` (new),
  `public/css/renderer.css` (new)
- **Deps:** T0.4 (needs the setEnabled hook)
- **Build:** the popover = a "Renderer" button in the header; the ROWS =
  js-generated from the registry (grouped by category, the count badge);
  the checkbox change = setEnabled + re-render; the state = persisted;
  reduced-motion respect; no inline JS.
- **Accept (manual battery):** open/close; rows == enabled-capable row
  count; toggle = visible re-render; reload = the state returns; keyboard
  reachable. The generator function = covered by a pure test (rows from
  the registry = the group structure).
- **Tests:** a pure structural test (renderer-ui's buildRows) in
  tests/test-renderer-ui.js + the manual battery.

### T1.2 — egress-warning rows
- **Files:** `public/js/renderer-ui.js` (edit), `public/css/renderer.css`
  (edit)
- **Deps:** T1.1
- **Build:** rows with `egress:true` = a `requires network` badge +
  deny-by-default (unchecked + disabled until a per-row confirm); the
  confirm = a one-time state session flag; the badge stays visible while
  on. The census data-size note (heavy WASM rows) = a tooltip.
- **Accept (manual battery):** the remote rows = never on without
  confirm; the badge = visible while on; the reload = the confirmed state
  persists (the confirm flag = persisted too).
- **Tests:** extends tests/test-renderer-ui.js (the row-state pure tests).

---

## Phase 2 — default batch (7 plugins)

Every T2.x plugin module follows the same shape (exclusive files per
plugin): detection + transform (`marked.use(...)`) + enhance
(`rootEl` post-pass) + config; tests = pure parse/detection asserts.

### T2.1 — footnotes (census 24)
- **Files:** `public/js/plug-footnotes.js`, `tests/test-footnotes.js`
- **Deps:** T0.4
- **Build:** marked-gfm-footnote (CDN, lazy): `[^id]` inline refs,
  `[^id]: text` definitions, section + backrefs at the document end.
- **Accept (tests):** ref + def + section html; the missing definition =
  plain text (no node); backref present.

### T2.2 — GitHub alerts (census 25)
- **Files:** `public/js/plug-alerts.js`, `tests/test-alerts.js`
- **Deps:** T0.4
- **Build:** `> [!NOTE|TIP|IMPORTANT|WARNING|CAUTION]` callouts:
  icon + accent classes; CSS-only chrome; the plain blockquotes untouched;
  nested content (lists/code) inside = carried.
- **Accept (tests):** the five render; a non-alert blockquote = plain;
  nested code inside the callout = intact.

### T2.3 — heading ids + copy-link (census 29)
- **Files:** `public/js/plug-headingids.js`, `tests/test-headingids.js`
- **Deps:** T0.4
- **Build:** marked-gfm-heading-id (CDN, lazy) + a hover copy-link button
  per heading; duplicate slugs = `-1`,`-2` suffixes.
- **Accept (tests):** slug + dedupe suffixes; the anchor href = the
  button's target; no button on h1-in-fences... (code fences untouched).

### T2.4 — KaTeX + mhchem (census 17)
- **Files:** `public/js/plug-katex.js`, `tests/test-katex.js`
- **Deps:** T0.4
- **Build:** KaTeX css+js + auto-render (CDN, lazy): inline `$..$`,
  block `$$..$$`; mhchem macros for \ce{} chemistry; renderErrors =
  visible-not-crash (the raw text remains).
- **Accept (tests):** THE CRITICAL ONE - math inside code fences /
  inline code = NEVER rendered (the escape order); inline + block +
  \ce{} cases; the bad-LaTeX = escaped raw text.
- **Tests:** test-katex.js only (the katex global mocked for pure checks).

### T2.5 — asciinema inline player (census 38)
- **Files:** `public/js/plug-asciinema.js`, `tests/test-asciinema.js`
- **Deps:** T0.4
- **Build:** ```asciinema <https://...cast>``` fences → the lazy-loaded
  player (CDN) rendering the cast inline; https-only enforcement; the
  toggle-off = the fence falls back to a plain link.
- **Accept (tests):** the fence transform; the URL scheme check (https
  only); the non-.cast URL = the link fallback.

### T2.6 — fence chrome (census 23)
- **Files:** `public/js/plug-fencechrome.js`, `tests/test-fencechrome.js`
- **Deps:** T0.4
- **Build:** copy button (one per fence, copies the RAW text), line
  numbers, the language label from the fence info string.
- **Accept (tests):** the button + the node structure; line numbers;
  the copy = the raw source (html-entities unescaped — the clipboard
  bug class); the info-string edge cases (no lang / extra args).

### T2.7 — reading time (census 49)
- **Files:** `public/js/plug-readingtime.js`, `tests/test-readingtime.js`
- **Deps:** T0.4
- **Build:** the header badge: word count + `~X min` (220 wpm).
- **Accept (tests):** the count + the rounding; the header injects once.

### T2.8 — INT: default battery (phase gate)
- **Files:** `public/js/plugins.js` (edit — the registry rows for 2.1-2.7,
  `default:true`), `tests/battery-default.js` (new)
- **Deps:** T2.1-T2.7
- **Build:** no new code; the row wiring + the battery: all 7 enabled
  together on a fixture doc (headings, math, fences, alerts, footnote,
  cast) = the html = DETERMINISTIC x2; no console errors; each plugin
  solo-toggle = still green (the isolation check).
- **Accept (tests):** battery-default.js green = the phase gate; the
  manual battery = the same fixture in the browser.

---

## Phase 3 — diagram family (6 plugins)

### T3.1 — mermaid (census 1; flagship)
- **Files:** `public/js/plug-mermaid.js`, `tests/test-mermaid.js`
- **Deps:** T2.8
- **Build:** mermaid CDN (lazy, ~1.2 MB); `initialize` ONCE with
  startOnLoad:false, securityLevel:'strict'; the fence transform = a
  placeholder (the pre-rendered source visible); enhance = `mermaid.run`
  on the placeholders; the theme = the dark-mode sync; the failure =
  keeps the source visible.
- **Accept (tests):** the detection + the placeholder structure; the
  enhance path with the mermaid global mocked; the double-run guard; the
  theme key present.
- **Tests:** test-mermaid.js only.

### T3.2-T3.5 — the offline family (census 3, 4, 5, 6)
- **Files:** `public/js/plug-nomnoml.js`, `plug-mscgen.js`,
  `plug-wavedrom.js`, `plug-pikchr.js` + one test file each
  (`tests/test-nomnoml.js` …)
- **Deps:** T2.8
- **Build (per plugin):** the CDN lazy-load; the fence transform =
  ```nomnoml / ```mscgen / ```wavedrom / ```pikchr → the placeholder;
  the enhance = the renderer call; the failure = source visible.
- **Accept (tests each):** detection; the placeholder structure; the
  failure-path config.

### T3.6 — viz.js graphviz (census 2)
- **Files:** `public/js/plug-graphviz.js`, `tests/test-graphviz.js`
- **Deps:** T2.8
- **Build:** ```dot fences via @viz-js/viz (lazy WASM ~2 MB); the
  placeholder + the enhance; the WASM fetch = a promise-chained load.
- **Accept (tests):** detection; the structure; the failure = source.

### T3.7 — INT: diagrams battery (phase gate)
- **Files:** `public/js/plugins.js` (edit — the rows for 3.1-3.6),
  `tests/battery-diagrams.js` (new)
- **Deps:** T3.1-T3.6
- **Build:** the 6 diagrams enabled together + the default 7 = the
  fixture = deterministic x2; the transform ORDER documented (fence
  chrome -> diagrams placeholders -> katex -> footnotes); each diagram
  solo = green.
- **Accept (tests):** battery-diagrams.js = the gate; the manual battery.

---

## Phase 4 — syntax + media (10 plugins)

### T4.1 admonitions/containers (census 26)
- **Files:** `public/js/plug-admonitions.js`, `tests/test-admonitions.js`
- **Deps:** T3.7
- **Build:** `::: note|warning|tip|danger [title]` blocks → the themed
  containers; nested fences inside = fine.
### T4.2 attributes (census 27)
- **Files:** `public/js/plug-attributes.js`, `tests/test-attributes.js`
- **Deps:** T3.7
- **Build:** trailing `{.class #id key=val}` → attrs; sanitized names
  (a strict regex; no event handlers ever).
### T4.3 emoji shortcodes (census 28)
- **Files:** `public/js/plug-emoji.js`, `public/vendor/gemoji.json`
  (owner-gated copy? — no: the SHORTCODE DATA = small, vendor it), one test
- **Deps:** T3.7
### T4.4 definition lists (census 31)
### T4.5 front-matter (census 32) — strip + the title/desc into the card
### T4.6 figures (census 33) — images → `<figure>`+`<figcaption>` (alt =
  caption)
### T4.7 interactive tasklists (census 34) — toggleable + persisted
  (localStorage keyed by doc-id)
### T4.8 media players (census 40/41) — mp4/webm/mp3/ogg
### T4.9 galleries/lightbox (census 43) — glightboox lazy; grouped by
  attributes
### T4.10 pdf.js (census 42) — pdf links → in-page viewer
### T4.11 INT: syntax-media battery (phase gate)
  - Files: `public/js/plugins.js` (rows 4.1-4.10), `tests/battery-syntax.js`
  - Deps: T4.1-T4.10
  - Same gate shape: the fixture x2 determinism; the solo-isolation.

---

## Phase 5 — charts + maps (3, partial owner-gate)

### T5.1 Chart.js blocks (census 35) — ```chart JSON fences → canvas
### T5.2 Vega (census 36) — kroki-only row (default-off, egress)
### T5.3 Leaflet (census 47) — offline-tiles-first; the OSM tiles = opt-in
### T5.4 INT: charts battery (rows + `tests/battery-charts.js`)

---

## Phase 6 — experience (3)

### T6.1 backlinks (census 51) — the client mention graph over the hub
  api list (throttled; cache)
### T6.2 slideshow (census 52) — the --- separators → the deck; the
  keys; the exit restores normal view
### T6.3 print/PDF stylesheet (census 53) — `css/print.css`; math +
  svg render inside the print flow (the manual battery on a printed
  page)
### T6.4 INT: exp battery (rows + `tests/battery-exp.js`)

---

## Phase 7 — close-out

### T7.1 — census file = shipped flags
- **Files:** `docs/PLUGINS-OPTIONS.md` (edit)
- **Deps:** T6.4
- **Build:** every row gets `status: shipped | opt-in (gated) | core`; the
  two verify-rows resolved (search/dark-mode = core or n-a); NO inline
  numbers beyond the row ids.
### T7.2 — README renderer section
- **Files:** `README.md` (edit)
- **Build:** the panel UX + the persistence + the egress policy +
  CDN-vs-vendored line + the trooper2/thing1 mount notes.
### T7.3 — both deploys live-verified
- **Files:** none (ops)
- **Build:** thing1 = `/opt/md-docs` unit restart + the `/docs` front:
  the UI + the API + the battery fixture in the browser (mermaid +
  katex + the alert fixture live-verified); trooper2 = `:9991
  /bedimsec-md-docs` = the same battery. The installer's step-7 race nit
  (sleep/retry in verify) = fixed if the installer is touched.
### T7.4 — lockstep parity close
- **Files:** none (ops)
- **Build:** `node tests/run.js` = all green; both remotes ls-remote
  + tree-match proof = identical; the pushes: github (the cred-helper
  flow) + idm (ssh) = lockstep; the census = shipped-updated.

---

## Status

- phase 0 = landed (github 20680f8; internal mirrored; TREES-MATCH 21acdbbb; suite TESTS-OK 3/3)
- phase 1 = landed (the Renderer pane popover + the egress rows; suite TESTS-OK 4/4; the front greps green)
- phase 2 = next (the seven default plugins + the battery)

## Records
- Waves land as daily-note sections (`memory/YYYY-MM-DD.md`, the gateway
  host) with the same-task IDs; the workspace commit closes each wave.
- The census/plan divergence between lanes = never allowed at close-out:
  the tree-hash proof = the gate (T7.4; every phase-end int = mirrors
  onto both lines before it ends).