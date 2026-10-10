"""Musique originale de la vidéo de présentation (20 s, boucle exacte : 8 mesures à 96 BPM).
Synthèse numpy, aucun sample externe. Usage : python3 music-presentation.py build/presentation-music.wav [dossier_voix]
Avec un dossier de voix (p1..p7.mp3, ElevenLabs via Higgsfield), la voix off est mixée et la musique baisse sous la voix."""
import sys, os, io, subprocess, numpy as np, soundfile as sf
SR = 44100; BPM = 96; B = 60 / BPM; S = B / 4; DUR = 20.0
N = int(SR * DUR); rng = np.random.default_rng(3); out = np.zeros((N, 2))
def tt(d): return np.arange(int(SR * d)) / SR
def f(m): return 440 * 2 ** ((m - 69) / 12)
def add(t, x, pan=0.0):   # ajout circulaire : ce qui dépasse la fin revient au début (boucle sans coupure)
    idx = (int(t * SR) + np.arange(len(x))) % N
    np.add.at(out[:, 0], idx, x * (1 - pan) / 2 ** .5); np.add.at(out[:, 1], idx, x * (1 + pan) / 2 ** .5)
def kick():
    t = tt(.3); ph = 2 * np.pi * np.cumsum(48 + 80 * np.exp(-t * 30)) / SR
    return np.sin(ph) * np.exp(-t * 10) * .9
def clap():
    t = tt(.2); n = rng.standard_normal(len(t)); n = n - np.roll(n, 1)
    env = np.exp(-t * 25) * (1 + .6 * (np.sin(t * 2 * np.pi * 90) > 0) * (t < .03))
    return n * .22 * env
def hat(v=1):
    t = tt(.05); n = rng.standard_normal(len(t)); n = n - np.roll(n, 1)
    return n * .09 * v * np.exp(-t * 80)
def bass(m, d):
    t = tt(d); x = np.sin(2 * np.pi * f(m) * t) + .3 * np.sin(2 * np.pi * f(m) * 2 * t)
    return x * .42 * np.minimum(1, t * 300) * np.minimum(1, (d - t) * 40)
def keys(ms, d):
    t = tt(d); x = sum(np.sin(2 * np.pi * f(m) * t) + .35 * np.sin(2 * np.pi * f(m) * 2 * t) * np.exp(-t * 6) for m in ms)
    return x / len(ms) * .2 * np.exp(-t * 3.2) * np.minimum(1, t * 200)
def pluck(m):
    t = tt(.35); x = sum(np.sin(2 * np.pi * f(m) * k * t) / k ** 1.5 for k in (1, 2, 3))
    return x * .11 * np.exp(-t * 9) * np.minimum(1, t * 400)
def whoosh(d=.4):
    t = tt(d); n = rng.standard_normal(len(t)); n = np.convolve(n, np.ones(6) / 6, 'same')
    return n * .12 * (t / d) ** 2 * np.minimum(1, (d - t) * 30)
def chime(m):
    t = tt(1.2); return (np.sin(2 * np.pi * f(m) * t) + .4 * np.sin(2 * np.pi * f(m) * 3.01 * t)) * np.exp(-t * 3.5) * .12

# Progression en Do majeur, lumineuse : C – Am – F – G (une mesure chacun)
CH = [([60, 64, 67, 71], 36), ([57, 60, 64, 67], 33), ([53, 57, 60, 64], 29), ([55, 59, 62, 65], 31)]
MEL = [(0, 76), (3, 79), (6, 77), (8, 76), (11, 74), (14, 72)]
bars = int(round(DUR / (4 * B)))                        # = 8
for b in range(bars):
    t0 = b * 4 * B; chord, root = CH[b % 4]; intro = b == 0
    for k in (0, 8): add(t0 + k * S, kick() * (.6 if intro else 1))
    if b % 2: add(t0 + 14 * S, kick() * .5)
    for k in (4, 12): add(t0 + k * S, clap() * (.5 if intro else 1), .1)
    for k in range(16): add(t0 + k * S, hat(1 if k % 2 == 0 else .55), -.3 if k % 4 else .3)
    for k, ln in ((0, 3), (3, 3), (6, 2), (8, 3), (11, 2), (14, 2)): add(t0 + k * S, bass(root + (12 if k == 11 else 0), ln * S * .9))
    for k in (0, 6, 10): add(t0 + k * S, keys(chord, 1.2), .15)
    if b >= 2: 
        for k, m in MEL: add(t0 + k * S, pluck(m + (0 if b % 4 < 2 else -2)), -.2)
# Habillage sonore calé sur les changements de scène (2,7 / 6,9 / 11,6 / 15,4 s) + carillon sur le contact
for tc in (2.7, 6.9, 11.6, 15.4): add(tc - .4, whoosh())
for k, m in enumerate((84, 88, 91)): add(15.45 + k * .12, chime(m))
out = np.tanh(out * 1.2) * .85
# Voix off : phrase n° i posée à l'instant VO[i] (calé sur les scènes de index.html)
VO = [(.15, 1), (2.8, 2), (7.1, 3), (8.25, 4), (9.95, 5), (11.75, 6), (15.6, 7)]
if len(sys.argv) > 2 and os.path.isdir(sys.argv[2]):
    voice = np.zeros(N)
    for t, i in VO:
        raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', os.path.join(sys.argv[2], f'p{i}.mp3'), '-f', 'wav', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
        a, _ = sf.read(io.BytesIO(raw)); act = a[np.abs(a) > .02 * np.abs(a).max()]
        a = a * (.17 / np.sqrt(np.mean(act ** 2)))          # même volume pour chaque phrase
        j = int(t * SR); voice[j:j + len(a)] += a[:N - j]
    env = np.convolve(np.abs(voice), np.ones(int(.3 * SR)) / int(.3 * SR), 'same')
    duck = np.clip(env * 8, 0, 1)[:, None]
    out = out * (.62 - .34 * duck) + np.tanh(voice * 1.3)[:, None] * .82
    out = np.tanh(out * 1.05) * .92
sf.write(sys.argv[1], out, SR); print('ok', DUR, 's,', bars, 'mesures')
