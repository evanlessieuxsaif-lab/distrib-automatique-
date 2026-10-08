"""Réinjecte les médias de assets/video/ (base64) dans index-standalone.html (remplace les data: URI existantes, dans l'ordre)."""
import base64, re
b = lambda f, m: f"data:{m};base64," + base64.b64encode(open('assets/video/' + f, 'rb').read()).decode()
s = open('index-standalone.html').read()
M = {'poster': 'friandeasy-intro-poster.jpg', 'data-src-wide': 'friandeasy-intro.mp4', 'data-src-tall': 'friandeasy-intro-vertical.mp4',
     'data-poster-wide': 'friandeasy-intro-poster.jpg', 'data-poster-tall': 'friandeasy-intro-poster-vertical.jpg'}
for attr, f in M.items():
    mime = 'video/mp4' if f.endswith('mp4') else 'image/jpeg'
    s = re.sub(r'(\s%s=")data:[^"]+"' % attr, lambda m: m.group(1) + b(f, mime) + '"', s, count=1)
open('index-standalone.html', 'w').write(s)
