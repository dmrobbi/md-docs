#!/usr/bin/env bash
# md-docs addon installer for a SOC dashboard host (2026-10-17).
# Run as root (sudo). Idempotent: safe to re-run.
#
#   sudo bash deploy/install.sh [--port 9992] [--site /etc/nginx/sites-available/soc-dashboard]
#
# Does:
#   1. copy this tree to /opt/md-docs (default; MD_DOCS_ROOT overrides)
#   2. write md-docs.conf if the target has none (an existing conf is PRESERVED)
#   3. install + enable the systemd system unit (placeholders rendered)
#   4. insert the /docs/ location into the dashboard's nginx site (marker-anchored)
#   5. nginx -t + reload
#   6. drop two sample docs if the docs dir is empty
#   7. verify and print the live URL
set -euo pipefail

PORT=9992
SITE=/etc/nginx/sites-available/soc-dashboard
SRC="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="${MD_DOCS_ROOT:-/opt/md-docs}"
SOC_USER="${SOC_USER:-wez}"

while [ $# -gt 0 ]; do case "$1" in
  --port) PORT="$2"; shift 2;;
  --site) SITE="$2"; shift 2;;
  *) echo "unknown arg: $1" >&2; exit 2;;
esac; done

echo "== 1. copy tree to $ROOT"
mkdir -p "$ROOT/mds"
cp -f "$SRC/server.js" "$SRC/add.js" "$SRC/LICENSE" "$SRC/README.md" "$ROOT/"
rm -rf "$ROOT/public" "$ROOT/deploy"
cp -r "$SRC/public" "$ROOT/public"
cp -r "$SRC/deploy" "$ROOT/deploy"
chown -R "$SOC_USER:$SOC_USER" "$ROOT"

echo "== 2. md-docs.conf (preserved if the target already has one)"
if [ ! -f "$ROOT/md-docs.conf" ]; then
  cat > "$ROOT/md-docs.conf" <<CONF
# md-docs application settings (installed $(date -u +%F))
host = 127.0.0.1
port = $PORT
docsDir = $ROOT/mds
# Optional bearer gate on /api: set token here or via MD_DOCS_TOKEN in md-docs.env
# token =
CONF
chown "$SOC_USER:$SOC_USER" "$ROOT/md-docs.conf"
else
  echo "   existing conf preserved: $ROOT/md-docs.conf"
fi

echo "== 3. systemd system unit"
sed "s/__SOC_USER__/$SOC_USER/g" "$SRC/deploy/md-docs-system.service.tpl" \
  | sed "s|__MD_DOCS_ROOT__|$ROOT|g" > /etc/systemd/system/md-docs.service
chmod 644 /etc/systemd/system/md-docs.service
systemctl daemon-reload
systemctl enable --now md-docs.service
sleep 1
systemctl is-active md-docs.service
curl -s -m 5 "http://127.0.0.1:$PORT/api/docs" | head -c 120; echo " <- local API"

echo "== 4. nginx location /docs/"
if ! grep -q "# md-docs addon" "$SITE"; then
  python3 - "$SITE" "$PORT" <<'PY'
import sys
site, port = sys.argv[1], sys.argv[2]
text = open(site).read()
block = (
    "\n# --- md-docs addon: /docs/ on the TLS front ---\n"
    "location /docs/ {\n"
    "    proxy_pass http://127.0.0.1:" + port + "/;\n"
    "    proxy_set_header Host $host;\n"
    "    proxy_set_header X-Real-IP $remote_addr;\n"
    "    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n"
    "    proxy_set_header X-Forwarded-Proto https;\n"
    "}\n"
)
i = text.rstrip().rfind("}")
assert i != -1, "no closing brace found in " + site
open(site, "w").write(text[:i] + block + text[i:])
PY
else
  echo "   /docs/ location already present in $SITE"
fi

echo "== 5. nginx test + reload"
nginx -t
systemctl reload nginx

echo "== 6. sample docs (only if the docs dir is empty)"
if [ -z "$(ls -A "$ROOT/mds" 2>/dev/null)" ]; then
  printf '# md-docs addon\n\nThis library is served by the md-docs addon at the dashboard path /docs/.\n\n- Add markdown: the UI form, or `node add.js file.md "Title" "Description"`\n- Point MD_DOCS_DIR / docsDir at any existing markdown library to serve it instead.\n' > "$ROOT/mds/md-docs-addon.md"
  printf '# Adding docs\n\nUI: the Add form uploads a file or pastes markdown.\nCLI: `node add.js notes.md "A title" "One-line description"`.\n\nIDs are slugified; every doc keeps a stable link `#/doc/<id>` (Copy link).\n' > "$ROOT/mds/add-a-doc.md"
  chown "$SOC_USER:$SOC_USER" "$ROOT/mds/"*.md
fi

echo "== 7. verify"
curl -sk -m 8 "https://127.0.0.1:4771/docs/api/docs" | head -c 200; echo
echo "md-docs addon installed — open:  https://192.168.1.106:4771/docs/"