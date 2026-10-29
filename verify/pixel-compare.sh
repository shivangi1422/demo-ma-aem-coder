#!/bin/bash
# Pixel compare of two screenshots over their common size: prints AE (fuzz 8%) and match %.
# Usage: pixel-compare.sh <a.png> <b.png> <diff.png> [y0,y1]
set -e
A=$1; B=$2; D=$3
W=$(identify -format %w "$A"); H1=$(identify -format %h "$A"); H2=$(identify -format %h "$B")
H=$(( H1 < H2 ? H1 : H2 )); Y0=0
if [ -n "$4" ]; then Y0=${4%,*}; H=$(( ${4#*,} - Y0 )); fi
AE=$(compare -metric AE -fuzz 8% <(convert "$A" -crop ${W}x${H}+0+${Y0} +repage png:-) <(convert "$B" -crop ${W}x${H}+0+${Y0} +repage png:-) "$D" 2>&1 || true)
echo "AE=$AE of $((W*H)) px -> match $(awk -v a="$AE" -v t="$((W*H))" 'BEGIN{printf "%.2f", 100-100*a/t}')% (${W}x${H} from y=${Y0})"
