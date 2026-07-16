#!/usr/bin/env bash
# Generate PNG siblings for every WebP under public/images so fulfillment
# emails can use email-safe absolute https://…/*.png URLs.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
count=0
while IFS= read -r -d '' f; do
  out="${f%.webp}.png"
  if [[ ! -f "$out" || "$f" -nt "$out" ]]; then
    sips -s format png "$f" --out "$out" >/dev/null
    count=$((count + 1))
  fi
done < <(find public/images -name '*.webp' -print0)
echo "Generated/updated $count PNG file(s) for email."
