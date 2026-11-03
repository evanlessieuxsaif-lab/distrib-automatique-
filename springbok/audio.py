"""Bande son Springbok : beat électro léger 116 BPM + effets sonores, 100 % synthétisés (numpy), libres de droits.
Usage : python3 audio.py <cues.json> <sortie.wav>     (cues.json produit par `node render.js cues`)"""
import sys, json, wave, numpy as np

SR, DUR, BPM = 48000, 30.0, 116
N = int(SR * DUR); B = 60 / BPM; S16 = B / 4
rng = np.random.default_rng(3)
mus, sfx = np.zeros(N), np.zeros(N)

def tt(d): return np.arange(int(SR * d)) / SR
def f(m): return 440 * 2 ** ((m - 69) / 12)
def add(buf, t, x, g=1.0):
    i = int(t * SR)
    if i >= N: return
    j = min(N, i + len(x)); buf[i:j] += g * x[:j - i]
def noise(d):
    n = rng.standard_normal(int(SR * d)); return n - np.roll(n, 1)   # bruit « brillant »
def lp(x, a):                                                       # passe-bas 1 pôle
    y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x): acc += a * (v - acc); y[i] = acc
    return y

# ---------- instruments ----------
def kick():
    t = tt(.35); ph = 2 * np.pi * np.cumsum(48 + 110 * np.exp(-t * 30)) / SR
    return np.sin(ph) * np.exp(-t * 8)
def clap():
    t = tt(.2); n = noise(.2); env = sum(np.exp(-np.maximum(t - k, 0) * 60) * (t >= k) for k in (0, .01, .02))
    return n * env * .25
def hat(o=False):
    d = .14 if o else .04; t = tt(d); return noise(d) * np.exp(-t * (18 if o else 90)) * .12
def bass(m, d):
    t = tt(d); fr = f(m); x = np.sign(np.sin(2 * np.pi * fr * t)) * .3 + np.sin(2 * np.pi * fr * t) * .7
    return lp(x, .08) * np.minimum(1, t * 300) * np.minimum(1, (d - t) * 80) * .9
def pluck(m, d=.25):
    t = tt(d); fr = f(m); x = sum(np.sin(2 * np.pi * fr * k * t) / k ** 1.5 for k in (1, 2, 3, 4))
    return x * np.exp(-t * 14) * np.minimum(1, t * 600) * .5
def pad(ms, d):
    t = tt(d); x = sum(np.sin(2 * np.pi * f(m) * t + np.sin(2 * np.pi * .3 * t)) for m in ms) / len(ms)
    return x * np.minimum(1, t * 3) * np.minimum(1, (d - t) * 3) * .18

