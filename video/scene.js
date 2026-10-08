/* Friandeasy – intro animée. Tout est dessiné en code (Canvas 2D + tracés vectoriels originaux).
   window.renderFrame(t) dessine l'image à l'instant t (secondes) : rendu déterministe, capturé image par image.
   ?fmt=h (1920×1080, défaut) ou ?fmt=v (1080×1920). */
(() => {
const Q = new URLSearchParams(location.search);
const V = Q.get('fmt') === 'v';
const W = V ? 1080 : 1920, H = V ? 1920 : 1080;
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const snap = document.createElement('canvas'); snap.width = W; snap.height = H;
const sctx = snap.getContext('2d');
const DURATION = 20;

/* ---------- palette (celle du site) ---------- */
const C = { orange: '#FF7A3D', pink: '#FF4D6D', yellow: '#FFD23F', turq: '#2EC4B6', ink: '#2B2B33', peach: '#FFE3D6',
  cream: '#FFF8F0', blue: '#19B5EC', violet: '#8B4DFF', green: '#7ED957', brown: '#7B3F1D', red: '#F2384F' };

/* ---------- utilitaires ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const outCubic = p => 1 - Math.pow(1 - p, 3);
const inCubic = p => p * p * p;
const inOut = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const outBack = p => { const c1 = 2.1, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
const outElastic = p => p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -9 * p) * Math.sin((p * 10 - .75) * (2 * Math.PI) / 3) + 1;
const R = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const pick = (arr, i) => arr[Math.floor(R(i) * arr.length) % arr.length];
const PALETTE = [C.pink, C.yellow, C.orange, C.turq, C.violet, C.blue, C.green, C.red];

function bounceY(t, y0, floor, g = 2600, e = .55) {   // chute + rebonds (t = temps depuis le lâcher) ; renvoie y
  if (t < 0) return y0;
  let h = floor - y0, tf = Math.sqrt(2 * h / g), v = g * tf;
  if (t < tf) return y0 + .5 * g * t * t;
  t -= tf;
  for (let k = 0; k < 6; k++) {
    v *= e; const tb = 2 * v / g;
    if (t < tb) return floor - (v * t - .5 * g * t * t);
    t -= tb;
  }
  return floor;
}
function shade(hex, f) { // f>0 éclaircit, f<0 assombrit
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const m = f < 0 ? 0 : 255, a = Math.abs(f);
  r = Math.round(lerp(r, m, a)); g = Math.round(lerp(g, m, a)); b = Math.round(lerp(b, m, a));
  return `rgb(${r},${g},${b})`;
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function star(c, x, y, r, rot = 0) { // étincelle à 4 branches
  c.save(); c.translate(x, y); c.rotate(rot); c.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rad = i % 2 ? r * .22 : r; c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  c.closePath(); c.fill(); c.restore();
}
// Dessine une forme (liste de fonctions de tracé) avec contour encre puis remplissage : donne l'effet « sticker »
function sticker(c, shapes, fill, lw = 10) {
  c.save(); c.lineJoin = 'round'; c.strokeStyle = C.ink; c.lineWidth = lw;
  for (const s of shapes) { c.beginPath(); s(c); c.fillStyle = C.ink; c.fill(); c.stroke(); }
  c.fillStyle = fill; for (const s of shapes) { c.beginPath(); s(c); c.fill(); }
  c.restore();
}
function shine(c, x, y, rx, ry, rot = -.6, a = .6) {
  c.save(); c.globalAlpha = a; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, 7); c.fill(); c.restore();
}

/* ---------- illustrations vectorielles (origine = centre, ~200 px) ---------- */
function wrapped(c, c1 = C.pink, c2 = C.yellow) {
  const ends = [-1, 1];
  for (const s of ends) {
    sticker(c, [k => { k.moveTo(s * 56, 0); k.lineTo(s * 120, -44); k.quadraticCurveTo(s * 106, 0, s * 120, 44); k.closePath(); }], c2, 9);
  }
  sticker(c, [k => k.ellipse(0, 0, 74, 48, 0, 0, 7)], c1, 10);
  c.save(); c.beginPath(); c.ellipse(0, 0, 70, 44, 0, 0, 7); c.clip();
  c.fillStyle = c2; for (let i = -3; i < 4; i++) { c.beginPath(); c.moveTo(i * 28 - 8, -50); c.lineTo(i * 28 + 8, -50); c.lineTo(i * 28 - 16, 50); c.lineTo(i * 28 - 32, 50); c.fill(); }
  c.restore(); shine(c, -22, -20, 26, 8, -.3);
}
function lolly(c, c1 = C.pink, c2 = C.yellow, spin = 0) {
  sticker(c, [k => k.roundRect(-9, 40, 18, 120, 9)], '#fff', 9);
  sticker(c, [k => k.arc(0, 0, 76, 0, 7)], c1, 11);
  c.save(); c.rotate(spin); c.strokeStyle = c2; c.lineWidth = 15; c.lineCap = 'round'; c.beginPath();
  for (let a = 0; a < 17; a += .1) { const r = 6 + a * 3.9; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke(); c.restore();
  shine(c, -34, -38, 20, 8, -.8, .7);
}
function dragee(c, col = C.turq) {
  sticker(c, [k => k.arc(0, 0, 40, 0, 7)], col, 9);
  shine(c, -14, -16, 14, 6, -.8, .75);
  c.save(); c.globalAlpha = .25; c.fillStyle = '#000'; c.beginPath(); c.arc(0, 0, 40, .2, 2.4); c.arc(0, 0, 28, 2.4, .2, true); c.fill(); c.restore();
}
function gummy(c, col = C.red) {
  const S = [k => k.ellipse(0, 6, 36, 46, 0, 0, 7), k => k.arc(0, -50, 30, 0, 7), k => k.arc(-22, -74, 13, 0, 7), k => k.arc(22, -74, 13, 0, 7),
    k => k.ellipse(-42, -8, 14, 28, -.5, 0, 7), k => k.ellipse(42, -8, 14, 28, .5, 0, 7), k => k.ellipse(-20, 56, 16, 26, .15, 0, 7), k => k.ellipse(20, 56, 16, 26, -.15, 0, 7)];
  sticker(c, S, col, 10);
  shine(c, -12, -6, 9, 22, .2, .55); shine(c, -10, -58, 9, 5, -.7, .6);
  c.fillStyle = C.ink; c.beginPath(); c.arc(-10, -50, 3.6, 0, 7); c.arc(10, -50, 3.6, 0, 7); c.fill();
  c.strokeStyle = C.ink; c.lineWidth = 3.6; c.lineCap = 'round'; c.beginPath(); c.arc(0, -44, 8, .2, Math.PI - .2); c.stroke();
}
function choco(c) {
  c.save(); c.rotate(-.1);
  sticker(c, [k => k.roundRect(-82, -50, 164, 100, 12)], C.brown, 10);
  c.strokeStyle = shade(C.brown, -.35); c.lineWidth = 5;
  for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-82 + i * 41, -50); c.lineTo(-82 + i * 41, 50); c.stroke(); }
  for (let j = 1; j < 3; j++) { c.beginPath(); c.moveTo(-82, -50 + j * 33); c.lineTo(82, -50 + j * 33); c.stroke(); }
  c.fillStyle = shade(C.brown, .25); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { c.beginPath(); c.roundRect(-76 + i * 41, -44 + j * 33, 12, 6, 3); c.fill(); }
  // emballage à moitié déchiré
  c.save(); c.beginPath(); c.roundRect(-82, -50, 164, 100, 12); c.clip();
  c.fillStyle = C.red; c.beginPath(); c.moveTo(-90, 6); for (let i = 0; i <= 8; i++) c.lineTo(-90 + i * 24, i % 2 ? 6 : 20); c.lineTo(100, 60); c.lineTo(-90, 60); c.fill();
  c.fillStyle = C.yellow; c.fillRect(-90, 34, 190, 8); c.restore();
  c.strokeStyle = C.ink; c.lineWidth = 10; c.beginPath(); c.roundRect(-82, -50, 164, 100, 12); c.stroke();
  c.restore();
}
function chip(c, rot = 0) {
  c.save(); c.rotate(rot);
  const pts = []; for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283, r = 64 + 7 * Math.sin(a * 5 + 1) + 4 * Math.sin(a * 3); pts.push([Math.cos(a) * r, Math.sin(a) * r * .8]); }
  sticker(c, [k => { pts.forEach((p, i) => i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])); k.closePath(); }], '#FFC83C', 9);
  c.strokeStyle = shade('#FFC83C', -.25); c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-34, -10); c.quadraticCurveTo(0, -30, 34, -6); c.moveTo(-26, 14); c.quadraticCurveTo(4, 2, 30, 20); c.stroke();
  c.fillStyle = C.orange; [[-30, 4], [8, -16], [22, 12], [-6, 20]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 3.4, 0, 7); c.fill(); });
  c.restore();
}
function cookie(c) {
  sticker(c, [k => k.arc(0, 0, 64, 0, 7)], '#E0A25A', 10);
  c.strokeStyle = shade('#E0A25A', -.2); c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 52, .4, 2.6); c.stroke();
  c.fillStyle = '#5A2E14';
  [[-28, -22, 11], [22, -28, 9], [8, 6, 12], [-26, 26, 9], [34, 20, 10], [-4, -34, 6]].forEach(p => { c.beginPath(); c.moveTo(p[0] - p[2], p[1]); c.lineTo(p[0], p[1] - p[2] * .9); c.lineTo(p[0] + p[2], p[1] + 2); c.lineTo(p[0] - 2, p[1] + p[2]); c.closePath(); c.fill(); });
}
function can(c, col = C.orange, frost = 1, t = 0, seed = 1) {
  const w = 86, h = 170;
  const body = k => k.roundRect(-w / 2, -h / 2, w, h, 20);
  sticker(c, [body], col, 10);
  c.save(); c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 20); c.clip();
  const g = c.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, 'rgba(0,0,0,.28)'); g.addColorStop(.28, 'rgba(255,255,255,.35)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.3)');
  c.fillStyle = g; c.fillRect(-w / 2, -h / 2, w, h);
  // étiquette ondulée
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-w / 2, -14);
  for (let x = -w / 2; x <= w / 2; x += 6) c.lineTo(x, -14 + Math.sin(x * .12) * 8);
  for (let x = w / 2; x >= -w / 2; x -= 6) c.lineTo(x, 32 + Math.sin(x * .12 + 1) * 8);
  c.closePath(); c.fill();
  c.fillStyle = shade(col, -.1); c.beginPath(); c.arc(0, 10, 15, 0, 7); c.fill();
  c.fillStyle = '#fff'; star(c, 0, 10, 9, .4);
  // givre
  if (frost > 0) {
    c.fillStyle = `rgba(255,255,255,${.7 * frost})`;
    for (let i = 0; i < 90; i++) { const x = (R(seed * 91 + i) - .5) * w, y = (R(seed * 57 + i * 3) - .5) * h; const edge = Math.abs(y) / (h / 2); if (R(i + seed) < .35 + .5 * edge) { c.beginPath(); c.arc(x, y, 1.4 + R(i * 5 + seed) * 3.4, 0, 7); c.fill(); } }
    c.fillStyle = `rgba(255,255,255,${.28 * frost})`; c.fillRect(-w / 2, -h / 2, w, 24); c.fillRect(-w / 2, h / 2 - 22, w, 22);
  }
  c.restore();
  // dessus / dessous métal
  c.fillStyle = '#D9DEE6'; c.strokeStyle = C.ink; c.lineWidth = 8;
  rr(c, -w / 2 + 6, -h / 2 - 8, w - 12, 16, 8); c.fill(); c.stroke();
  rr(c, -w / 2 + 6, h / 2 - 8, w - 12, 16, 8); c.fill(); c.stroke();
  c.fillStyle = '#9AA3B2'; rr(c, -14, -h / 2 - 3, 28, 8, 4); c.fill();
  // gouttes de condensation qui glissent
  if (frost > 0) for (let i = 0; i < 9; i++) {
    const x = (R(seed * 13 + i * 7) - .5) * (w - 24), sp = 10 + R(i + seed) * 22;
    const y = ((R(seed + i * 11) * h + t * sp) % (h - 20)) - h / 2 + 6, r = 3 + R(i * 3 + seed) * 4;
    c.fillStyle = 'rgba(210,240,255,.85)'; c.beginPath(); c.ellipse(x, y, r * .8, r * 1.25, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x - r * .25, y - r * .35, r * .3, 0, 7); c.fill();
  }
}
function bottle(c, tint = '#8FD8FF') {
  const body = k => { k.moveTo(-18, -92); k.lineTo(18, -92); k.lineTo(18, -66); k.quadraticCurveTo(46, -48, 46, -14); k.lineTo(46, 78); k.quadraticCurveTo(46, 96, 28, 96); k.lineTo(-28, 96); k.quadraticCurveTo(-46, 96, -46, 78); k.lineTo(-46, -14); k.quadraticCurveTo(-46, -48, -18, -66); k.closePath(); };
  sticker(c, [body], tint, 10);
  sticker(c, [k => k.roundRect(-22, -118, 44, 30, 8)], C.blue, 9);
  c.save(); c.beginPath(); body(c); c.clip();
  c.fillStyle = '#fff'; c.fillRect(-50, -2, 100, 44); c.fillStyle = C.blue; c.beginPath(); c.moveTo(-50, 14); for (let x = -50; x <= 50; x += 5) c.lineTo(x, 14 + Math.sin(x * .15) * 6); c.lineTo(50, 28); c.lineTo(-50, 28); c.fill();
  c.restore(); shine(c, -26, -22, 7, 30, .05, .55);
}
function bag(c, col = C.red) {
  const body = k => { k.moveTo(-60, -90); for (let i = 0; i <= 6; i++) k.lineTo(-60 + i * 20, i % 2 ? -98 : -86); k.lineTo(66, 80); for (let i = 6; i >= 0; i--) k.lineTo(-60 + i * 20 + 6, i % 2 ? 98 : 86); k.closePath(); };
  sticker(c, [body], col, 10);
  c.save(); c.beginPath(); body(c); c.clip();
  c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(-70, -20, 150, 70);
  c.fillStyle = C.yellow; c.beginPath(); c.arc(0, 8, 34, 0, 7); c.fill();
  c.fillStyle = col; c.beginPath(); c.arc(0, 8, 22, 0, 7); c.fill();
  c.fillStyle = '#fff'; star(c, 0, 8, 13, 0.3);
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-48, -90, 14, 190);
  c.restore();
}
function splashShape(c, r, seed, col, spikes = 12) { // éclaboussure
  c.fillStyle = col; c.beginPath();
  for (let i = 0; i < spikes * 2; i++) { const a = i / (spikes * 2) * 6.283, rad = i % 2 ? r * (.55 + R(seed + i) * .15) : r * (.9 + R(seed + i * 3) * .35); c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  c.closePath(); c.fill();
}

/* ---------- le distributeur ---------- */
function machine(c, lit, t) { // dessiné ~ 520×760, origine au centre
  const w = 520, h = 760;
  if (lit > 0) { // halo
    const g = c.createRadialGradient(0, -40, 60, 0, -40, 640);
    g.addColorStop(0, `rgba(255,225,130,${.95 * lit})`); g.addColorStop(.45, `rgba(255,140,70,${.5 * lit})`); g.addColorStop(1, 'rgba(255,122,61,0)');
    c.fillStyle = g; c.fillRect(-700, -700, 1400, 1400);
  }
  // corps
  const bg = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); bg.addColorStop(0, C.orange); bg.addColorStop(1, C.pink);
  c.save(); c.lineJoin = 'round'; c.strokeStyle = C.ink; c.lineWidth = 14;
  c.shadowColor = `rgba(255,190,80,${lit})`; c.shadowBlur = 110 * lit;
  c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 56); c.fillStyle = bg; c.fill(); c.stroke();
  c.shadowBlur = 0; c.shadowColor = 'transparent';
  // fenêtre
  const wx = -w / 2 + 36, wy = -h / 2 + 40, ww = 318, wh = 520;
  c.beginPath(); c.roundRect(wx, wy, ww, wh, 26); c.fillStyle = shade('#241F2E', lit * .12); c.fill();
  c.save(); c.clip();
  const gl = c.createLinearGradient(0, wy, 0, wy + wh);
  gl.addColorStop(0, `rgba(255,${Math.round(lerp(230, 250, lit))},${Math.round(lerp(190, 225, lit))},${.25 + .7 * lit})`); gl.addColorStop(1, `rgba(255,170,90,${.15 + .6 * lit})`);
  c.fillStyle = gl; c.fillRect(wx, wy, ww, wh);
  // rayons
  const rows = 4; const prods = [
    [k => { c.save(); c.translate(0, 0); c.scale(.42, .42); wrapped(c, C.pink, C.yellow); c.restore(); },
      k => { c.save(); c.scale(.4, .4); lolly(c, C.turq, C.yellow); c.restore(); }, k => { c.save(); c.scale(.42, .42); wrapped(c, C.violet, C.turq); c.restore(); }],
    [k => { c.save(); c.scale(.46, .46); bag(c, C.red); c.restore(); }, k => { c.save(); c.scale(.46, .46); bag(c, C.blue); c.restore(); }, k => { c.save(); c.scale(.46, .46); bag(c, C.green); c.restore(); }],
    [k => { c.save(); c.scale(.42, .42); can(c, C.orange, 0); c.restore(); }, k => { c.save(); c.scale(.42, .42); can(c, C.turq, 0, 0, 2); c.restore(); }, k => { c.save(); c.scale(.42, .42); can(c, C.pink, 0, 0, 3); c.restore(); }],
    [k => { c.save(); c.scale(.55, .55); choco(c); c.restore(); }, k => { c.save(); c.scale(.5, .5); cookie(c); c.restore(); }, k => { c.save(); c.scale(.4, .4); bottle(c); c.restore(); }]];
  for (let r = 0; r < rows; r++) {
    const y = wy + 34 + r * 128;
    for (let i = 0; i < 3; i++) {
      c.save(); c.translate(wx + 55 + i * 104, y + 38); c.globalAlpha = .45 + .55 * lit; prods[r][i](); c.restore();
    }
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(wx, y + 82, ww, 7);
    c.fillStyle = C.ink; c.globalAlpha = .55; c.fillRect(wx, y + 89, ww, 4); c.globalAlpha = 1;
  }
  // reflet vitre
  c.globalAlpha = .18 + .2 * lit; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(wx + 40, wy); c.lineTo(wx + 120, wy); c.lineTo(wx + 20, wy + wh); c.lineTo(wx - 60, wy + wh); c.fill(); c.globalAlpha = 1;
  // balayage lumineux
  if (lit > 0) { const sx = wx + ((t * 260) % (ww + 300)) - 150; c.globalAlpha = .35 * lit; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(sx, wy); c.lineTo(sx + 36, wy); c.lineTo(sx - 60, wy + wh); c.lineTo(sx - 96, wy + wh); c.fill(); c.globalAlpha = 1; }
  c.restore();
  c.beginPath(); c.roundRect(wx, wy, ww, wh, 26); c.stroke();
  // panneau latéral
  const px = wx + ww + 22, pw = w / 2 - 36 - px + 0;
  c.beginPath(); c.roundRect(px, wy, w / 2 - 28 - px, 200, 18); c.fillStyle = C.ink; c.fill();
  c.fillStyle = shade(C.turq, -.2 + lit * .3); c.beginPath(); c.roundRect(px + 12, wy + 14, w / 2 - 52 - px, 54, 10); c.fill();
  for (let i = 0; i < 9; i++) { c.fillStyle = (lit > .5 && Math.floor(t * 4 + i) % 5 === 0) ? C.yellow : '#fff'; c.beginPath(); c.arc(px + 22 + (i % 3) * 30, wy + 100 + Math.floor(i / 3) * 32, 8, 0, 7); c.fill(); }
  // lecteur CB
  c.beginPath(); c.roundRect(px, wy + 224, w / 2 - 28 - px, 96, 16); c.fillStyle = shade(C.ink, .1); c.fill();
  c.fillStyle = lit > .3 ? C.yellow : '#888'; c.beginPath(); c.arc(px + 40, wy + 272, 15, 0, 7); c.fill();
  if (lit > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const wg = c.createRadialGradient(wx + ww / 2, wy + wh / 2, 20, wx + ww / 2, wy + wh / 2, 380); wg.addColorStop(0, `rgba(255,205,120,${.38 * lit})`); wg.addColorStop(1, 'rgba(255,150,60,0)'); c.fillStyle = wg; c.fillRect(-w, -h, 2 * w, 2 * h); c.restore(); }
  if (lit < 1) { c.fillStyle = `rgba(18,10,30,${.55 * (1 - lit)})`; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 56); c.fill(); }
  // bac de récupération
  c.beginPath(); c.roundRect(wx, wy + wh + 28, w - 72, 78, 20); c.fillStyle = '#1B1722'; c.fill(); c.stroke();
  c.restore();
}

