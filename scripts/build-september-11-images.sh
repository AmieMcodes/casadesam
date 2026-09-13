#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
base="$root/assets/blog/september-11-2026"

make_set() {
  local input="$1" slug="$2" crop="$3" social_crop="$4"
  mkdir -p "$base/$slug"
  convert "$input" -auto-orient -crop "$crop" +repage -resize 1600x900^ -gravity center -extent 1600x900 -quality 88 "$base/$slug/hero.jpg"
  convert "$base/$slug/hero.jpg" -quality 82 "$base/$slug/hero.webp"
  convert "$input" -auto-orient -crop "$social_crop" +repage -resize 1200x630^ -gravity center -extent 1200x630 -quality 88 "$base/$slug/social.jpg"
  convert "$base/$slug/social.jpg" -quality 82 "$base/$slug/social.webp"
}

make_set "$base/originals/sam-rooftop-pool-asuncion.jpg" \
  "why-adult-autism-services-cannot-focus-only-on-employment" \
  "4896x2754+0+2150" "4896x2570+0+2250"

# Preserve the portrait composition by placing the full image over a softened background.
slug="meaningful-work-for-adults-with-intellectual-disabilities"
mkdir -p "$base/$slug"
for spec in "hero:1600:900" "social:1200:630"; do
  IFS=: read -r name width height <<< "$spec"
  convert "$base/originals/sam-tasting-fried-mandioca.jpg" -auto-orient -resize "${width}x${height}^" -gravity center -extent "${width}x${height}" -blur 0x24 -modulate 75,75,100 \
    \( "$base/originals/sam-tasting-fried-mandioca.jpg" -auto-orient -resize "x${height}" \) -gravity center -composite -quality 88 "$base/$slug/$name.jpg"
  convert "$base/$slug/$name.jpg" -quality 82 "$base/$slug/$name.webp"
done

make_set "$base/originals/sam-weekly-english-class-church.jpg" \
  "contribution-beyond-a-traditional-job" \
  "2448x1377+0+780" "2448x1285+0+830"
