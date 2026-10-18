# md-docs

Zero-dependency Markdown doc site **and** SOC-dashboard addon (Node stdlib only, no npm install).
Serves a browsable, searchable, filterable library of `.md` files with stable hashed links
(`#/doc/<id>`) for the rendered view. Deployed standalone on any host with node — or mounted
into an existing [soc-openclaw](https://github.com/dmrobbi/soc-openclaw) dashboard's nginx TLS
front as its `/docs/` page.

## Layout

| File | Role |
|---|---|
| `server.js` | the whole backend: static UI + JSON API + the optional bearer gate |
| `md-docs.conf` | application settings (host, port, docsDir, optional token) |
| `public/` | UI (vanilla JS; marked.js bundled locally, fallback renderer built in) |
| `add.js` | CLI helper: `node add.js <file.md> [title] [description]` |
| `deploy/md-docs-system.service.tpl` | systemd system-unit template (the dashboard-host install) |
| `deploy/md-docs.service` | systemd user-unit (a lab-style install) |
| `deploy/nginx-docs-location.conf` | the `/docs/` location block for the dashboard's nginx site |
| `deploy/install.sh` | idempotent addon installer (unit + nginx + samples + verify) |
| `mds/` | runtime doc storage (`.metadata.json` = title/description/added per doc). NOT committed. |

## Configuration (`md-docs.conf`)

```ini
# Interface to bind; 127.0.0.1 = behind the dashboard's nginx front, 0.0.0.0 = all interfaces
host = 127.0.0.1

# Port to listen on
port = 9992

# Directory where the markdown doc files live (relative = next to the app, or any absolute path)
docsDir = mds

# Optional: set to require a bearer token on every /api/ request.
# token =

# ---- HTTPS ----
# Enable TLS on the listening port (true/false)
tls = false

# Your own certificate + key (PEM files, both required when provided).
# Leave empty with tls = true to AUTO-GENERATE a generic self-signed cert
# (825-day ECDSA P-256, CN=md-docs, SANs = localhost/hostname/IPv4s)
# cached in tls/ (gitignored); reused on later boots.
tlsCert =
tlsKey =
```

Precedence: env vars (`MD_DOCS_HOST` / `MD_DOCS_PORT` / `MD_DOCS_DIR` / `MD_DOCS_TOKEN` /
`MD_DOCS_TLS` / `MD_DOCS_TLS_CERT` / `MD_DOCS_TLS_KEY`) override the conf file; the conf
file overrides built-in defaults. Conf file path relocatable via `MD_DOCS_CONF`.
Restart the service after edits.

### Auth (the bearer gate)

- `MD_DOCS_TOKEN` unset (or the conf's `token` unset) → `/api/*` fully open (lab mode).
- Set → every `/api/*` request requires `Authorization: Bearer <token>` (curl/scripts and
  `add.js`) or `X-MD-Docs-Token: <token>`. The static UI stays open; the UI prompts once for the
  token, stashes it in `localStorage`, and attaches it to every API call. Comparison is
  `crypto.timingSafeEqual` (the hashed halves), fail-closed.
- Recommended on the dashboard host: put `MD_DOCS_TOKEN=<value>` in the unit's
  `EnvironmentFile` (`/opt/md-docs/md-docs.env`, 0600), then restart the unit. Rotate by editing
  the file + `sudo systemctl restart md-docs`.

## Run standalone

```
node server.js                # uses md-docs.conf next to it
```

## API

- `GET /api/docs` — list (id/title/description/bytes/mtime)
- `POST /api/docs` — add `{title, description, content}` → `{id}` (20 MB body cap)
- `GET /api/doc/<id>` — raw markdown
- `DELETE /api/doc/<id>` — remove

## Deploy as the SOC dashboard addon (the /docs page)

Requirements: the dashboard host has node and the soc-openclaw dashboard's nginx TLS site
(the `:4771` front).

```
git clone https://github.com/dmrobbi/md-docs /opt/md-docs
sudo SOC_USER=wez bash /opt/md-docs/deploy/install.sh
```

The installer: copies the tree to `/opt/md-docs`, writes a loopback-bound conf (port 9992,
docsDir under the install), installs and enables the system unit, inserts the marker-anchored
`/docs/` location into the dashboard's nginx site, reloads nginx, drops two sample docs if the
library is empty, then verifies.

Live once installed: **https://192.168.1.106:4771/docs/** (the hashed-link library, same UI).

Manual equivalent: render the unit template, drop the nginx location block from
`deploy/nginx-docs-location.conf` into the dashboard's site before its closing `}`, `nginx -t`,
reload.

Serving an existing library instead of the samples: set `docsDir` (conf) or `MD_DOCS_DIR`
(env) to the library's directory — flat `.md` files, slugified basenames.

## UI

- `#/` — list: 20/page pager, sort (newest/oldest/title/size), search title+description
  instantly, full-content search at 3+ chars via a background deep-scan; add form (file or paste)
- `#/doc/<id>` — rendered doc + Source toggle + Copy link + Remove
- The token prompt appears once if the server runs gated; then silent.

## Renderer plugin panel

The doc view carries a **Renderer** button: one popover with a checkbox row per registered
plugin (grouped by category with a live count badge). Toggling persists in `localStorage`
(`md-docs.plugins`; unset keys = the registry defaults) and re-renders through the composite
pipeline (`js/md-pipeline.js` — a clean marked instance per render, transformers in registry
order, the phase-2-style hooks chained into one composite).

- **Shipped families** (the full build plan in `todo.md`, phases 0-6): diagrams (mermaid,
  graphviz/viz, nomnoml, mscgen, wavedrom), math (KaTeX + mhchem), code (fence chrome),
  syntax (footnotes, GitHub alerts, admonitions, attributes, emoji, heading ids + copy-link,
  definition lists, front-matter, figures, interactive tasklists), charts (Chart.js blocks,
  Vega via kroki), media (asciinema inline player, video/audio players, native-PDF embeds,
  lightbox), maps (Leaflet, offline-tiles-first), experience (reading time, backlinks,
  slideshow mode, print/PDF stylesheet). The pick list with shipped flags:
  `docs/PLUGINS-OPTIONS.md`.
- **Egress policy** — rows that touch a remote service carry a "requires network" badge and
  stay deny-by-default: unchecked + disabled until a per-row one-time confirm; the badge
  stays visible while on. The kroki-routed rows (Vega; the pikchr route) and the embed
  families (YouTube/Vimeo, X, CodePen, Spotify) never egress without that confirm. Backlinks
  and the like are local-only: they talk to this server's own API.
- **CDN vs vendored** — the shipped modules lazy-load their heavy libs from jsdelivr on first
  enable (mermaid ~1.2 MB, the viz WASM, KaTeX, Chart.js, glightbox, Leaflet, asciinema
  player). Only marked itself is vendored (`public/vendor/marked.min.js`); vendoring more =
  an owner-gated call (`public/vendor/` takes them).
- **PDF embeds** ship as the browser's native `<embed type="application/pdf">`
  (dependency-free; the pdf.js WASM proved unnecessary).
- **Mount notes** — thing1: `/opt/md-docs` behind the soc-dashboard's nginx TLS front at
  `/docs/`; trooper2: `:9991` under `/bedimsec-md-docs`. The UI/API base resolves from
  `document.baseURI`, so both mounts run one codebase.
- **Interactive plugins with state** — tasklist toggles persist per doc id; backlinks caches
  its scan for the session (throttled); the slideshow deck opens from clones (Esc = exit, the
  normal view untouched); the print view ships everything already rendered (KaTeX/mermaid are
  static DOM by print time).
- **Tests** — `node tests/run.js` runs the discovered `test-*.js` + `battery-*.js`
  (zero-dep runner); `--selftest` proves the red path. Batteries render with the REAL
  marked, assert combined determinism x2 + solo-store isolation, and every phase gate
  shipped inside its phase's commit.

## License

MIT — see [LICENSE](LICENSE).

<!-- project: idm.wezzel.com/crab-meat-repos/agentic-ai -->