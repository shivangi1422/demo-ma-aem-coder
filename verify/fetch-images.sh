#!/bin/bash
# Usage: fetch-images.sh <template-dir>...  (from the project root)
# Downloads every image of a template's image-map.json into content/ (web-size), using a browser
# User-Agent as media.beckman.com requires. Existing files are kept.
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
TMP=$(mktemp -d)
for T in "$@"; do
  jq -r 'to_entries[].value | to_entries[] | "\(.key)\t\(.value)"' "$T/image-map.json" | while IFS=$'\t' read -r src dst; do
    out="content$dst"; [ -s "$out" ] && continue
    url="$src"
    case "$url" in *media.beckman.com*) case "$url" in *\?*) url="$url&extension=${dst##*.}";; *) url="$url?extension=${dst##*.}";; esac;; esac
    dl="$TMP/$(basename "$dst")"
    code=$(curl -sL -A "$UA" -o "$dl" -w '%{http_code}' "$url")
    if [ "$code" = 200 ]; then
      mkdir -p "$(dirname "$out")"
      case "$out" in
        *.jpg|*.jpeg|*.png) convert "$dl" -strip -interlace Plane -quality 85 -resize '2000x2000>' "$out" ;;
        *) cp "$dl" "$out" ;;
      esac
      echo "ok $out"
    else
      echo "FAIL $code $src"
    fi
  done
done
find "$TMP" -type f -delete; rmdir "$TMP"
