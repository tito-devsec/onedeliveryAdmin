#!/usr/bin/env bash
# Puts a new admin panel build live on the VPS, keeping the previous one for rollback.
#
# From Git Bash on your PC, in the admin folder:
#   VITE_API_URL=https://api.onedelivery.co.tz/api npm run build
#   tar -czf /tmp/onedelivery-admin.tar.gz -C dist .
#   scp /tmp/onedelivery-admin.tar.gz root@187.124.222.74:/tmp/
#   ssh root@187.124.222.74 'bash -s' < scripts/deploy-admin-vps.sh
set -euo pipefail

TARBALL=/tmp/onedelivery-admin.tar.gz
[ -f "$TARBALL" ] || { echo "✘ $TARBALL not found — copy the build to the server first"; exit 1; }

# The folder nginx serves admin.* from
ROOT="$(nginx -T 2>/dev/null | awk '
  /^[[:space:]]*server[[:space:]]*\{/ { inblk = 1; name = ""; root = "" }
  inblk && /^[[:space:]]*server_name[[:space:]]/ { name = $0 }
  inblk && /^[[:space:]]*root[[:space:]]/ { r = $2; gsub(/;/, "", r); root = r }
  inblk && name ~ /admin\./ && root != "" { print root; exit }
' || true)"
if [ -z "$ROOT" ]; then
  for d in /var/www/onedelivery-admin /var/www/admin; do
    if [ -f "$d/index.html" ]; then ROOT="$d"; break; fi
  done
fi
if [ -z "$ROOT" ]; then
  echo "✘ Couldn't find where nginx serves the admin panel (no server block for admin.*)."
  echo "  Check with: nginx -T | grep -n -A6 'server_name admin'"
  exit 1
fi
echo "• admin panel folder: $ROOT"

STAMP="$(date +%Y%m%d-%H%M%S)"
rm -rf "$ROOT.new"
mkdir -p "$ROOT.new"
tar -xzf "$TARBALL" -C "$ROOT.new"
[ -f "$ROOT.new/index.html" ] || { echo "✘ the build has no index.html"; rm -rf "$ROOT.new"; exit 1; }

if [ -d "$ROOT" ]; then mv "$ROOT" "$ROOT-old-$STAMP"; fi
mv "$ROOT.new" "$ROOT"
chown -R www-data:www-data "$ROOT" 2>/dev/null || true
chmod -R u=rwX,go=rX "$ROOT"
rm -f "$TARBALL"

echo "✔ admin panel updated"
[ -d "$ROOT-old-$STAMP" ] && echo "  previous version kept in $ROOT-old-$STAMP"
echo "  roll back with: rm -rf $ROOT && mv $ROOT-old-$STAMP $ROOT"