/* ---------- fonds & motifs ---------- */
function rays(c, cx, cy, lt, col = 'rgba(255,255,255,.14)', n = 14, speed = .25) {
  c.save(); c.translate(cx, cy); c.rotate(lt * speed); c.fillStyle = col; const L = Math.hypot(W, H);
  for (let i = 0; i < n; i++) { const a = i / n * 6.283, b = a + 3.1416 / n; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * L, Math.sin(a) * L); c.lineTo(Math.cos(b) * L, Math.sin(b) * L); c.fill(); }
  c.restore();
}
function dots(c, lt, col = 'rgba(255,255,255,.18)', step = 46) {
  c.fillStyle = col; const off = (lt * 30) % step;
  for (let y = -step; y < H + step; y += step) for (let x = -step; x < W + step; x += step) {
    const xx = x + (Math.round(y / step) % 2 ? step / 2 : 0) + off, d = Math.hypot(xx - W / 2, y - H / 2) / Math.hypot(W / 2, H / 2);
    c.beginPath(); c.arc(xx, y + off * .5, 3 + 9 * d, 0, 7); c.fill();
  }
}
function bg(c, c1, c2, lt, o = {}) {
  const g = c.createRadialGradient(W / 2, H * .45, 40, W / 2, H / 2, Math.hypot(W, H) * .6);
  g.addColorStop(0, c1); g.addColorStop(1, c2); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (o.rays !== false) rays(c, W / 2, H * .45, lt, o.rayCol, o.n || 14, o.speed || .25);
  if (o.dots) dots(c, lt, o.dotCol);
}
function cam(c, lt, z0, z1, dur, rot0 = 0, rot1 = 0, ox = 0, oy = 0) { // mouvement de caméra autour du centre
  const p = clamp(lt / dur); c.translate(W / 2 + ox * p, H / 2 + oy * p); const z = lerp(z0, z1, p); c.scale(z, z); c.rotate(lerp(rot0, rot1, p)); c.translate(-W / 2, -H / 2);
}

