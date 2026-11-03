#!/bin/bash
# Springbox – pipeline complet : repères audio -> bande son -> 2 vidéos -> contrôle des textes -> planches de contrôle
# Prérequis : node + playwright (Chromium), python3 + numpy, ffmpeg.
set -e
cd "$(dirname "$0")"; mkdir -p build
node render.js check
node render.js cues build/cues.json
python3 audio.py build/cues.json build/audio.wav
node render.js video h springbox_teaser_16x9.mp4 build/audio.wav &
node render.js video v springbox_teaser_9x16.mp4 build/audio.wav
wait
# une image toutes les 2 s, extraite des MP4 finaux
ffmpeg -y -loglevel error -i springbox_teaser_16x9.mp4 -vf "fps=1/2,scale=640:-1,tile=4x4" -frames:v 1 build/controle_16x9.png
ffmpeg -y -loglevel error -i springbox_teaser_9x16.mp4 -vf "fps=1/2,scale=270:-1,tile=8x2" -frames:v 1 build/controle_9x16.png
ls -la *.mp4
