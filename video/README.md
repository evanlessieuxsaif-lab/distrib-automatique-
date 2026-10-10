# Vidéo d'intro Friandeasy

Animation 100 % code, durée 22 s (Canvas 2D + tracés vectoriels originaux, police Poppins OFL), rendue image par image.

- `scene.html` / `scene.js` : l'animation. `scene.html?fmt=h` (1920×1080) ou `?fmt=v` (1080×1920) ; `&play=1` pour la voir tourner dans le navigateur (sans son).
- `voix/vo1..5.mp3` : voix off naturelle (ElevenLabs via Higgsfield). `tts.py` : voix locale de secours (Kokoro-82M, Apache-2.0) utilisée si `voix/` est absent.
- `music.py` : boucle funky 120 BPM synthétisée en numpy (aucun sample, aucun droit tiers) + mix voix/ducking → mp3.
- `render-intro.js` : capture headless (Playwright/Chromium) → ffmpeg. `build.sh` enchaîne tout et encode en H.264 2 passes (< 8 Mo).

```
MODELS=/chemin/vers/kokoro ./build.sh     # kokoro.onnx + voices.bin dans $MODELS
```
Sorties dans `../assets/video/` : `friandeasy-intro.mp4` (16:9), `friandeasy-intro-vertical.mp4` (9:16), `friandeasy-intro.mp3`, affiches `.jpg`.

Pour changer un texte ou un timing : `SC` (scènes) et `SUBS` dans `scene.js`, `VO` dans `music.py`.

## Vidéo de présentation (25 s, muette)

- `index.html` : source (HTML/CSS + timeline JS déterministe, `window.seek(t)`). Aperçu : `index.html?play=1`.
- `render.js` : `node render.js` → `friandeasy.mp4` (H.264), `friandeasy.webm` (VP9), `friandeasy-poster.jpg`, avec la musique de `music-presentation.py` (synthèse numpy, boucle de 25 s). `node render.js still <t> <out.jpg>` pour une image.
- `snippet.html` : balise `<video autoplay muted loop playsinline>` prête à coller.
