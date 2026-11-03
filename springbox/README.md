# Springbox – teaser 30 s

Motion design 2D flat, 100 % généré par le code (Canvas 2D + synthèse audio numpy). Aucune image externe : le logo est redessiné en vecteurs dans `scene.js` (`logo()`), `logo.png` sert de référence.

| Fichier | Rôle |
|---|---|
| `scene.html` / `scene.js` | l'animation. `scene.html?fmt=h` (1920×1080) ou `?fmt=v` (1080×1920), `&play=1` pour l'aperçu animé |
| `audio.py` | beat électro 116 BPM + bruitages (clic, notif, sonnette…) synthétisés, calés sur `window.CUES` |
| `render.js` | capture image par image (Playwright) → ffmpeg H.264/AAC ; `check` = contrôle textes hors cadre / chevauchants |
| `build.sh` | tout le pipeline → `springbox_teaser_16x9.mp4`, `springbox_teaser_9x16.mp4` |

```bash
./build.sh
```

## Modifier
- **Textes** : objet `T` en tête de `scene.js` (6 mots max ; les tailles s'ajustent automatiquement à la largeur).
- **Mise en page par format** : objet `L` (et `MAP` pour la carte).
- **Timings** : dans chaque fonction `scene…()` (secondes absolues) ; repères sonores dans `CUES`, transitions dans `CUTS`.
- Après modification, `node render.js check` signale tout texte coupé ou chevauchant.

## Storyboard
0-4 annonce · 4-8 point relais barré · 8-11 option Springbox · 11-14 vendeur confirme · 14-20 trajet sur Lyon + chrono 0:00→1:47 · 20-24 livraison à la porte · 24-27 RAPIDE / ABORDABLE / FIABLE · 27-30 logo + baseline.
