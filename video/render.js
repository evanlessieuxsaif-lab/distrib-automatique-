// Rendu de la vidéo de présentation (index.html) : capture image par image (Playwright/Chromium) + ffmpeg.
// Usage : node render.js                    -> friandeasy.mp4, friandeasy.webm, friandeasy-poster.jpg
//         node render.js still <t> <out.jpg> -> une image à l'instant t (contrôle)
const path = require('path'), http = require('http'), fs = require('fs'), { spawnSync, spawn } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright');
const ROOT = path.resolve(__dirname, '..'), OUT = __dirname, TMP = path.join(__dirname, 'build');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.png': 'image/png' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream'); r.end(d); });
});
const ff = args => { const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' }); if (r.status) throw new Error('ffmpeg ' + r.status); };

(async () => {
  const [mode, a, b] = process.argv.slice(2);
  fs.mkdirSync(TMP, { recursive: true });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ args: ['--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('ERREUR PAGE', e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/video/index.html`);
  await page.evaluate(() => window.ready);
  const shot = async (t, file) => { await page.evaluate(t => window.seek(t), t); return page.screenshot(file ? { path: file, type: 'jpeg', quality: 90 } : { type: 'jpeg', quality: 95 }); };

  if (mode === 'still') { await shot(parseFloat(a), b); }
  else {
    const { DURATION, FPS } = await page.evaluate(() => ({ DURATION: window.DURATION, FPS: window.FPS }));
    const N = Math.round(DURATION * FPS), raw = path.join(TMP, 'presentation_raw.mp4');
    const enc = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '8', '-pix_fmt', 'yuv420p', raw], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < N; i++) {
      const buf = await shot(i / FPS);
      if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r));
      if (i % 150 === 0) console.log('image', i, '/', N);
    }
    enc.stdin.end(); await new Promise(r => enc.on('close', r));
    // Musique originale (boucle de 20 s) + voix off, puis MP4 H.264 + AAC et WebM VP9 + Opus, < 5 Mo chacun
    const music = path.join(TMP, 'presentation-music.wav');
    if (spawnSync('python3', [path.join(__dirname, 'music-presentation.py'), music, path.join(__dirname, 'voix-presentation')], { stdio: 'inherit' }).status) throw new Error('musique');
    ff(['-i', raw, '-i', music, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-tune', 'animation', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', path.join(OUT, 'friandeasy.mp4')]);
    ff(['-i', raw, '-i', music, '-map', '0:v', '-map', '1:a', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '30', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p',
      '-c:a', 'libopus', '-b:a', '112k', '-shortest', path.join(OUT, 'friandeasy.webm')]);
    await shot(5.5, path.join(OUT, 'friandeasy-poster.jpg'));
    for (const f of ['friandeasy.mp4', 'friandeasy.webm', 'friandeasy-poster.jpg'])
      console.log(f, (fs.statSync(path.join(OUT, f)).size / 1048576).toFixed(2), 'Mo');
  }
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
