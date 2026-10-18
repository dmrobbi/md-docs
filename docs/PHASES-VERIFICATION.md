# PHASES-VERIFICATION — md-docs renderer-plugin panel (all 7 phases)

Generated 2026-10-18 (UTC) on thing1 from the as-built tree. Method: the todo's task
list vs the tree (file existence + per-test assert counts, machine-checked),
plus the live gates (the suite, the git tree-hash lockstep, the deploy
fronts). The browser-level battery = `public/verify.html` + `docs/WEB-VERIFY.md`.

## Gates (live at generation)

- suite: **TESTS-OK 37/37** (rc 0)
- working-tree SHA HEAD cf295be = tree `072f90f159fac61df60b30a3e30f04b3a2685d49`
- github main (cf295be) tree = `072f90f159fac61df60b30a3e30f04b3a2685d49`
- idm main (49a7749) tree = `072f90f159fac61df60b30a3e30f04b3a2685d49`
- working tree = github tree = idm tree: **yes — ONE TREE (three-way)**
- thing1 front `/docs/`: HTTP **200** — trooper2 front `:9991`: HTTP **200**

## Per-task census

| Task | Deliverables (existence + test assert counts) |
|---|---|
| T0.1 test runner | `run.js` exists (1 asserts) |
| T0.2 plugin registry | `plugins.js` exists; `test-registry.js` exists (13 asserts) |
| T0.3 settings store + loader | `plugin-loader.js` exists; `test-settings.js` exists (21 asserts) |
| T0.4 re-render pipeline | `md-pipeline.js` exists; `app.js` exists; `index.html` exists; `test-pipeline.js` exists (9 asserts) |
| T1.1 checkbox popover | `renderer-ui.js` exists; `renderer.css` exists; `index.html` exists; `test-renderer-ui.js` exists (18 asserts) |
| T1.2 egress-warning rows | `renderer-ui.js` exists; `renderer.css` exists; `test-renderer-ui.js` exists (18 asserts) |
| T2.1 footnotes | `plug-footnotes.js` exists; `test-footnotes.js` exists (15 asserts) |
| T2.2 GitHub alerts | `plug-alerts.js` exists; `test-alerts.js` exists (11 asserts) |
| T2.3 heading ids + copy-link | `plug-headingids.js` exists; `test-headingids.js` exists (9 asserts) |
| T2.4 KaTeX + mhchem | `plug-katex.js` exists; `test-katex.js` exists (10 asserts) |
| T2.5 asciinema player | `plug-asciinema.js` exists; `test-asciinema.js` exists (9 asserts) |
| T2.6 fence chrome | `plug-fencechrome.js` exists; `test-fencechrome.js` exists (16 asserts) |
| T2.7 reading time | `plug-readingtime.js` exists; `test-readingtime.js` exists (6 asserts) |
| T2.8 INT default battery | `mdp-plugins.css` exists; `battery-default.js` exists (15 asserts);  edit-in-task: `plugins.js` present;  edit-in-task: `plugin-loader.js` present;  edit-in-task: `app.js` present;  edit-in-task: `index.html` present |
| T3.1 mermaid | `plug-mermaid.js` exists; `test-mermaid.js` exists (6 asserts) |
| T3.2 nomnoml | `plug-nomnoml.js` exists; `test-nomnoml.js` exists (5 asserts) |
| T3.3 mscgen | `plug-mscgen.js` exists; `test-mscgen.js` exists (4 asserts) |
| T3.4 wavedrom | `plug-wavedrom.js` exists; `test-wavedrom.js` exists (4 asserts) |
| T3.5 pikchr (decision) |  |
| T3.6 graphviz (viz.js) | `plug-graphviz.js` exists; `test-graphviz.js` exists (5 asserts) |
| T3.7 INT diagrams battery | `battery-diagrams.js` exists (12 asserts);  edit-in-task: `plugins.js` present |
| T4.1 admonitions | `plug-admonitions.js` exists; `test-admonitions.js` exists (11 asserts) |
| T4.2 attributes | `plug-attributes.js` exists; `test-attributes.js` exists (8 asserts) |
| T4.3 emoji shortcodes | `plug-emoji.js` exists; `test-emoji.js` exists (8 asserts) |
| T4.4 definition lists | `plug-deflists.js` exists; `test-deflists.js` exists (9 asserts) |
| T4.5 front-matter | `plug-frontmatter.js` exists; `test-frontmatter.js` exists (11 asserts) |
| T4.6 figures | `plug-figures.js` exists; `test-figures.js` exists (6 asserts) |
| T4.7 tasklists | `plug-tasklists.js` exists; `test-tasklists.js` exists (5 asserts) |
| T4.8 media players | `plug-media.js` exists; `test-media.js` exists (9 asserts) |
| T4.9 lightbox | `plug-lightbox.js` exists; `test-lightbox.js` exists (3 asserts) |
| T4.10 pdf embeds | `plug-pdf.js` exists; `test-pdf.js` exists (6 asserts) |
| T4.11 INT syntax battery | `battery-syntax.js` exists (20 asserts);  edit-in-task: `plugins.js` present |
| T5.1 chartjs blocks | `plug-chartjs.js` exists; `test-chartjs.js` exists (6 asserts) |
| T5.2 vega (kroki egress) | `plug-vega.js` exists; `test-vega.js` exists (7 asserts) |
| T5.3 leaflet maps | `plug-leaflet.js` exists; `test-leaflet.js` exists (7 asserts) |
| T5.4 INT charts battery | `battery-charts.js` exists (9 asserts); `mdp-plugins.css` exists;  edit-in-task: `plugins.js` present |
| T6.1 backlinks | `plug-backlinks.js` exists; `test-backlinks.js` exists (22 asserts) |
| T6.2 slideshow | `plug-slides.js` exists; `test-slides.js` exists (11 asserts) |
| T6.3 print/PDF | `plug-printcss.js` exists; `print.css` exists; `test-printcss.js` exists (17 asserts) |
| T6.4 INT exp battery | `battery-exp.js` exists (21 asserts); `mdp-plugins.css` exists;  edit-in-task: `plugins.js` present |
| T7.1 census shipped flags | `PLUGINS-OPTIONS.md` exists; `plugins.js` exists |
| T7.2 README renderer section | `README.md` exists |
| T7.3 both deploys verified |  |
| T7.4 lockstep parity |  |