# ---------- musique ----------
CH = [([57, 60, 64], 45), ([53, 57, 60], 41), ([48, 52, 55], 36), ([55, 59, 62], 43)]   # Am F C G
ARP = [0, 2, 1, 2, 0, 2, 1, 2]
bars = int(DUR / (4 * B)) + 1
for b in range(bars):
    t0 = b * 4 * B; ch, root = CH[b % 4]
    if t0 > DUR: break
    add(mus, t0, pad(ch, 4 * B), 1)
    for k in range(16):
        tk = t0 + k * S16
        if tk >= 28.3: break
        if t0 >= 2.0 and k % 4 == 0: add(mus, tk, kick(), .9 if t0 >= 4 else .5)
        if t0 >= 4.0 and k % 4 == 2: add(mus, tk, hat(True))
        if t0 >= 8.0 and k % 2 == 1: add(mus, tk, hat(), .8)
        if t0 >= 8.0 and k in (4, 12): add(mus, tk, clap())
        if t0 >= 4.0 and k in (0, 3, 6, 10, 12, 14): add(mus, tk, bass(root - 12 + (12 if k == 6 else 0), S16 * 1.8), .55)
        if t0 >= 8.0 and k % 2 == 0: add(mus, tk, pluck(ch[ARP[(k // 2) % 8]] + 12), .35)
# accord final tenu
add(mus, 28.3, pad([57, 60, 64, 69], 1.7) * 2.2); add(mus, 28.3, kick(), 1.0)

# ---------- effets sonores ----------
def s_key():   t = tt(.03); return (noise(.03) * .3 + np.sin(2 * np.pi * 2600 * t) * .3) * np.exp(-t * 160)
def s_click(): t = tt(.06); return (np.sin(2 * np.pi * 1400 * t) * .7 + noise(.06) * .25) * np.exp(-t * 90)
def s_pop():
    t = tt(.12); ph = 2 * np.pi * np.cumsum(500 + 900 * t / .12) / SR; return np.sin(ph) * np.exp(-t * 35) * .6
def s_whoosh(d=.35):
    t = tt(d); return lp(noise(d), .25) * np.sin(np.pi * t / d) ** 2 * 1.4
def s_swipe(): return s_whoosh(.22)
def s_strike():
    t = tt(.3); ph = 2 * np.pi * np.cumsum(900 - 600 * t / .3) / SR
    return (lp(noise(.3), .4) * .8 + np.sign(np.sin(ph)) * .12) * np.exp(-t * 6) * np.minimum(1, t * 200)
def tone(m, d, dec=6, g=.4):
    t = tt(d); fr = f(m); return (np.sin(2 * np.pi * fr * t) + .3 * np.sin(2 * np.pi * fr * 2 * t)) * np.exp(-t * dec) * g
def s_notif():
    x = np.zeros(int(SR * .6)); a = tone(88, .4, 9); b = tone(95, .45, 7)
    x[:len(a)] += a; i = int(SR * .12); x[i:i + len(b)] += b[:len(x) - i]; return x
def s_success():
    x = np.zeros(int(SR * .7))
    for k, m in enumerate((84, 88, 91, 96)):
        a = tone(m, .4, 9, .3); i = int(SR * .06 * k); x[i:i + len(a)] += a[:len(x) - i]
    return x
def s_shutter():
    x = np.zeros(int(SR * .2)); c = noise(.03) * np.exp(-tt(.03) * 120) * .8
    x[:len(c)] += c; i = int(SR * .08); x[i:i + len(c)] += c; return x
def s_lock():
    x = np.zeros(int(SR * .5)); a = tone(93, .1, 25, .4); b = tone(100, .18, 14, .4)
    x[:len(a)] += a; i = int(SR * .12); x[i:i + len(b)] += b; c = s_click(); i = int(SR * .32); x[i:i + len(c)] += c; return x
def bell(m, d):
    t = tt(d); fr = f(m)
    return sum(g * np.sin(2 * np.pi * fr * r * t) * np.exp(-t * e) for r, g, e in ((1, 1, 2.5), (2.76, .4, 5), (5.4, .2, 9))) * .35
def s_bell():
    x = np.zeros(int(SR * 1.6)); a = bell(76, 1.0); b = bell(72, 1.2)
    x[:len(a)] += a; i = int(SR * .35); x[i:i + len(b)] += b; return x
def s_door():
    t = tt(.4); ph = 2 * np.pi * np.cumsum(220 + 120 * np.sin(t * 30)) / SR
    return (np.sin(ph) * .15 + lp(noise(.4), .1) * .6) * np.sin(np.pi * t / .4)
def s_thud():
    t = tt(.4); ph = 2 * np.pi * np.cumsum(60 + 140 * np.exp(-t * 40)) / SR
    return np.sin(ph) * np.exp(-t * 9) * 1.1 + lp(noise(.4), .2) * np.exp(-t * 30) * .5
def s_boing():
    t = tt(.5); ph = 2 * np.pi * np.cumsum(300 + 160 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 4) + 200 * t) / SR
    return np.sin(ph) * np.exp(-t * 5) * .45
def s_sparkle():
    x = np.zeros(int(SR * .9))
    for k, m in enumerate((96, 100, 103, 108)):
        a = tone(m, .5, 10, .18); i = int(SR * .07 * k); x[i:i + len(a)] += a[:len(x) - i]
    return x
def s_bike():
    t = tt(.5); return np.sin(2 * np.pi * 2093 * t) * np.exp(-t * 8) * .2 + np.sin(2 * np.pi * 2637 * t) * np.exp(-t * 8) * .15
def s_hit(): return s_thud() * .8
def s_wipe(): return s_whoosh(.4) * 1.1

FX = {'key': s_key, 'click': s_click, 'pop': s_pop, 'whoosh': s_whoosh, 'swipe': s_swipe, 'strike': s_strike, 'notif': s_notif,
      'success': s_success, 'shutter': s_shutter, 'lock': s_lock, 'bell': s_bell, 'door': s_door, 'thud': s_thud, 'boing': s_boing,
      'sparkle': s_sparkle, 'bike': s_bike, 'hit': s_hit, 'wipe': s_wipe}
GAIN = {'key': .5, 'whoosh': .6, 'wipe': .55, 'swipe': .5}
for t, k in json.load(open(sys.argv[1])):
    x = FX[k](); add(sfx, t - (.2 if k in ('whoosh', 'wipe') else 0), x, GAIN.get(k, 1.0))

# ---------- mix ----------
mix = mus * .55 + sfx * .9
fade = np.ones(N); fl = int(SR * .8); fade[-fl:] = np.linspace(1, 0, fl) ** 2; mix *= fade
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
mix *= .89 / max(1e-9, np.abs(mix).max())
st = np.stack([mix, np.roll(mix, 24) * .98 + mix * .02], 1)          # léger élargissement stéréo
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print('audio ok', sys.argv[2])
