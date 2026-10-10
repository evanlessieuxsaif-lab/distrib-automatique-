// Capture headless : rend scene.html image par image (Chromium + Playwright) et encode avec ffmpeg.
// Usage : node render-intro.js video <h|v> <sortie_sans_audio.mp4>
//         node render-intro.js still <h|v> <temps_s> <sortie.png>
const path = require('path'), http = require('http'), fs = require('fs'), { spawn } = require('child_process');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.png': 'image/png' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream'); r.end(d); });
});
(async () => {
  const [mode, fmt, a, b] = process.argv.slice(2);
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port, V = fmt === 'v';
  const browser = await chromium.launch({ args: ['--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: V ? 1080 : 1920, height: V ? 1920 : 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await page.goto(`http://127.0.0.1:${port}/video/scene.html?fmt=${fmt}`);
  await page.evaluate(() => window.ready);
  if (mode === 'still') {
    await page.evaluate(t => window.renderFrame(t), parseFloat(a));
    await page.screenshot(b.endsWith('.png') ? { path: b, type: 'png' } : { path: b, type: 'jpeg', quality: 92 });
  } else {
    const FPS = 30, N = await page.evaluate(() => window.DURATION * 30);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '10', '-pix_fmt', 'yuv420p', '-r', String(FPS), a], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < N; i++) {
      await page.evaluate(t => window.renderFrame(t), i / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 100 === 0) console.log('frame', i, '/', N);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