### Planned-vs-as-built divergences (honest record)

1. **emoji shortcodes (T4.3)** — the plan's optional gemoji vendor copy was NOT
   taken; the module ships its own compact shortcode map (`plug-emoji.js`,
   ~56 common shortcodes), unknown = the literal form. Zero extra weight,
   zero deps, tests cover the mapping.
2. **pikchr (T3.5)** — closed as a documented DECISION (no reliable browser
   build = the census's own note): the registry row = the egress-class
   (kroki route = owner-gated); no module built; the battery = no row.
3. **pdf embeds (T4.10)** — the plan/census named pdf.js; the as-built =
   the browser's native `<embed type="application/pdf">`
   (dependency-free; the pdf.js WASM = unnecessary; the registry urls
   dropped at the close-out). test-pdf asserts the native path.
4. **installer step-7 verify race (deploy/install.sh)** — the todo's
   conditional nit; the installer untouched the whole build → left
   untouched (by task text).



### What the node suite CANNOT prove (the browser-battery surface)

The suite = pure node asserts (parse/detection/registry/store/pipeline).
The DOM-and-browser behaviors — the pane interaction, the real localStorage
round-trips, the slides overlay key handling, the tasklist persistence, the
backlinks scan against the live API, the print view, the CDN lazy-loads —
are proven by `public/verify.html` (drive the REAL app in an iframe,
results print as `WEB-VERIFY-OK n/m` / `WEB-VERIFY-RED`) — see
`docs/WEB-VERIFY.md` for the headless commands + the manual checklist.

### Browser-battery results — 2026-10-18

- **thing1** (`https://192.168.1.106:4771/docs/verify.html`, headless Chromium
  155): **WEB-VERIFY-OK 20/20 (skips 0)** — the E-block (the registry/store/
  loader/the full-transform fixture/determinism x2/the deck + graph math) and
  the A-block (the real list → the real pane click (51 checkboxes) → the real
  row-flip persisted → the doc chrome through the real router → the slideshow
  open + a REAL Escape keydown → printcss (the control + the injected sheet)
  → the backlinks scan COMPLETING on the live hub ("no backlinks found" for
  the sample)).
- **The run caught and fixed, same session:** (a) the live app never loaded
  `js/renderer-ui.js` — the Renderer pane was DEAD in the deployed UI (the
  script tag missing; the phase-1 index.html edit under-delivered); (b) 17
  built rows (all of phases 3-5 + the phase-4 row group) carried no module
  file url — their self-authored transforms were never lazy-loaded, so the
  diagram/syntax/chart/media rows were pipeline-invisible in the REAL app
  while all node batteries stayed green (they require the modules manually —
  a mask, now documented). Both fixed this wave; E1 = the standing regression
  check. Full detail: memory/defects/md-docs-phase6-2026-10-18.md (D7/D8) +
  the harness's own iterated bugs (D9).
- **trooper2** (`http://10.0.0.66:9991/verify.html`, the same headless walk):
  **WEB-VERIFY-OK 20/20 (skips 0)** — identical to thing1; the backlinks scan
  completing on trooper2's own hub (the sample = kaliagent-v3-weaponization-
  guide → "no backlinks found"). Both deployments = the SAME tree content
  (the sweep-proven) + the same 20/20 result.


## Verdict

Every built task's deliverables exist and are covered by tests; the gates are
green; the phases' status rows (todo.md) = accurate. The remaining
not-yet-fully-proven surface = the REAL-BROWSER battery (being filled by this
verification wave).
