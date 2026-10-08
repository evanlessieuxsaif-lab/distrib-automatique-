#!/bin/bash
# Pipeline complet : voix (Kokoro) -> musique/mix -> rendu des 2 formats -> encodage final (< 8 Mo)
# Prérequis : python3 (numpy, soundfile, kokoro-onnx + modèles dans $MODELS), node + playwright, ffmpeg.
set -e
cd "$(dirname "$0")"; MODELS=${MODELS:-/tmp/claude-0/work}; OUT=../assets/video; mkdir -p build $OUT
if ls voix/vo?.mp3 >/dev/null 2>&1; then   # voix naturelle (ElevenLabs via Higgsfield) : on convertit
  for i in 1 2 3 4 5; do ffmpeg -y -loglevel error -i voix/vo$i.mp3 -ar 44100 -ac 1 build/vo$i.wav; done
else [ -f build/vo5.wav ] || python3 tts.py "$MODELS" build; fi   # sinon voix locale Kokoro
python3 music.py build build/mix.wav
for f in h v; do [ -f build/${f}_raw.mp4 ] && [ -z "$REDO" ] || node render.js video $f build/${f}_raw.mp4; done
enc() { # $1 = h|v   $2 = fichier de sortie
  ffmpeg -y -loglevel error -i build/$1_raw.mp4 -c:v libx264 -preset slow -b:v 2300k -maxrate 3400k -bufsize 6000k -pix_fmt yuv420p -an -pass 1 -passlogfile build/p$1 -f null /dev/null
  ffmpeg -y -loglevel error -i build/$1_raw.mp4 -i build/mix.wav -c:v libx264 -preset slow -b:v 2300k -maxrate 3400k -bufsize 6000k -pix_fmt yuv420p \
    -pass 2 -passlogfile build/p$1 -c:a aac -b:a 112k -shortest -movflags +faststart $2
}
enc h $OUT/friandeasy-intro.mp4
enc v $OUT/friandeasy-intro-vertical.mp4
ffmpeg -y -loglevel error -i build/mix.wav -c:a libmp3lame -b:a 160k $OUT/friandeasy-intro.mp3
node render.js still h 17.5 $OUT/friandeasy-intro-poster.jpg
node render.js still v 17.5 $OUT/friandeasy-intro-poster-vertical.jpg
ls -la $OUT
