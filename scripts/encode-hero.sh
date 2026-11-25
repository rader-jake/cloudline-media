#!/bin/bash
# Encode a hero loop for the homepage from a source clip.
#   FFMPEG=/path/to/ffmpeg bash scripts/encode-hero.sh input.mp4 [start_seconds] [duration_seconds]
# Outputs to public/media/hero/: hero-fpv.mp4 (≈2–3 MB, H.264), hero-fpv.webm (VP9),
# hero-fpv-mobile.mp4 (portrait 9:16 center crop), and first-frame posters for both.
# Audio is always stripped. Aim for an 8–12 s clip that loops cleanly.
# Tip: on Apple Silicon without Homebrew, `npm i ffmpeg-static` in a scratch folder provides a binary.
set -euo pipefail
FF="${FFMPEG:-ffmpeg}"
IN="$1"; START="${2:-0}"; DUR="${3:-12}"
OUT=public/media/hero
mkdir -p "$OUT"
Q="-hide_banner -loglevel error -y"
TMP="$(mktemp -t hero).mp4"
$FF $Q -ss "$START" -t "$DUR" -i "$IN" -an -vf "fps=24,format=yuv420p" -c:v libx264 -crf 12 -preset fast "$TMP"
$FF $Q -i "$TMP" -an -c:v libx264 -profile:v high -crf 28 -maxrate 1700k -bufsize 3400k -preset slow -movflags +faststart -pix_fmt yuv420p "$OUT/hero-fpv.mp4"
$FF $Q -i "$TMP" -an -c:v libvpx-vp9 -b:v 1500k -minrate 600k -maxrate 2000k -crf 36 -row-mt 1 -deadline good -cpu-used 2 "$OUT/hero-fpv.webm"
# Portrait crop: full height, 9:16 width, centered.
$FF $Q -i "$TMP" -an -vf "crop=trunc(ih*9/16/2)*2:ih:(iw-trunc(ih*9/16/2)*2)/2:0" -c:v libx264 -profile:v high -crf 27 -maxrate 1200k -bufsize 2400k -preset slow -movflags +faststart -pix_fmt yuv420p "$OUT/hero-fpv-mobile.mp4"
$FF $Q -i "$TMP" -frames:v 1 -c:v libwebp -quality 80 "$OUT/hero-fpv-poster.webp"
$FF $Q -i "$TMP" -frames:v 1 -vf "crop=trunc(ih*9/16/2)*2:ih:(iw-trunc(ih*9/16/2)*2)/2:0" -c:v libwebp -quality 80 "$OUT/hero-fpv-poster-mobile.webp"
rm -f "$TMP"
ls -la "$OUT"
