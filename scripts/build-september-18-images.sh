#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
base="$root/assets/blog/september-18-2026"

make_portrait_set() {
  local input="$1" slug="$2" gravity="$3"
  mkdir -p "$base/$slug"
  for spec in "hero:1600:900" "social:1200:630"; do
    IFS=: read -r name width height <<< "$spec"
    convert "$input" -auto-orient -resize "${width}x${height}^" -gravity "$gravity" -extent "${width}x${height}" -quality 88 "$base/$slug/$name.jpg"
    convert "$base/$slug/$name.jpg" -quality 82 "$base/$slug/$name.webp"
  done
}

make_portrait_set "$base/originals/sam-monica-birthday-korean-restaurant-paraguay.jpg" \
  "autism-intellectual-disability-and-transition-to-adulthood" center

slug="why-the-end-of-school-services-feels-like-a-cliff"
mkdir -p "$base/$slug"
for spec in "hero:1600:900" "social:1200:630"; do
  IFS=: read -r name width height <<< "$spec"
  convert "$base/originals/sam-meditative-neighborhood-walk.jpg" -auto-orient -resize "${width}x${height}^" -gravity center -extent "${width}x${height}" -blur 0x24 -modulate 72,72,100 \
    \( "$base/originals/sam-meditative-neighborhood-walk.jpg" -auto-orient -resize "x${height}" \) -gravity center -composite -quality 88 "$base/$slug/$name.jpg"
  convert "$base/$slug/$name.jpg" -quality 82 "$base/$slug/$name.webp"
done

make_portrait_set "$base/originals/sam-checkout-lima-peru.jpg" \
  "preparing-for-adult-life-before-special-education-ends" west
