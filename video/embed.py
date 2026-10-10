"""Réinjecte les médias de la pop-up vidéo (base64) dans index-standalone.html (attributs poster / data-src-wide / data-poster-wide)."""
import base64, re
b = lambda f, m: f"data:{m};base64," + base64.b64encode(open(f, 'rb').read()).decode()
s = open('index-standalone.html').read()
M = {'poster': 'video/friandeasy-poster.jpg', 'data-src-wide': 'video/friandeasy.mp4', 'data-poster-wide': 'video/friandeasy-poster.jpg'}
for attr, f in M.items():
    mime = 'video/mp4' if f.endswith('mp4') else 'image/jpeg'
    s, n = re.subn(r'(\s%s=")[^"]+"' % attr, lambda m: m.group(1) + b(f, mime) + '"', s, count=1)
    assert n == 1, attr
open('index-standalone.html', 'w').write(s)
