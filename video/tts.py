"""Voix off FR via Kokoro (Apache-2.0). Usage: python3 tts.py <dossier_modèles> <sortie>"""
import sys, subprocess, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
M, out = sys.argv[1], sys.argv[2]
k = Kokoro(f"{M}/kokoro.onnx", f"{M}/voices.bin")
L = ["Un petit creux ?",
     "Une envie de sucré, de frais, de croquant ?",
     "Friandeasy, vos distributeurs gourmands à Lyon.",
     "Snacks, boissons, et l'essentiel quand on en a besoin.",
     "Friandeasy. Craque pour le plaisir."]
for i, t in enumerate(L, 1):
    t = t.replace("Friandeasy", "Friandizi")  # prononciation FR : « frian-di-zi »
    t = t.replace("Friandeasy", "Friandizi")  # prononciation FR : « frian-di-zi »
    a, sr = k.create(t, voice="ff_siwis", speed=1.2, lang="fr-fr")
    sf.write(f"{out}/raw{i}.wav", a, sr)
    # voix énergique : léger pitch +5 %, présence/brillance, compression
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{out}/raw{i}.wav", "-af",
        f"asetrate={int(sr*1.05)},aresample={sr},atempo=0.9524,highpass=f=90,equalizer=f=3200:t=q:w=1:g=4,equalizer=f=9000:t=h:w=1:g=3,acompressor=threshold=-20dB:ratio=3:attack=5:release=60:makeup=4,alimiter=limit=0.95",
        f"{out}/vo{i}.wav"], check=True)
    print(i, len(a)/sr)
