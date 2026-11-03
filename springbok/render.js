// Rendu Springbok : capture image par image (Playwright/Chromium, canvas) -> ffmpeg (H.264 + AAC).
// node render.js cues <out.json>                 repères audio
// node render.js video <h|v> <out.mp4> [audio]   vidéo 30 fps
// node render.js still <h|v> <t> <out.png>       une image
// node render.js stills <h|v> <pas> <dossier> images de contrôle
// node render.js check                           contrôle textes : hors cadre / chevauchements (pas de 0,1 s)
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright');
const URL = f => 'file://' + path.join(__dirname, 'scene.html') + '?fmt=' + f;

async function open(browser, f) {
  const v = f === 'v', page = await browser.newPage({ viewport: { width: v ? 1080 : 1920, height: v ? 1920 : 1080 } });
  page.on('pageerror', e => console.error('ERREUR PAGE', e.message));
  await page.goto(URL(f)); await page.evaluate(() => window.ready);
  return page;
}
const frame = (page, t) => page.evaluate(t => { window.seek(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, t).then(b => Buffer.from(b, 'base64'));

(async () => {
  const [mode, a, b, c] = process.argv.slice(2);
  const browser = await chromium.launch();
  if (mode === 'cues') {
    const page = await open(browser, 'h');
    fs.writeFileSync(a, JSON.stringify(await page.evaluate(() => window.CUES)));
  } else if (mode === 'still') {
    fs.writeFileSync(c, await frame(await open(browser, a), parseFloat(b)));
  } else if (mode === 'video') {
    const page = await open(browser, a), { FPS, DURATION } = await page.evaluate(() => ({ FPS: window.FPS, DURATION: window.DURATION }));
    const N = Math.round(FPS * DURATION);
    const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-'];
    if (c) args.push('-i', c, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k');
    args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-t', String(DURATION), '-movflags', '+faststart', b);
    const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < N; i++) {
      if (!ff.stdin.write(await frame(page, i / FPS))) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 150 === 0) console.log(a, 'image', i, '/', N);
    }
    ff.stdin.end(); const code = await new Promise(r => ff.on('close', r)); if (code) throw new Error('ffmpeg ' + code);
  } else if (mode === 'stills') {           // une image toutes les b secondes (défaut 2) -> dossier c
    const page = await open(browser, a); fs.mkdirSync(c, { recursive: true });
    for (let t = 0; t <= 30; t += parseFloat(b)) fs.writeFileSync(path.join(c, `${a}_${String(t.toFixed(1)).padStart(4, '0')}.png`), await frame(page, Math.min(t, 29.99)));
  } else if (mode === 'check') {        // un défaut ne compte que s'il dure >= 0,3 s (les entrées/sorties en mouvement sont tolérées)
    let bad = 0;
    for (const f of ['h', 'v']) {
      const page = await open(browser, f), [W, H] = f === 'v' ? [1080, 1920] : [1920, 1080], run = {};
      for (let i = 0; i < 300; i++) {
        const t = i / 10, boxes = (await page.evaluate(t => window.seek(t), t)).filter(x => x.a > 0.6), now = new Set();
        for (const x of boxes) if (x.x0 < 30 || x.y0 < 30 || x.x1 > W - 30 || x.y1 > H - 30) now.add('HORS CADRE ' + x.s);
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
          const p = boxes[i], q = boxes[j];
          if (p.x0 < q.x1 - 2 && q.x0 < p.x1 - 2 && p.y0 < q.y1 - 2 && q.y0 < p.y1 - 2) now.add('CHEVAUCHE ' + p.s + ' / ' + q.s);
        }
        for (const k of now) { run[k] = (run[k] || 0) + 1; if (run[k] === 3) { bad++; console.log(f, t.toFixed(1), k); } }
        for (const k in run) if (!now.has(k)) delete run[k];
      }
    }
    console.log(bad ? bad + ' problème(s)' : 'OK : aucun texte coupé ni chevauchant');
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