/* ---------- texte cinétique ---------- */
function kText(c, str, cx, cy, size, lt, t0, o = {}) {
  const fill = o.fill || '#fff', stag = o.stag ?? .035, maxW = o.maxW || W * .9;
  c.save(); c.font = `800 ${size}px Poppins, sans-serif`;
  let wTot = c.measureText(str).width; if (wTot > maxW) { size *= maxW / wTot; c.font = `800 ${size}px Poppins, sans-serif`; wTot = c.measureText(str).width; }
  c.textBaseline = 'middle'; c.lineJoin = 'round';
  let x = cx - wTot / 2; const tilt = o.tilt || 0;
  c.translate(cx, cy); c.rotate(tilt); c.translate(-cx, -cy);
  const shake = o.shake ? (R(Math.floor(lt * 30)) - .5) * o.shake : 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i], cw = c.measureText(ch).width, p = clamp((lt - t0 - i * stag) / .3);
    if (p > 0 && ch !== ' ') {
      const s = outBack(p), dy = (1 - outCubic(p)) * size * (o.drop ?? .6) + Math.sin(lt * 9 + i) * size * .012;
      c.save(); c.translate(x + cw / 2 + shake, cy + dy); c.rotate((R(i + 3) - .5) * .25 * (1 - p)); c.scale(s, s * (o.sy || 1));
      c.globalAlpha = clamp(p * 3);
      c.strokeStyle = C.ink; c.lineWidth = size * .2;
      if (o.shadow !== false) { c.fillStyle = o.shadowCol || C.ink; c.strokeStyle = o.shadowCol || C.ink; c.fillText(ch, -cw / 2, size * .1); c.strokeText(ch, -cw / 2, size * .1); }
      c.strokeStyle = C.ink; c.strokeText(ch, -cw / 2, 0);
      if (o.grad) { const g = c.createLinearGradient(0, -size / 2, 0, size / 2); g.addColorStop(0, o.grad[0]); g.addColorStop(1, o.grad[1]); c.fillStyle = g; } else c.fillStyle = fill;
      c.fillText(ch, -cw / 2, 0);
      c.restore();
    }
    x += cw;
  }
  c.restore();
}
function banner(c, str, cx, cy, size, lt, t0, col, txt = '#fff', tilt = -.05) { // pastille texte « sticker »
  const p = outBack(clamp((lt - t0) / .35)); if (p <= 0) return;
  c.save(); c.translate(cx, cy); c.rotate(tilt); c.scale(p, p); c.font = `800 ${size}px Poppins, sans-serif`;
  const w = c.measureText(str).width + size * 1.2, h = size * 1.7;
  c.lineJoin = 'round'; c.strokeStyle = C.ink; c.lineWidth = 10; c.fillStyle = C.ink; rr(c, -w / 2 + 6, -h / 2 + 8, w, h, h / 2); c.fill();
  c.fillStyle = col; rr(c, -w / 2, -h / 2, w, h, h / 2); c.fill(); c.stroke();
  c.fillStyle = txt; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillText(str, 0, size * .06); c.restore();
}

