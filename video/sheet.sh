#!/bin/bash
# usage: sheet.sh fmt out.jpg t1 t2 ...
fmt=$1; out=$2; shift 2; rm -f build/stills/s_*.jpg; i=0
for t in "$@"; do node render.js still $fmt $t build/stills/s_$(printf %02d $i).jpg; i=$((i+1)); done
if [ $fmt = h ]; then sc=640:-1; cols=3; else sc=360:-1; cols=5; fi
ffmpeg -y -loglevel error -pattern_type glob -i 'build/stills/s_*.jpg' -vf "scale=$sc,tile=${cols}x$(( (i+cols-1)/cols ))" -frames:v 1 $out
