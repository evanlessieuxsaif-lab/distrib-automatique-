"""Voix off FR via Kokoro (Apache-2.0). Usage: python3 tts.py <dossier_modèles> <sortie>"""
import sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
M, out = sys.argv[1], sys.argv[2]
k = Kokoro(f"{M}/kokoro.onnx", f"{M}/voices.bin")
L = ["Un petit creux ?",
     "Une envie de sucré, de frais, de croquant ?",
     "Friandeasy, vos distributeurs gourmands à Lyon.",
     "Snacks, boissons, et l'essentiel quand on en a besoin.",
     "Friandeasy. Craque pour le plaisir."]
for i, t in enumerate(L, 1):
    a, sr = k.create(t, voice="ff_siwis", speed=1.12, lang="fr-fr")
    sf.write(f"{out}/vo{i}.wav", a, sr); print(i, len(a)/sr)