/* ---------- particules ---------- */
function burst(c, x, y, lt, t0, n, speed, colors, size = 10, grav = 1400, seed = 0) { // confettis / miettes / gouttes
  const a = lt - t0; if (a < 0 || a > 1.6) return;
  for (let i = 0; i < n; i++) {
    const ang = R(seed + i * 3) * 6.283, sp = speed * (.35 + R(seed + i * 7) * .65);
    const px = x + Math.cos(ang) * sp * a, py = y + Math.sin(ang) * sp * a + .5 * grav * a * a;
    c.save(); c.translate(px, py); c.rotate(a * (R(i + seed) - .5) * 14); c.globalAlpha = clamp(1.6 - a); c.fillStyle = pick(colors, seed + i * 5);
    const s = size * (.6 + R(i * 2 + seed) * .8); c.beginPath(); c.roundRect(-s / 2, -s / 3, s, s * .66, s * .2); c.fill(); c.restore();
  }
}
function ring(c, x, y, lt, t0, col = '#fff', r = 260) {
  const a = (lt - t0) / .5; if (a < 0 || a > 1) return;
  c.save(); c.globalAlpha = 1 - a; c.strokeStyle = col; c.lineWidth = 18 * (1 - a) + 2; c.beginPath(); c.ellipse(x, y, r * outCubic(a), r * .32 * outCubic(a), 0, 0, 7); c.stroke(); c.restore();
}
function sparkles(c, lt, n, seed, area = [0, 0, W, H], col = '#fff') {
  c.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const ph = (lt * (.8 + R(seed + i) * .8) + R(seed + i * 9)) % 1, a = Math.sin(ph * Math.PI);
    star(c, area[0] + R(seed + i * 4) * area[2], area[1] + R(seed + i * 6) * area[3], (14 + R(seed + i * 8) * 26) * a, ph * 2);
  }
}
function mist(c, lt, n, seed, col = '255,255,255') {
  for (let i = 0; i < n; i++) {
    const ph = (lt * .25 + R(seed + i)) % 1, x = R(seed + i * 5) * W + Math.sin(lt + i) * 30, y = H * (1.05 - ph * 1.1), r = 120 + R(seed + i * 2) * 160;
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${.35 * Math.sin(ph * Math.PI)})`); g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

/* ---------- scènes ---------- */
const U = V ? 1.3 : 1;     // échelle des objets
const SC = [];            // {t0, t1, draw, trans}

// 1. « Un petit creux ? »
SC.push({ t0: 0, t1: 2.0, draw(c, lt) {
  c.save(); cam(c, lt, 1, 1.12, 2);
  bg(c, '#FFE066', C.orange, lt, { dots: true, dotCol: 'rgba(255,255,255,.22)', rayCol: 'rgba(255,255,255,.2)' });
  // bonbon qui fonce vers la caméra puis rebondit
  const p = outCubic(prog(lt, 0, .55)), s = lerp(.2, V ? 1.55 : 1.9, p) * (1 + .06 * Math.sin(lt * 14));
  c.save(); c.translate(W / 2 + Math.sin(lt * 3) * 18, H * (V ? .68 : .66) - Math.abs(Math.sin(lt * 5.2)) * 40 * p); c.rotate(-.35 + lt * .9 * (1 - p * .6)); c.scale(s * U, s * U);
  c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 40; c.shadowOffsetY = 24; wrapped(c, C.pink, C.yellow); c.restore();
  // minis qui orbitent
  for (let i = 0; i < 5; i++) {
    const a = lt * 2 + i * 1.26, rx = W * (V ? .4 : .36), ry = H * (V ? .12 : .22), q = clamp(prog(lt, .1 + i * .08, .5 + i * .08));
    c.save(); c.translate(W / 2 + Math.cos(a) * rx * q, H * (V ? .68 : .66) + Math.sin(a) * ry * q); c.scale(.5 * U * q, .5 * U * q); c.rotate(a);
    [() => dragee(c, C.turq), () => gummy(c, C.green), () => dragee(c, C.violet), () => gummy(c, C.red), () => dragee(c, C.blue)][i](); c.restore();
  }
  c.fillStyle = '#fff'; sparkles(c, lt, 12, 4);
  const sz = V ? 190 : 230;
  kText(c, 'UN PETIT', W / 2, H * (V ? .2 : .2), sz * .82, lt, .25, { tilt: -.05, fill: '#fff' });
  kText(c, 'CREUX ?', W / 2, H * (V ? .31 : .36), sz, lt, .55, { tilt: -.05, fill: C.pink, shake: lt > 1 ? 6 : 0, grad: ['#FF8FA3', C.pink] });
  c.restore();
}});

// 2a. SUCRÉ
SC.push({ t0: 2.0, t1: 2.9, draw(c, lt) {
  c.save(); cam(c, lt, 1.0, 1.12, .9, .03, -.02);
  bg(c, '#FF7C95', '#D62D58', lt, { dots: true, rayCol: 'rgba(255,255,255,.16)' });
  // pluie de bonbons qui rebondissent
  const fl = H * (V ? .8 : .86);
  for (let i = 0; i < 12; i++) {
    const x = W * (.08 + R(i * 2) * .84), t0 = R(i + 9) * .35, y = bounceY(lt - t0, -150, fl - R(i) * 60, 9000, .5);
    c.save(); c.translate(x, y); c.rotate((lt - t0) * (R(i) - .5) * 9); c.scale(1.0 * U, 1.0 * U);
    [() => dragee(c, pick([C.yellow, C.turq, C.violet, C.green], i)), () => gummy(c, pick([C.yellow, C.green, C.orange], i)), () => wrapped(c, pick([C.turq, C.violet, C.blue], i), '#fff')][i % 3](); c.restore();
  }
  // sucette star
  const p = outBack(prog(lt, .05, .5));
  c.save(); c.translate(W / 2, H * (V ? .5 : .47)); c.rotate(-.25 + Math.sin(lt * 6) * .05); c.scale(2.7 * p * U, 2.7 * p * U); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 40; c.shadowOffsetY = 20; lolly(c, C.yellow, C.orange, lt * 4); c.restore();
  burst(c, W / 2, H * .5, lt, .3, 26, 900, [C.yellow, '#fff', C.turq, C.orange], 16, 1200, 3);
  kText(c, 'SUCRÉ', W / 2, H * (V ? .18 : .2), V ? 210 : 270, lt, .12, { fill: '#fff', tilt: .04, maxW: W * .86 });
  c.restore();
}});

// 2b. FRAIS
SC.push({ t0: 2.9, t1: 3.6, draw(c, lt) {
  c.save(); cam(c, lt, 1.0, 1.16, .7, 0, .02);
  bg(c, '#6FE0FF', '#0A86C8', lt, { rayCol: 'rgba(255,255,255,.18)', n: 12 });
  c.fillStyle = 'rgba(255,255,255,.55)';
  for (let i = 0; i < 16; i++) { star(c, R(i) * W, ((R(i + 5) * H + lt * (40 + R(i) * 60)) % H), 12 + R(i + 2) * 22, lt * (R(i) - .5)); }
  const p = outBack(prog(lt, 0, .35));
  c.save(); c.translate(W / 2, H * (V ? .5 : .5)); c.rotate(.12 - lt * .1); c.scale(3.5 * p * U, 3.5 * p * U); c.shadowColor = 'rgba(0,40,80,.4)'; c.shadowBlur = 50; c.shadowOffsetY = 26; can(c, C.orange, 1, lt, 4); c.restore();
  mist(c, lt + 2, 5, 11);
  burst(c, W / 2, H * .5, lt, .05, 22, 700, ['#fff', '#CFF3FF', '#8FE3FF'], 14, 900, 8);
  kText(c, 'FRAIS', W / 2, H * (V ? .17 : .2), V ? 230 : 290, lt, .05, { fill: '#fff', tilt: -.04, grad: ['#FFFFFF', '#BFEFFF'] });
  c.restore();
}});

// 2c. CROQUANT
SC.push({ t0: 3.6, t1: 4.5, draw(c, lt) {
  c.save(); cam(c, lt, 1.12, 1.0, .9, -.03, 0);
  bg(c, '#FFB35A', '#E8541D', lt, { dots: true, dotCol: 'rgba(255,255,255,.16)', rayCol: 'rgba(255,255,255,.2)' });
  // choc : les chips éclatent vers l'écran
  const items = [(a) => chip(c, a), (a) => cookie(c), (a) => chip(c, a + 1), (a) => choco(c), (a) => chip(c, -a), (a) => cookie(c), (a) => chip(c, a * .5)];
  for (let i = 0; i < items.length; i++) {
    const a = i / items.length * 6.283 + .4, p = outCubic(prog(lt, .0, .55)), dist = (V ? 330 : 520) * p * (.7 + R(i) * .5);
    c.save(); c.translate(W / 2 + Math.cos(a) * dist * (V ? .85 : 1.35), H * (V ? .52 : .52) + Math.sin(a) * dist * (V ? 1.2 : .7)); c.rotate(lt * (R(i) - .5) * 8 + a);
    const sc = (1.5 + R(i + 3) * .6) * U * p; c.scale(sc, sc); c.shadowColor = 'rgba(0,0,0,.28)'; c.shadowBlur = 26; c.shadowOffsetY = 16; items[i](lt); c.restore();
  }
  burst(c, W / 2, H * .5, lt, .12, 40, 1100, ['#E0A25A', C.brown, '#FFC83C', '#fff'], 13, 1500, 21);
  const pop = outElastic(prog(lt, .1, .6)); c.save(); c.translate(W / 2, H * (V ? .5 : .52)); c.rotate(-.1); c.scale(pop, pop); c.fillStyle = C.ink; splashShape(c, (V ? 250 : 300), 5, C.ink, 11); c.translate(-8, -8); splashShape(c, (V ? 240 : 290), 5, C.yellow, 11); c.restore();
  c.save(); c.translate(W / 2, H * (V ? .5 : .52)); c.rotate(-.1); c.scale(pop, pop); c.font = `800 ${V ? 120 : 140}px Poppins`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = C.red; c.strokeStyle = C.ink; c.lineWidth = 16; c.lineJoin = 'round'; c.strokeText('CRAC !', 0, 8); c.fillText('CRAC !', 0, 8); c.restore();
  kText(c, 'CROQUANT', W / 2, H * (V ? .15 : .15), V ? 190 : 250, lt, .1, { fill: '#fff', tilt: .03, shake: lt < .6 ? 8 : 0, maxW: W * .9 });
  c.restore();
}});

// 3. Le distributeur — présentation
SC.push({ t0: 4.5, t1: 8.0, draw(c, lt) {
  c.save(); cam(c, lt, 1.0, 1.06, 3.5);
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#3A1B5E'); g.addColorStop(1, '#14101D'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  rays(c, W * (V ? .5 : .72), H * (V ? .56 : .5), lt, 'rgba(255,122,61,.1)', 12, .15);
  // néons d'ambiance
  const gl = c.createRadialGradient(W * (V ? .5 : .72), H * (V ? .56 : .5), 0, W * (V ? .5 : .72), H * (V ? .56 : .5), 700); gl.addColorStop(0, 'rgba(255,77,109,.55)'); gl.addColorStop(1, 'rgba(255,77,109,0)'); c.fillStyle = gl; c.fillRect(0, 0, W, H);
  // machine entre par le bas, allumée à moitié (lueur chaude qui monte)
  const p = outBack(prog(lt, .1, .75)), lit = .25 + .2 * prog(lt, 1.5, 3.4);
  c.save(); c.translate(W * (V ? .5 : .72), H * (V ? .56 : .46) + (1 - p) * 900); c.rotate((1 - p) * .12); const ms = (V ? .95 : .9); c.scale(ms, ms); machine(c, lit, lt); c.restore();
  const tx = V ? W / 2 : W * .3;
  kText(c, 'FRIANDEASY', tx, H * (V ? .12 : .3), V ? 150 : 190, lt, .15, { grad: ['#FFFFFF', C.peach], maxW: W * (V ? .92 : .5), stag: .05, tilt: -.04 });
  banner(c, 'vos distributeurs gourmands', tx, H * (V ? .19 : .52), V ? 46 : 58, lt, 1.5, C.pink, '#fff', -.04);
  banner(c, 'à Lyon', tx, H * (V ? .255 : .66), V ? 56 : 72, lt, 2.3, C.turq, C.ink, .03);
  c.fillStyle = C.yellow; sparkles(c, lt, 10, 33, [0, 0, W, H], C.yellow);
  c.restore();
}});

// 4a. SNACKS
SC.push({ t0: 8.0, t1: 8.7, draw(c, lt) {
  c.save(); cam(c, lt, 1.0, 1.14, .7, .02, -.02);
  bg(c, '#FFF08A', '#F2A900', lt, { dots: true, dotCol: 'rgba(255,255,255,.3)', rayCol: 'rgba(255,255,255,.28)' });
  const fl = H * .72;
  const its = [() => bag(c, C.red), () => cookie(c), () => choco(c), () => chip(c, .3), () => bag(c, C.blue)];
  const xs = V ? [.3, .72, .5, .2, .78] : [.2, .38, .55, .72, .86], ys = V ? [.52, .6, .72, .74, .86] : [.0, .0, .0, .0, .0];
  for (let i = 0; i < its.length; i++) {
    const y0 = V ? ys[i] * H : fl, y = bounceY(lt - i * .05, -250, y0, 9000, .4);
    c.save(); c.translate(W * xs[i], y - (V ? 0 : (i % 2 ? 50 : 0))); c.rotate(Math.sin(lt * 8 + i) * .08); const s = (V ? 1.4 : 1.7) * U; c.scale(s, s); c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 24; c.shadowOffsetY = 18; its[i](); c.restore();
  }
  burst(c, W * .5, fl, lt, .25, 30, 800, ['#FFC83C', '#E0A25A', C.red, '#fff'], 13, 1500, 5);
  kText(c, 'SNACKS', W / 2, H * (V ? .15 : .2), V ? 210 : 280, lt, .05, { fill: '#fff', tilt: -.03 });
  c.restore();
}});

// 4b. BOISSONS
SC.push({ t0: 8.7, t1: 9.5, draw(c, lt) {
  c.save(); cam(c, lt, 1.14, 1.0, .8, .0, -.02);
  bg(c, '#7CF2E3', '#0E9DA6', lt, { rayCol: 'rgba(255,255,255,.2)', n: 16 });
  const cols = [C.orange, C.pink, C.blue, C.yellow, C.violet];
  const n = V ? 3 : 5;
  for (let i = 0; i < n; i++) {
    const p = outBack(prog(lt, i * .05, .35 + i * .05)), x = W * (V ? [.25, .5, .75][i] : .14 + i * .18), y = H * (V ? .55 + (i % 2) * .09 : .56 + (i % 2) * .05);
    c.save(); c.translate(x, y + (1 - p) * 700); c.rotate((i - 2) * .06 + Math.sin(lt * 3 + i) * .02); const s = (V ? 1.7 : 2.15) * U; c.scale(s, s); c.shadowColor = 'rgba(0,50,60,.4)'; c.shadowBlur = 40; c.shadowOffsetY = 24;
    can(c, cols[i], 1, lt, i + 7); c.restore();
  }
  mist(c, lt, 6, 3);
  kText(c, 'BOISSONS', W / 2, H * (V ? .15 : .17), V ? 190 : 240, lt, .05, { fill: '#fff', tilt: .03, maxW: W * .9 });
  c.restore();
}});

// 4c. L'ESSENTIEL
SC.push({ t0: 9.5, t1: 10.9, draw(c, lt) {
  c.save(); cam(c, lt, 1.0, 1.1, 1.4, -.02, .02);
  bg(c, '#FF9DB1', '#D6305A', lt, { dots: true, rayCol: 'rgba(255,255,255,.18)' });
  const p = outBack(prog(lt, .0, .5));
  c.save(); c.translate(W * (V ? .32 : .36), H * (V ? .56 : .56) + (1 - p) * 600); c.rotate(-.1 + Math.sin(lt * 3) * .03); const s = (V ? 2.3 : 2.9) * U; c.scale(s, s); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 40; c.shadowOffsetY = 22; bottle(c); c.restore();
  const p2 = outBack(prog(lt, .12, .6));
  c.save(); c.translate(W * (V ? .7 : .62), H * (V ? .64 : .62) + (1 - p2) * 600); c.rotate(.14); const s2 = (V ? 1.4 : 1.8) * U; c.scale(s2, s2); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 30; c.shadowOffsetY = 18; cookie(c); c.restore();
  const p3 = outBack(prog(lt, .2, .7));
  c.save(); c.translate(W * (V ? .72 : .84), H * (V ? .48 : .45) + (1 - p3) * 600); c.rotate(-.2); const s3 = (V ? 1.4 : 1.8) * U; c.scale(s3, s3); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 30; c.shadowOffsetY = 18; wrapped(c, C.yellow, C.orange); c.restore();
  sparkles(c, lt, 10, 17);
  kText(c, "L'ESSENTIEL", W / 2, H * (V ? .15 : .17), V ? 190 : 250, lt, .1, { fill: '#fff', tilt: -.03, maxW: W * .92, stag: .04 });
  banner(c, 'quand on en a besoin', W / 2, H * (V ? .26 : .3), V ? 46 : 58, lt, .7, C.ink, '#fff', .02);
  c.restore();
}});

// 5. Pluie de bonbons + MIAM
SC.push({ t0: 10.9, t1: 13.0, draw(c, lt) {
  c.save(); cam(c, lt, 1.0, 1.18, 2.1, .02, -.03);
  bg(c, '#FFD23F', '#FF4D6D', lt, { dots: true, dotCol: 'rgba(255,255,255,.2)', rayCol: 'rgba(255,255,255,.22)', n: 18, speed: .4 });
  const fl = H * .88;
  for (let i = 0; i < 26; i++) {
    const x = W * (.05 + R(i * 2) * .9), t0 = R(i + 4) * .9 - .35, y = bounceY(lt - t0, -200, fl - R(i + 8) * (V ? 700 : 260), 3600, .6);
    const kind = i % 4; c.save(); c.translate(x, y); c.rotate((lt - t0) * (R(i) - .5) * 8); const s = (.85 + R(i + 6) * .6) * U * (V ? 1.1 : 1); c.scale(s, s);
    c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 18; c.shadowOffsetY = 12;
    [() => dragee(c, pick(PALETTE, i)), () => gummy(c, pick(PALETTE, i + 2)), () => wrapped(c, pick(PALETTE, i), pick(PALETTE, i + 3)), () => lolly(c, pick(PALETTE, i), '#fff', lt * 3)][kind](); c.restore();
    const tl = lt - t0; if (tl > 0 && tl < 1.9) { // éclaboussures à chaque impact
      const hit = Math.sqrt(2 * (fl - R(i + 8) * (V ? 700 : 260) + 200) / 3600);
      ring(c, x, fl - R(i + 8) * (V ? 700 : 260) + 50, lt, t0 + hit, '#fff', 150);
    }
  }
  const p = outElastic(prog(lt, .35, 1.0));
  c.save(); c.translate(W / 2, H * (V ? .3 : .38)); c.rotate(-.07); c.scale(p, p); c.font = `800 ${V ? 250 : 420}px Poppins`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.fillStyle = C.ink; c.strokeStyle = C.ink; c.lineWidth = 60; c.strokeText('MIAM !', 0, 26); c.fillText('MIAM !', 0, 26);
  c.lineWidth = 60; c.strokeText('MIAM !', 0, 0);
  const g = c.createLinearGradient(0, -150, 0, 150); g.addColorStop(0, '#fff'); g.addColorStop(1, C.peach); c.fillStyle = g; c.fillText('MIAM !', 0, 0); c.restore();
  // montée en tension avant l'impact
  const pre = prog(lt, 1.6, 2.1); if (pre > 0) { c.fillStyle = `rgba(255,255,255,${pre * .6})`; c.fillRect(0, 0, W, H); }
  c.restore();
}});

// 6. Final : le distributeur s'illumine + logo
SC.push({ t0: 13.0, t1: DURATION, draw(c, lt) {
  const g = c.createRadialGradient(W / 2, H * .45, 40, W / 2, H / 2, Math.hypot(W, H) * .7);
  const litP = outCubic(prog(lt, .15, 1.1));
  g.addColorStop(0, `rgb(${Math.round(lerp(60, 120, litP))},${Math.round(lerp(30, 50, litP))},${Math.round(lerp(70, 90, litP))})`); g.addColorStop(1, '#14101D'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  rays(c, W / 2, H * (V ? .38 : .5), lt, `rgba(255,190,90,${.05 + .12 * litP})`, 16, .12);
  const flick = lt < 1.1 ? (Math.floor(lt * 22) % 3 === 0 ? .55 : 1) : 1;      // allumage par à-coups
  const lit = litP * flick;
  const mx = V ? W / 2 : W * .28, my = V ? H * .25 : H * .47, ms = V ? 1.0 : 1.02;
  c.save(); c.translate(mx, my + Math.sin(lt * 1.5) * 6); const pp = outBack(prog(lt, 0, .6)); c.scale(ms * (.9 + .1 * pp), ms * (.9 + .1 * pp)); machine(c, lit, lt);
  // produit qui tombe dans le bac
  const dt = lt - 1.0; if (dt > 0 && dt < 1.3) { const y = bounceY(dt, 300, 430, 2200, .35); c.save(); c.translate(-20, y); c.scale(.55, .55); c.rotate(dt * 3); wrapped(c, C.pink, C.yellow); c.restore(); }
  c.restore();
  // confettis gourmands qui retombent
  for (let i = 0; i < 18; i++) {
    const ph = (lt * .35 + R(i)) % 1, x = W * R(i * 3 + 1) + Math.sin(lt * 2 + i) * 30, y = -120 + ph * (H + 240);
    c.save(); c.translate(x, y); c.rotate(lt * (R(i) - .5) * 4 + i); const s = .28 + R(i + 5) * .25; c.scale(s * U, s * U); c.globalAlpha = .9 * clamp(lt - .3);
    [() => dragee(c, pick(PALETTE, i)), () => wrapped(c, pick(PALETTE, i), '#fff'), () => gummy(c, pick(PALETTE, i + 1))][i % 3](); c.restore();
  }
  sparkles(c, lt, 14, 77, [0, 0, W, H], '#FFE9A8');
  // bloc logo
  const tx = V ? W / 2 : W * .7, ty = V ? H * .585 : H * .36;
  const lp = outBack(prog(lt, .5, 1.0));
  c.save(); c.translate(tx, ty); c.scale(lp, lp);
  const ic = icon; if (ic && ic.complete) { const s = V ? 150 : 170; c.drawImage(ic, -s / 2, -s - (V ? 70 : 78), s, s); }
  c.restore();
  kText(c, 'Friandeasy', tx, ty + (V ? 20 : 20), V ? 150 : 180, lt, .6, { fill: '#fff', maxW: W * (V ? .9 : .5), stag: .04, grad: ['#FFFFFF', C.peach] });
  const tagP = lt - 1.5;
  kText(c, 'Craque pour le plaisir.', tx, ty + (V ? 140 : 150), V ? 62 : 76, lt, 1.45, { fill: C.yellow, maxW: W * (V ? .92 : .52), stag: .02, grad: [C.yellow, C.orange], shadow: true });
  banner(c, 'friandeasy.fr', tx, ty + (V ? 290 : 300), V ? 70 : 84, lt, 2.4, C.pink, '#fff', -.03);
  // pulsation du bouton
  const pulse = lt > 2.8 ? Math.sin((lt - 2.8) * 4) * .5 + .5 : 0;
  if (pulse > 0) { c.save(); c.globalAlpha = .25 * pulse; c.strokeStyle = '#fff'; c.lineWidth = 8; c.font = `800 ${V ? 70 : 84}px Poppins`; const w = c.measureText('friandeasy.fr').width + (V ? 70 : 84) * 1.2, h = (V ? 70 : 84) * 1.7; c.translate(tx, ty + (V ? 290 : 300)); c.rotate(-.03); const e = 14 + pulse * 22; rr(c, -w / 2 - e, -h / 2 - e, w + e * 2, h + e * 2, h / 2 + e); c.stroke(); c.restore(); }
}});

/* ---------- transitions entre plans ---------- */
const TR = [null, 'wipe', 'zoom', 'glitch', 'iris', 'wipe', 'zoom', 'glitch', 'wipe', 'flash'];
const TD = .3;
function sceneAt(t) { for (let i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }

function drawScene(i, t) { const s = SC[i]; ctx.save(); s.draw(ctx, t - s.t0); ctx.restore(); }

function frame(t) {
  t = clamp(t, 0, DURATION - 1e-4);
  const i = sceneAt(t), s = SC[i], lt = t - s.t0, kind = TR[i];
  if (kind && lt < TD) {
    const p = lt / TD;
    drawScene(i - 1, t); // plan sortant, poursuit son animation
    ctx.save();
    if (kind === 'wipe') { // balayage diagonal avec liseré blanc
      const off = (1 - inOut(p)) * (W + H * .6) - H * .6, sk = H * .6;
      ctx.beginPath(); ctx.moveTo(W - off + sk, 0); ctx.lineTo(0, 0); ctx.lineTo(0, H); ctx.lineTo(W - off, H); ctx.closePath();
      // le nouveau plan occupe la zone qui grandit depuis la gauche
      ctx.restore(); ctx.save();
      const edge = inOut(p) * (W + H * .6);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(edge, 0); ctx.lineTo(edge - H * .6, H); ctx.lineTo(0, H); ctx.closePath(); ctx.clip();
      drawScene(i, t); ctx.restore();
      ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(edge, 0); ctx.lineTo(edge + 36, 0); ctx.lineTo(edge + 36 - H * .6, H); ctx.lineTo(edge - H * .6, H); ctx.closePath(); ctx.fill(); ctx.restore();
    } else if (kind === 'iris') {
      ctx.beginPath(); ctx.arc(W / 2, H / 2, outCubic(p) * Math.hypot(W, H) * .56, 0, 7); ctx.clip(); drawScene(i, t); ctx.restore();
      ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 16 * (1 - p); ctx.beginPath(); ctx.arc(W / 2, H / 2, outCubic(p) * Math.hypot(W, H) * .56, 0, 7); ctx.stroke(); ctx.restore();
    } else if (kind === 'zoom') { // le nouveau plan « claque » depuis l'avant
      ctx.restore(); ctx.save(); const z = lerp(1.7, 1, outCubic(p)); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.rotate((1 - p) * .06); ctx.translate(-W / 2, -H / 2); ctx.globalAlpha = clamp(p * 3); drawScene(i, t); ctx.restore();
    } else if (kind === 'glitch') {
      ctx.restore(); ctx.save(); ctx.globalAlpha = 1; drawScene(i, t); ctx.restore();
      if (p < .8) { // quelques bandes décalées + canaux RVB écartés
        sctx.clearRect(0, 0, W, H); sctx.drawImage(cv, 0, 0);
        const n = 7;
        for (let k = 0; k < n; k++) {
          const y = R(k * 5 + Math.floor(lt * 40)) * H, hh = H * (.03 + R(k + 2) * .09), dx = (R(k * 9 + Math.floor(lt * 40)) - .5) * W * .16 * (1 - p);
          ctx.drawImage(snap, 0, y, W, hh, dx, y, W, hh);
        }
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .5 * (1 - p); ctx.drawImage(snap, 10 * (1 - p), 0); ctx.restore();
      }
    } else if (kind === 'flash') {
      ctx.restore(); ctx.save(); drawScene(i, t); ctx.fillStyle = `rgba(255,255,255,${1 - p})`; ctx.fillRect(0, 0, W, H); ctx.restore();
    } else ctx.restore();
  } else drawScene(i, t);
  drawSubs(t);
}

/* ---------- sous-titres incrustés (voix off) ---------- */
const SUBS = [[.3, 1.35, 'Un petit creux ?'], [2.0, 4.1, 'Une envie de sucré, de frais, de croquant ?'], [4.6, 7.6, 'Friandeasy, vos distributeurs gourmands à Lyon.'],
  [8.1, 10.95, 'Snacks, boissons, et l’essentiel quand on en a besoin.'], [13.4, 15.7, 'Friandeasy. Craque pour le plaisir.']];
function wrap(c, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
  lines.push(cur); return lines;
}
function drawSubs(t) {
  const s = SUBS.find(x => t >= x[0] && t <= x[1]); if (!s) return;
  const a = Math.min(clamp((t - s[0]) / .12), clamp((s[1] - t) / .12));
  const size = V ? 52 : 52; ctx.save(); ctx.font = `800 ${size}px Poppins, sans-serif`;
  const lines = wrap(ctx, s[2], W * (V ? .84 : .82)), lh = size * 1.3, bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 70, bh = lines.length * lh + 36;
  const cx = W / 2, cy = V ? H * .79 : H - 96 - (lines.length - 1) * lh / 2;
  ctx.globalAlpha = a; ctx.translate(cx, cy + (1 - a) * 14);
  ctx.fillStyle = 'rgba(20,16,29,.82)'; rr(ctx, -bw / 2, -bh / 2, bw, bh, 28); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, k) => ctx.fillText(l, 0, (k - (lines.length - 1) / 2) * lh + 3));
  ctx.restore();
}

/* ---------- chargement & API ---------- */
const icon = new Image(); icon.src = '../assets/favicon.svg';
window.DURATION = DURATION; window.FPS = 30;
window.ready = Promise.all([document.fonts.load('800 60px Poppins'), new Promise(r => { icon.onload = r; icon.onerror = r; })]).then(() => { window.renderFrame = frame; return true; });
// aperçu interactif : ?play=1 lit l'animation en boucle dans le navigateur (sans audio)
if (Q.get('play')) window.ready.then(() => { const t0 = performance.now(); (function loop() { frame(((performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(loop); })(); });
})();
