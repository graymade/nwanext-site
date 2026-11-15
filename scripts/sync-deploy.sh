#!/bin/bash
# Turn new verified Instagram publication receipts into website stories and publish them.
# Usage: npm run sync:deploy  (from Website/_Pocket). Add --dry-run to only report.
# Safe to run any time: with no new receipts it changes nothing and pushes nothing.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${1:-}" = "--dry-run" ]; then
  node scripts/sync-from-newsroom.mjs --dry-run
  exit 0
fi

# Never commit someone else's half-finished edits along with the sync.
if [ -n "$(git status --porcelain)" ]; then
  echo "Stopped: the website folder has uncommitted changes. Commit or stash them first." >&2
  git status --short >&2
  exit 1
fi

git pull --rebase --quiet origin main   # pick up CMS edits made online
node scripts/sync-from-newsroom.mjs

# The sync always rewrites content/sync-log.json; only new stories or media count as news.
if [ -z "$(git status --porcelain -- content/articles media)" ]; then
  git checkout --quiet -- content/sync-log.json 2>/dev/null || true
  echo "No new posts. Nothing to publish."
  exit 0
fi

npm run build >/dev/null   # refuse to push a site that does not build
git add content media
n=$(git diff --cached --name-only -- content/articles | wc -l | tr -d ' ')
git commit --quiet -m "Sync ${n} new post(s) from Instagram"
git push --quiet origin main
echo "Pushed ${n} new post(s). GitHub deploys in about 2 minutes:"
echo "  gh run list --repo graymade/nwanext-site --limit 1"
