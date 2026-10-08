"""Boucle funky/pop originale (synthèse numpy, aucun sample externe) + mix avec la voix off.
Usage: python3 music.py <build_dir> <sortie_mix.wav>   (build_dir contient vo1..vo5.wav)"""
import sys, numpy as np, soundfile as sf
SR = 44100; BPM = 120; DUR = 22.0
B = 60 / BPM; S = B / 4                      # temps / double-croche
N = int(SR * DUR); rng = np.random.default_rng(7)
out = np.zeros(N)
def add(buf, t, x):
    i = int(t * SR); j = min(N, i + len(x))
    if i < N: buf[i:j] += x[:j - i]
def tt(d): return np.arange(int(SR * d)) / SR
def f(m): return 440 * 2 ** ((m - 69) / 12)
def kick():
    t = tt(.32); ph = 2 * np.pi * np.cumsum(45 + 90 * np.exp(-t * 28)) / SR
    return np.sin(ph) * np.exp(-t * 9) * 1.0 + np.sin(ph) * 0.3 * np.exp(-t * 60)
def snare():
    t = tt(.22); n = rng.standard_normal(len(t)); n = n - np.roll(n, 1)
    return (n * 0.35 * np.exp(-t * 20) + np.sin(2 * np.pi * 190 * t) * 0.5 * np.exp(-t * 28))
def hat(op=False):
    t = tt(.18 if op else .05); n = rng.standard_normal(len(t)); n = n - np.roll(n, 1)
    return n * 0.18 * np.exp(-t * (14 if op else 70))
def bass(m, d):
    t = tt(d); fr = f(m); x = sum(np.sin(2 * np.pi * fr * k * t) / k for k in (1, 2, 3, 4)) * 0.5
    return x * np.minimum(1, t * 400) * np.exp(-t * 6) * np.minimum(1, (d - t) * 60)
def stab(ms, d=.3):
    t = tt(d); x = 0
    for m in ms:
        fr = f(m)
        x = x + np.sin(2 * np.pi * fr * t) + .4 * np.sin(2 * np.pi * fr * 2 * t) * np.exp(-t * 12) + .15 * np.sin(2 * np.pi * fr * 3 * t)
    return x / len(ms) * np.exp(-t * 9) * np.minimum(1, t * 300)
def pluck(m, d=.22):
    t = tt(d); fr = f(m)
    x = sum(np.sin(2 * np.pi * fr * k * t) / k for k in (1, 3, 5, 7)) * 0.6
    return x * np.exp(-t * 10) * np.minimum(1, t * 500)
def whoosh(d, up=True):
    t = tt(d); n = rng.standard_normal(len(t)); n = n - np.roll(n, 1)
    env = (t / d) ** 2 if up else (1 - t / d) ** 2
    return n * 0.25 * env * np.minimum(1, (d - t) * 20)
def ding(m, d=1.0):
    t = tt(d); fr = f(m)
    return (np.sin(2 * np.pi * fr * t) + .5 * np.sin(2 * np.pi * fr * 2.01 * t)) * np.exp(-t * 4) * .25

bars = int(DUR / (4 * B))
BASS = [(0, 40, 2), (3, 40, 1), (6, 43, 1), (8, 45, 2), (11, 45, 1), (12, 47, 1), (14, 43, 1)]        # Em
BASSA = [(0, 45, 2), (3, 45, 1), (6, 48, 1), (8, 50, 2), (11, 50, 1), (12, 47, 1), (14, 45, 1)]       # A
STAB1, STAB2 = [64, 67, 71, 74], [64, 67, 69, 73]
LEAD = [(0, 76), (2, 79), (3, 76), (6, 74), (8, 76), (10, 79), (12, 83), (14, 81)]
for b in range(bars):
    t0 = b * 4 * B; first = b < 2; last = b == bars - 1
    for k in (0, 4, 8, 12) + ((10,) if b % 2 else ()):
        add(out, t0 + k * S, kick() * (0.7 if first else 1))
    for k in (4, 12): add(out, t0 + k * S, snare() * (0.6 if first else 1))
    if b >= 1:
        for k in range(16): add(out, t0 + k * S, hat(k % 4 == 2) * (1.0 if k % 2 == 0 else 0.55))
    pat = BASS if (b % 2 == 0) else BASSA
    for st, m, ln in pat: add(out, t0 + st * S, bass(m, ln * S * 0.9) * 0.75)
    for st in (3, 6, 10, 14) if b >= 1 else (6, 14):
        add(out, t0 + st * S, stab(STAB1 if b % 2 == 0 else STAB2) * 0.22)
    if b >= 3 and not last:
        for st, m in LEAD: add(out, t0 + st * S, pluck(m + (0 if b % 2 == 0 else -2)) * 0.2)
# effets de transition aux coupes + impact + ding
for tc in (2.0, 4.5, 8.5, 10.5, 12.5): add(out, tc - .45, whoosh(.45) * .9)
add(out, 14.05, whoosh(.45) * 1.1)
add(out, 14.5, kick() * 1.4); add(out, 14.5, snare() * 1.2)
add(out, 14.9, ding(88)); add(out, 15.05, ding(91)); add(out, 15.2, ding(95))
# fondu final pour la boucle
fade = np.ones(N); k = int(.35 * SR); fade[-k:] = np.linspace(1, 0, k); out *= fade
out = np.tanh(out * 1.1) * 0.9

# voix off + ducking
VO = [(.30, 1), (2.00, 2), (4.60, 3), (8.70, 4), (14.80, 5)]
voice = np.zeros(N)
for t, i in VO:
    a, sr = sf.read(f"{sys.argv[1]}/vo{i}.wav"); assert sr == SR or True
    if sr != SR:
        a = np.interp(np.arange(int(len(a) * SR / sr)) / SR, np.arange(len(a)) / sr, a)
    a = np.asarray(a, dtype=float)
    act = a[np.abs(a) > 0.02 * np.abs(a).max()]
    a = a * (0.16 / max(1e-6, np.sqrt(np.mean(act ** 2))))      # volume égal d'une phrase à l'autre
    add(voice, t, a)
voice = np.tanh(voice * 1.4) * 0.8
env = np.abs(voice); w = int(.05 * SR)
env = np.convolve(env, np.ones(w) / w, "same"); env = np.convolve(env, np.ones(int(.25 * SR)) / int(.25 * SR), "same")
duck = np.clip(env * 6, 0, 1)
mix = out * (0.55 - 0.3 * duck) + voice
mix = np.tanh(mix * 1.05) * 0.95
sf.write(sys.argv[2], np.stack([mix, mix], 1), SR)
sf.write(sys.argv[2].replace(".wav", "-music.wav"), np.stack([out, out], 1), SR)
print("ok", DUR)
