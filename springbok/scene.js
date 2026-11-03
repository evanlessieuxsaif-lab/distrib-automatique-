'use strict';
/* Springbok – teaser 30 s, motion design 2D flat, 100 % code (Canvas 2D).
   scene.html?fmt=h -> 1920×1080   |   scene.html?fmt=v -> 1080×1920   |   &play=1 : aperçu animé
   window.seek(t) dessine l'image à l'instant t (s). window.CUES = repères des effets sonores. */

// ===================== TEXTES (à modifier ici, 6 mots max par texte) =====================
const T = {
  s1: ["Tu as trouvé", "l'objet parfait…"],
  annonce: 'Annonce', objet: 'Appareil photo', prix: '45 €', lieu: 'Lyon 7e · à 2 km', acheter: 'Acheter',
  s2: ['…mais il arrive', 'dans une semaine ?'],
  livraison: 'Livraison', choisis: 'Choisis ton option', relais: 'Point relais', relaisDelai: '3 à 7 jours',
  s3: ['Nouvelle option :', 'Springbok.'],
  sb: 'Springbok', sbDelai: 'livré en moins de 2 h', sbPrix: '≈ 5 €, dès le panier', valider: 'Valider',
  vendeurTag: 'Côté vendeur', s4: ['Le vendeur', 'confirme.'],
  heure: '14:12', jour: 'mardi 3 novembre', notifApp: 'Springbok',
  notif1: 'Colis à remettre', notif2: "aujourd'hui", confirmer: 'Je confirme', confirme: 'Confirmé',
  lyon: 'Lyon', vendeur: 'Vendeur', acheteur: 'Toi', saone: 'Saône', rhone: 'Rhône',
  photo: 'photo au retrait', code: 'code à la remise',
  s6: ['Livré.', 'Avant ce soir.'],
  mots: ['RAPIDE', 'ABORDABLE', 'FIABLE'], legendes: ['moins de 2 h', '≈ 5 €, prix affiché', 'suivi en direct'],
  nom: 'Springbok', base: ["Ton achat d'occasion,", 'livré en moins de 2 h'], bientot: 'Bientôt à Lyon',
};

// ===================== PALETTE (stricte) =====================
const P = { cream: '#FBF5E9', cream2: '#F3E4CF', orange: '#EA763B', rust: '#C3420B', brick: '#9B3413', dark: '#3D1C10', beige: '#E7D3BC' };

// ===================== FORMAT =====================
const Q = new URLSearchParams(location.search);
const V = Q.get('fmt') === 'v';
const W = V ? 1080 : 1920, H = V ? 1920 : 1080;
const FPS = 30, DURATION = 30;
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');

// ===================== OUTILS =====================
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const pr = (t, a, b) => cl((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const E = {
  out: x => 1 - Math.pow(1 - x, 3),
  inOut: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  back: x => { const c = 1.9; return x <= 0 ? 0 : x >= 1 ? 1 : 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
  in: x => x * x * x,
};
const FT = s => `bold ${s}px "Arial Black", "Liberation Sans", Arial, sans-serif`;   // titres
const FB = s => `bold ${s}px Carlito, Calibri, sans-serif`;                            // texte courant
let BOXES = [], CLIP = null;   // CLIP : zone visible courante (px écran) pour le contrôle   // boîtes des textes de l'image courante (contrôle de chevauchement)

function txt(s, x, y, size, o = {}) {
  ctx.save();
  ctx.font = o.body ? FB(size) : FT(size);
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha *= (o.alpha ?? 1);
  ctx.fillStyle = o.color || P.dark;
  ctx.fillText(s, x, y);
  const m = ctx.measureText(s), w = m.width;
  const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  const tr = ctx.getTransform(), pts = [[x0, y - m.actualBoundingBoxAscent], [x0 + w, y + m.actualBoundingBoxDescent]].map(([a, b]) => [tr.a * a + tr.c * b + tr.e, tr.b * a + tr.d * b + tr.f]);
  let b = { s, x0: Math.min(pts[0][0], pts[1][0]), y0: Math.min(pts[0][1], pts[1][1]), x1: Math.max(pts[0][0], pts[1][0]), y1: Math.max(pts[0][1], pts[1][1]), a: ctx.globalAlpha };
  if (CLIP) b = { ...b, x0: Math.max(b.x0, CLIP[0]), y0: Math.max(b.y0, CLIP[1]), x1: Math.min(b.x1, CLIP[2]), y1: Math.min(b.y1, CLIP[3]) };
  if (ctx.globalAlpha > 0.02 && b.x1 > b.x0 && b.y1 > b.y0) BOXES.push(b);
  ctx.restore();
  return w;
}
function measure(s, size, body) { ctx.save(); ctx.font = body ? FB(size) : FT(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
function fit(lines, size, maxW, body) { const w = Math.max(...lines.map(l => measure(l, size, body))); return w > maxW ? Math.floor(size * maxW / w) : size; }
function rr(x, y, w, h, r, fill, stroke, lw) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw || 4; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function circ(x, y, r, fill, stroke, lw) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw || 4; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function poly(pts, fill) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
function line(pts, color, lw, dash) {
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = color;
  ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
}
function check(x, y, s, color, lw) { line([[x - s * .5, y], [x - s * .12, y + s * .38], [x + s * .55, y - s * .42]], color, lw || s * .22); }
function withT(x, y, s, fn, rot = 0) { ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(s, s); fn(); ctx.restore(); }

// ===================== ÉLÉMENTS GRAPHIQUES =====================
// Logo : carton isométrique + cornes de springbok. s = demi-largeur (px), g = pousse des cornes 0..1, k = écrasement (rebond)
function logo(cx, cy, s, g = 1, k = 0) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(0, 0.275);
  ctx.translate(0, 1.2); ctx.scale(1 + k * .45, 1 - k); ctx.translate(0, -1.2);
  if (g > 0) for (const d of [-1, 1]) {          // cornes (derrière le carton)
    ctx.save(); ctx.translate(d * .27, -.88); ctx.scale(g, g); ctx.translate(-d * .27, .88);
    ctx.beginPath(); ctx.moveTo(d * .34, -.86);
    ctx.bezierCurveTo(d * .56, -1.15, d * .44, -1.66, d * .1, -1.76);
    ctx.bezierCurveTo(d * .33, -1.6, d * .4, -1.2, d * .2, -.9);
    ctx.closePath(); ctx.fillStyle = P.dark; ctx.fill(); ctx.restore();
  }
  for (const d of [-1, 1]) {                       // rabats
    ctx.beginPath(); ctx.moveTo(d * 1.0, -.62); ctx.quadraticCurveTo(d * .78, -.86, d * .46, -.82); ctx.lineTo(d * .62, -.66); ctx.closePath();
    ctx.fillStyle = P.brick; ctx.fill();
  }
  poly([[-1, -.5], [0, 0], [0, 1.2], [-1, .7]], P.rust);      // face gauche
  poly([[0, 0], [1, -.5], [1, .7], [0, 1.2]], P.brick);       // face droite
  poly([[0, -1], [1, -.5], [0, 0], [-1, -.5]], P.orange);     // dessus
  const Lp = [-1, -.5], Tp = [0, -1], Fp = [0, 0], Rp = [1, -.5], m = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  poly([m(Lp, Tp, .38), m(Lp, Tp, .56), m(Fp, Rp, .56), m(Fp, Rp, .38)], P.cream2);  // scotch
  ctx.restore();
}

// Personnage géométrique. Origine aux pieds. o: {arms:'up'|'hold'|'down', helmet, pack, hop, head}
function person(x, y, s, body, o = {}) {
  ctx.save(); ctx.translate(x, y - (o.hop || 0)); ctx.scale(s * (o.flip ? -1 : 1), s);
  rr(-27, -62, 22, 62, 11, P.dark); rr(5, -62, 22, 62, 11, P.dark);
  if (o.pack) { ctx.save(); ctx.translate(-48, -112); logo(0, 0, 30, 1); ctx.restore(); }
  rr(-40, -152, 80, 104, 36, body);
  const arm = (ax, ay, bx, by) => line([[ax, ay], [bx, by]], body, 20);
  if (o.arms === 'up') { arm(-30, -138, -62, -196); arm(30, -138, 62, -196); }
  else if (o.arms === 'hold') { arm(-30, -132, 10, -102); arm(30, -132, 52, -100); }
  else { arm(-34, -136, -50, -80); arm(34, -136, 50, -80); }
  circ(0, -184, 28, o.head || P.dark);
  if (o.helmet) { ctx.beginPath(); ctx.arc(0, -188, 31, Math.PI, 0); ctx.closePath(); ctx.fillStyle = P.rust; ctx.fill(); rr(-4, -192, 44, 10, 5, P.rust); }
  ctx.restore();
}

// Livreur à vélo (vue de profil). Origine au sol, entre les roues. dir = 1 vers la droite
function courier(x, y, s, ph, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  const RW = [-52, -34], FW = [52, -34], CR = [0, -32], SE = [-16, -80], HB = [44, -94], TT = [36, -76];
  for (const w of [RW, FW]) { circ(w[0], w[1], 31, null, P.dark, 8); circ(w[0], w[1], 5, P.dark); }
  const pd = a => [CR[0] + 15 * Math.cos(a), CR[1] + 15 * Math.sin(a)];
  const leg = (a, col) => {                         // jambe (IK 2 segments)
    const hip = [-14, -92], p = pd(a), dx = p[0] - hip[0], dy = p[1] - hip[1], d = Math.min(Math.hypot(dx, dy), 66);
    const ang = Math.atan2(dy, dx), k = Math.acos(cl(d / 66, -1, 1)), knee = [hip[0] + 33 * Math.cos(ang - k), hip[1] + 33 * Math.sin(ang - k)];
    line([hip, knee, p], col, 13);
  };
  leg(ph + Math.PI, P.brick);
  line([RW, CR, SE, RW], P.rust, 7); line([SE, TT, CR], P.rust, 7); line([TT, FW], P.rust, 7); line([TT, HB], P.dark, 7);
  line([[-26, -84], [-6, -84]], P.dark, 8);
  ctx.save(); ctx.translate(-34, -132); ctx.rotate(-.25); logo(0, 0, 25, 1); ctx.restore();   // sac à dos carton
  line([[-14, -94], [8, -136]], P.orange, 26);                        // buste
  line([[8, -132], [44, -96]], P.orange, 11);                          // bras
  leg(ph, P.dark);
  circ(18, -158, 16, P.dark);
  ctx.beginPath(); ctx.arc(18, -161, 18, Math.PI, 0); ctx.closePath(); ctx.fillStyle = P.rust; ctx.fill();
  ctx.restore();
}

function camera(x, y, s) {
  withT(x, y, s, () => {
    rr(-70, -86, 60, 30, 10, P.brick); rr(-115, -62, 230, 145, 24, P.rust); rr(62, -46, 34, 18, 6, P.cream2);
    rr(-115, -14, 230, 20, 0, P.brick);
    circ(8, 10, 58, P.dark); circ(8, 10, 42, P.orange); circ(8, 10, 22, P.brick); circ(-6, -4, 8, P.cream2);
  });
}
function lockIcon(x, y, s, col) {
  withT(x, y, s, () => {
    ctx.beginPath(); ctx.arc(0, -6, 12, Math.PI, 0); ctx.lineWidth = 6; ctx.strokeStyle = col; ctx.stroke();
    rr(-17, -6, 34, 26, 6, col); circ(0, 6, 4, P.cream);
  });
}
function camIcon(x, y, s, col) {
  withT(x, y, s, () => { rr(-9, -17, 16, 8, 3, col); rr(-19, -12, 38, 28, 7, col); circ(0, 2, 9, P.cream); circ(0, 2, 5, col); });
}
function pinIcon(x, y, s, col) {
  withT(x, y, s, () => { ctx.beginPath(); ctx.arc(0, -10, 10, Math.PI * .85, Math.PI * .15); ctx.lineTo(0, 10); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); circ(0, -10, 4, P.cream); });
}

// Téléphone : h = hauteur (px). fn() dessine l'écran en unités 386×796.
function phone(cx, cy, h, fn, bg = P.cream) {
  const s = h / 820;
  ctx.save(); ctx.translate(cx - 205 * s, cy - 410 * s); ctx.scale(s, s);
  rr(0, 0, 410, 820, 58, P.dark);
  ctx.save(); ctx.beginPath(); ctx.roundRect(12, 12, 386, 796, 48); ctx.clip();
  ctx.translate(12, 12); ctx.fillStyle = bg; ctx.fillRect(0, 0, 386, 796);
  const m = ctx.getTransform(); CLIP = [m.e, m.f, m.e + 386 * m.a, m.f + 796 * m.d];
  fn(); CLIP = null;
  ctx.restore();
  rr(145, 22, 120, 30, 15, P.dark);
  ctx.restore();
}
// Doigt / tap : anneau qui s'ouvre à t0
function tap(x, y, t, t0) {
  const a = pr(t, t0 - .3, t0), b = pr(t, t0, t0 + .4);
  if (a <= 0 || b >= 1) return;
  if (b > 0) { ctx.save(); ctx.globalAlpha = 1 - b; circ(x, y, 26 + 70 * E.out(b), null, P.orange, 8); ctx.restore(); }
  if (b < .5) { ctx.save(); ctx.globalAlpha = .85 * (b > 0 ? 1 - b * 2 : E.out(a)); circ(x + 40 * (1 - E.out(a)), y + 60 * (1 - E.out(a)), b > 0 ? 22 : 26, P.dark); ctx.restore(); }
}

// Titre principal avec révélation par masque (glisse depuis le bas) et sortie vers le haut
function heading(lines, colors, t, tIn, tOut, L) {
  const size = fit(lines, L.size, L.maxW), lh = size * 1.18;
  const top = L.cy - lines.length * lh / 2;
  lines.forEach((s, i) => {
    const a = E.out(pr(t, tIn + i * .1, tIn + i * .1 + .35)), b = tOut ? E.in(pr(t, tOut, tOut + .25)) : 0;
    if (a <= 0 || b >= 1) return;
    const y = top + i * lh, base = y + size * .86;
    ctx.save(); ctx.beginPath(); ctx.rect(0, y - 10, W, lh + 6); ctx.clip();
    txt(s, L.x, base + lh * (1 - a) - lh * b, size, { color: colors[i] || P.dark, align: L.align, alpha: a * (1 - b) });
    ctx.restore();
  });
}

// Transition : volet en aplat de couleur (2 couleurs) centré sur tc. Renvoie true si on est après tc.
function wipe(t, tc, c1, c2) {
  const d = .26, p = pr(t, tc - d, tc + d), lag = .25;
  if (p <= 0 || p >= 1) return;
  const q = p < .5 ? p * 2 : (p - .5) * 2;
  // c2 mène à l'entrée et part en dernier ; c1 (au-dessus) couvre tout à tc
  for (const [col, first] of [[c2, true], [c1, false]]) {
    let u = 1, v = 0;
    if (p < .5) u = E.inOut(cl((q - (first ? 0 : lag)) / (1 - lag)));
    else v = E.inOut(cl((q - (first ? lag : 0)) / (1 - lag)));
    ctx.fillStyle = col;
    if (!V) ctx.fillRect(v * W, 0, (u - v) * W, H); else ctx.fillRect(0, v * H, W, (u - v) * H);
  }
}

// ===================== MISE EN PAGE PAR FORMAT =====================
const L = V ? {
  head: { x: 540, cy: 400, size: 100, maxW: 920, align: 'center' },
  ph: { cx: 540, cy: 1250, h: 1060 },
  s4: { pill: [540, 190], head: { x: 540, cy: 380, size: 100, maxW: 920, align: 'center' }, ph: { cx: 660, cy: 1230, h: 1000 }, seller: [215, 1650, 1.6] },
  s6: { head: { x: 540, cy: 380, size: 120, maxW: 920, align: 'center' }, ground: 1660, fac: [120, 720, 840], door: [290, 1130, 280], bell: [640, 1350], courier: [790, 1.55], buyer: [430, 1.5] },
  s7: { x: 540, ys: [640, 980, 1320], size: 150, maxW: 940, cap: 52 },
  s8: { c0: [540, 860, 230], c1: [540, 720, 190], name: [540, 1200, 150, 940, 'center'], base: [540, 1290, 52], bientot: [540, 1770] },
} : {
  head: { x: 150, cy: 540, size: 100, maxW: 1000, align: 'left' },
  ph: { cx: 1440, cy: 545, h: 860 },
  s4: { pill: [150, 300], head: { x: 150, cy: 520, size: 100, maxW: 600, align: 'left' }, ph: { cx: 1480, cy: 545, h: 860 }, seller: [960, 900, 1.55] },
  s6: { head: { x: 1150, cy: 540, size: 120, maxW: 680, align: 'left' }, ground: 930, fac: [180, 180, 860], door: [400, 410, 300], bell: [770, 640], courier: [900, 1.6], buyer: [550, 1.55] },
  s7: { x: 960, ys: [290, 560, 830], size: 150, maxW: 1500, cap: 48 },
  s8: { c0: [960, 520, 200], c1: [560, 540, 165], name: [830, 520, 160, 1000, 'left'], base: [836, 610, 50], bientot: [836, 720, 'left'] },
};

// ===================== CARTE DE LYON =====================
function catmull(pts, n = 16) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const u = k / n, u2 = u * u, u3 = u2 * u;
      out.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3)));
    }
  }
  out.push(pts[pts.length - 1]); return out;
}
const MAP = V ? {
  saone: catmull([[150, -60], [250, 380], [400, 620], [420, 900], [470, 1200], [540, 1460]]),
  rhone: catmull([[930, -60], [780, 400], [690, 700], [650, 1000], [600, 1280], [550, 1460]]),
  joint: catmull([[545, 1460], [600, 1700], [640, 1990]]),
  seller: [540, 600], buyer: [860, 1420],
  route: [[540, 600], [540, 850], [560, 1180], [800, 1210], [830, 1420], [860, 1420]],
  bridges: [[[330, 1185], [780, 1210]], [[300, 500], [820, 500]], [[300, 900], [760, 900]]],
  lbl: { saone: [425, 760], rhone: [660, 960] },
  chrono: [540, 150], lyon: [80, 150, 'left'], photo: [540, 380], code: [700, 1580],
} : {
  saone: catmull([[520, -60], [640, 250], [800, 400], [860, 600], [900, 780], [1040, 960]]),
  rhone: catmull([[1520, -60], [1340, 200], [1200, 420], [1150, 640], [1110, 840], [1050, 960]]),
  joint: catmull([[1045, 960], [1110, 1060], [1150, 1150]]),
  seller: [990, 310], buyer: [1460, 790],
  route: [[990, 310], [995, 460], [1010, 610], [1270, 640], [1310, 790], [1460, 790]],
  bridges: [[[860, 610], [1300, 640]], [[700, 300], [1400, 300]], [[880, 860], [1200, 860]]],
  lbl: { saone: [870, 690], rhone: [1250, 330] },
  chrono: [960, 95], lyon: [120, 95, 'left'], photo: [660, 310], code: [1460, 935],
};
// îlots (blocs) générés une fois, hors rivières
const BLOCKS = (() => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const riv = [...MAP.saone, ...MAP.rhone, ...MAP.joint], out = [];
  const near = (x, y, d) => riv.some(([a, b]) => Math.hypot(a - x, b - y) < d);
  for (let y = 10; y < H; y += 96) for (let x = 10 + ((y / 96) % 2) * 30; x < W; x += 116) {
    const w = 80 + rnd() * 26, h = 66 + rnd() * 18, cx = x + w / 2, cy = y + h / 2;
    if (near(cx, cy, 95) || rnd() < .12) continue;
    out.push([x, y, w, h, rnd() < .16]);
  }
  return out;
})();
const ROUTE = (() => { const segs = []; let tot = 0; for (let i = 1; i < MAP.route.length; i++) { const a = MAP.route[i - 1], b = MAP.route[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a, b, l, s0: tot }); tot += l; } return { segs, tot }; })();
function routeAt(s) {
  for (const g of ROUTE.segs) if (s <= g.s0 + g.l || g === ROUTE.segs.at(-1)) { const k = cl((s - g.s0) / g.l); return { p: [lerp(g.a[0], g.b[0], k), lerp(g.a[1], g.b[1], k)], dx: g.b[0] - g.a[0] }; }
}
function routePts(s) { const out = [MAP.route[0]]; for (const g of ROUTE.segs) { if (s >= g.s0 + g.l) out.push(g.b); else { out.push(routeAt(s).p); break; } } return out; }

function pin(x, y, col, label, p) {
  if (p <= 0) return;
  const k = E.back(p);
  withT(x, y, k, () => {
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-14, -26, -36, -40, -36, -64); ctx.arc(0, -64, 36, Math.PI, 0); ctx.bezierCurveTo(36, -40, 14, -26, 0, 0); ctx.fillStyle = col; ctx.fill();
    circ(0, -64, 14, P.cream);
  });
  if (p > .4) {
    ctx.save(); ctx.globalAlpha = pr(p, .4, 1);
    const w = measure(label, 30, true) + 36; rr(x - w / 2, y + 14, w, 46, 23, P.cream, P.beige, 3);
    txt(label, x, y + 47, 30, { body: true, align: 'center', group: 'map' });
    ctx.restore();
  }
}
function pastille(x, y, icon, label, p, col) {
  if (p <= 0) return;
  const w = measure(label, 36, true) + 120, k = E.back(p);
  withT(x, y, k, () => {
    rr(-w / 2, -40, w, 80, 40, P.cream, col, 5);
    circ(-w / 2 + 44, 0, 28, col);
    icon(-w / 2 + 44, 1, 1, P.cream);
    txt(label, -w / 2 + 88, 12, 36, { body: true });
  });
}

// ===================== SCÈNES =====================
function screenListing(t) {
  line([[30, 78], [18, 90], [30, 102]], P.dark, 5);
  txt(T.annonce, 193, 100, 26, { body: true, align: 'center', alpha: .6 });
  rr(20, 130, 346, 270, 26, P.cream2);
  camera(193, 270, .95);
  txt(T.objet, 24, 458, 36, { body: true });
  txt(T.prix, 24, 528, 58, { color: P.rust });
  pinIcon(36, 578, 1.1, P.brick);
  txt(T.lieu, 56, 584, 28, { body: true, alpha: .75 });
  rr(20, 620, 346, 2, 0, P.beige);
  const press = 1 - .06 * Math.sin(Math.PI * pr(t, 4.2, 4.45));
  withT(193, 720, press, () => { rr(-173, -40, 346, 80, 40, P.rust); txt(T.acheter, 0, 12, 32, { color: P.cream, align: 'center' }); });
  tap(193, 720, t, 4.3);
}
function screenDelivery(t) {
  line([[30, 78], [18, 90], [30, 102]], P.dark, 5);
  txt(T.livraison, 24, 160, 40);
  txt(T.choisis, 24, 200, 26, { body: true, alpha: .6 });
  // point relais (grisé puis barré)
  ctx.save(); ctx.globalAlpha = .5;
  rr(20, 228, 346, 126, 24, P.cream2, P.beige, 3);
  withT(64, 292, .9, () => { poly([[-24, -12], [0, -24], [24, -12], [0, 0]], P.beige); poly([[-24, -12], [0, 0], [0, 26], [-24, 14]], P.beige); poly([[0, 0], [24, -12], [24, 14], [0, 26]], P.beige); });
  txt(T.relais, 108, 282, 32, { body: true });
  txt(T.relaisDelai, 108, 322, 28, { body: true });
  ctx.restore();
  const k = E.out(pr(t, 5.6, 5.95));
  if (k > 0) line([[100, 292], [100 + 250 * k, 292]], P.dark, 6);
  // option Springbok
  const a = E.back(pr(t, 8.2, 8.75));
  if (a > 0) {
    const bounce = 1 - .05 * Math.sin(Math.PI * pr(t, 9.25, 9.45)) + .03 * Math.sin(Math.PI * pr(t, 9.45, 9.7));
    ctx.save(); ctx.translate(420 * (1 - a), 0);
    withT(193, 455, bounce, () => {
      rr(-173, -82, 346, 164, 26, P.rust);
      if (t > 9.3) rr(-173, -82, 346, 164, 26, null, P.dark, 6);
      logo(-128, -10, 26, 1);
      txt(T.sb, -85, -28, 32, { color: P.cream });
      txt(T.sbDelai, -85, 10, 25, { body: true, color: P.cream });
      txt(T.sbPrix, -85, 46, 25, { body: true, color: P.cream2 });
      const c = E.back(pr(t, 9.3, 9.6));
      if (c > 0) withT(142, -50, c, () => { circ(0, 0, 18, P.cream); check(0, 1, 18, P.rust, 5); });
    });
    ctx.restore();
  }
  tap(193, 455, t, 9.3);
  const b = E.back(pr(t, 9.7, 10.1));
  if (b > 0) { ctx.save(); ctx.translate(0, 140 * (1 - b)); rr(20, 680, 346, 80, 40, P.dark); txt(T.valider, 193, 732, 32, { color: P.cream, align: 'center' }); ctx.restore(); }
}
function scenePhone(t) {   // 0 – 11 s
  // titres
  if (t < 4.9) {           // texte tapé
    const all = T.s1.join('\n'), n = Math.floor(all.length * pr(t, .25, 1.75));
    const shown = all.slice(0, n).split('\n'), size = fit(T.s1, L.head.size, L.head.maxW), lh = size * 1.18;
    const top = L.head.cy - T.s1.length * lh / 2, out = E.in(pr(t, 4.6, 4.85));
    ctx.save(); ctx.beginPath(); ctx.rect(0, top - 10 - lh * 2 * 0, W, lh * T.s1.length + 10); ctx.clip();
    const x0 = i => L.head.align === 'center' ? L.head.x - measure(T.s1[i], size) / 2 : L.head.x;   // ligne finale centrée, frappe de gauche à droite
    shown.forEach((s, i) => txt(s, x0(i), top + i * lh + size * .86 - out * lh * 2, size, { alpha: 1 - out }));
    const li = shown.length - 1, cx = x0(li) + measure(shown[li], size);
    if (out === 0 && (t < 1.75 || Math.floor(t * 2.5) % 2 === 0)) rr(cx + 8, top + li * lh + size * .05, size * .09, size * .9, 3, P.rust);
    ctx.restore();
  }
  heading(T.s2, [P.dark, P.dark], t, 5.0, 7.9, L.head);
  heading(T.s3, [P.dark, P.rust], t, 8.4, null, L.head);
  // téléphone
  const pin_ = E.back(pr(t, 1.8, 2.35));
  if (pin_ <= 0) return;
  const { cx, cy, h } = L.ph, dy = (H - cy + h / 2 + 40) * (1 - pin_);
  phone(cx, cy + dy, h, () => {
    const sl = E.inOut(pr(t, 4.55, 4.9));
    if (sl < 1) { ctx.save(); ctx.translate(-386 * sl, 0); screenListing(t); ctx.restore(); }
    if (sl > 0) { ctx.save(); ctx.translate(386 * (1 - sl), 0); screenDelivery(t); ctx.restore(); }
  });
}

function sceneSeller(t) {  // 11 – 14 s
  const S = L.s4, p = E.back(pr(t, 11.1, 11.45));
  if (p > 0) withT(S.pill[0], S.pill[1], p, () => {
    const w = measure(T.vendeurTag, 34, true) + 50, x0 = V ? -w / 2 : 0;
    rr(x0, -30, w, 60, 30, P.brick); txt(T.vendeurTag, x0 + 25, 12, 34, { body: true, color: P.cream });
  });
  heading(T.s4, [P.dark, P.rust], t, 11.2, null, S.head);
  // vendeur avec le colis
  const [sx, sy, ss] = S.seller, hop = 24 * Math.sin(Math.PI * pr(t, 12.95, 13.3));
  const sp = E.back(pr(t, 11.15, 11.55));
  if (sp > 0) withT(sx, sy, 1, () => {
    ctx.translate(0, (1 - sp) * 400);
    person(0, 0, ss, P.brick, { arms: 'hold', hop: hop });
    logo(30 * ss, -100 * ss - hop, 40 * ss, 1);
  });
  // téléphone
  const { cx, cy, h } = S.ph, pp = E.back(pr(t, 11.05, 11.45));
  phone(cx, cy + (1 - pp) * (H - cy + h / 2 + 40), h, () => {
    txt(T.heure, 193, 210, 86, { align: 'center' });
    txt(T.jour, 193, 256, 28, { body: true, align: 'center', alpha: .6 });
    const n = E.back(pr(t, 11.5, 11.9)), ny = lerp(-180, 300, n);
    withT(193, ny + 75, 1, () => {
      rr(-175, -75, 350, 150, 28, P.cream, P.beige, 3);
      logo(-140, -42, 17, 1);
      txt(T.notifApp, -112, -34, 22, { body: true, alpha: .6 });
      txt(T.notif1, -155, 12, 32, { body: true });
      const w = txt(T.notif2, -155, 50, 32, { body: true });
      circ(-155 + w + 24, 40, 15, P.rust); check(-155 + w + 24, 41, 15, P.cream, 4);
    });
    const b = E.back(pr(t, 12.0, 12.35)), done = t >= 12.8;
    if (b > 0) {
      const press = 1 - .07 * Math.sin(Math.PI * pr(t, 12.7, 12.9)) + .04 * Math.sin(Math.PI * pr(t, 12.9, 13.15));
      ctx.save(); ctx.translate(0, 220 * (1 - b));
      withT(193, 560, press, () => {
        rr(-175, -42, 350, 84, 42, done ? P.brick : P.rust);
        if (done) { const w = measure(T.confirme, 32); txt(T.confirme, -22, 12, 32, { color: P.cream, align: 'center' }); check(-22 + w / 2 + 30, 0, 26, P.cream, 6); }
        else txt(T.confirmer, 0, 12, 32, { color: P.cream, align: 'center' });
      });
      ctx.restore();
    }
    tap(193, 560, t, 12.8);
  }, P.cream2);
}

function sceneMap(t) {     // 14 – 20 s
  ctx.fillStyle = P.cream; ctx.fillRect(0, 0, W, H);
  for (const [x, y, w, h, alt] of BLOCKS) rr(x, y, w, h, 10, alt ? P.beige : P.cream2);
  for (const r of [MAP.saone, MAP.rhone]) line(r, P.beige, 74);
  line(MAP.joint, P.beige, 104);
  for (const [a, b] of MAP.bridges) line([a, b], P.cream, 22);
  txt(T.saone, ...MAP.lbl.saone, 30, { body: true, color: P.brick, align: 'center', alpha: .8, group: 'map' });
  txt(T.rhone, ...MAP.lbl.rhone, 30, { body: true, color: P.brick, align: 'center', alpha: .8, group: 'map' });
  // trajet
  const mv = E.inOut(pr(t, 15.4, 18.8)), s = mv * ROUTE.tot;
  line(MAP.route, P.orange, 6, [2, 16]);
  if (s > 0) line(routePts(s), P.orange, 12, [26, 18]);
  // livreur
  const ap = E.back(pr(t, 14.6, 14.95));
  if (ap > 0) {
    const r = routeAt(s), dir = MAP.route[1][0] < MAP.route[0][0] ? -1 : (s > 0 && r.dx < -1 ? -1 : 1);
    const bump = mv > 0 && mv < 1 ? Math.abs(Math.sin(t * 14)) * 3 : 0;
    courier(r.p[0], r.p[1] + 6 - bump, .85 * ap, t * 11 * (mv > 0 && mv < 1 ? 1 : 0), dir);
  }
  pin(...MAP.seller, P.brick, T.vendeur, pr(t, 14.25, 14.6));     // repères au-dessus du vélo : étiquettes toujours lisibles
  pin(...MAP.buyer, P.rust, T.acheteur, pr(t, 14.4, 14.75));
  // flash photo au retrait
  const f = pr(t, 15.0, 15.25);
  if (f > 0 && f < 1) { ctx.save(); ctx.globalAlpha = 1 - f; circ(MAP.seller[0], MAP.seller[1] - 64, 40 + 90 * f, null, P.orange, 10); ctx.restore(); }
  const g = pr(t, 18.85, 19.15);
  if (g > 0 && g < 1) { ctx.save(); ctx.globalAlpha = 1 - g; circ(MAP.buyer[0], MAP.buyer[1] - 64, 40 + 90 * g, null, P.rust, 10); ctx.restore(); }
  pastille(...MAP.photo, camIcon, T.photo, pr(t, 15.0, 15.35), P.orange);
  pastille(...MAP.code, lockIcon, T.code, pr(t, 18.9, 19.25), P.rust);
  // chrono
  const mins = Math.round(107 * pr(t, 15.4, 18.8)), str = `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
  const cp = E.back(pr(t, 14.15, 14.5));
  withT(...MAP.chrono, cp, () => {
    rr(-150, -52, 300, 104, 52, P.dark);
    withT(-86, 0, 1, () => { circ(0, 3, 24, null, P.cream, 6); line([[0, 3], [0, -10]], P.cream, 5); line([[0, 3], [8 * Math.sin(t * 6), 3 - 8 * Math.cos(t * 6)]], P.orange, 4); rr(-7, -30, 14, 7, 3, P.cream); });
    txt(str, 30, 24, 64, { color: P.cream, align: 'center' });
  });
  const lp = E.back(pr(t, 14.2, 14.5));
  if (lp > 0) withT(MAP.lyon[0], MAP.lyon[1], lp, () => { const w = measure(T.lyon, 40) + 44; rr(0, -34, w, 68, 34, P.rust); txt(T.lyon, 22, 14, 40, { color: P.cream }); });
}

function sceneDoor(t) {    // 20 – 24 s
  const S = L.s6, G = S.ground, [fx, fy, fw] = S.fac, [dx, dy, dw] = S.door;
  rr(fx, fy, fw, G - fy, 0, P.cream2);
  for (let y = fy + 60; y < G; y += 70) rr(fx, y, fw, 4, 0, P.beige);
  rr(fx - 30, fy - 30, fw + 60, 40, 8, P.brick);
  rr(0, G, W, H - G, 0, P.beige);
  rr(dx - 18, dy - 18, dw + 36, G - dy + 18, 10, P.dark);
  rr(dx, dy, dw, G - dy, 0, P.beige);                         // intérieur éclairé
  const op = E.out(pr(t, 20.9, 21.3));
  // acheteur dans l'embrasure
  if (op > 0) {
    const hop = 26 * Math.sin(Math.PI * pr(t, 22.05, 22.4)), got = t > 21.95;
    const [bx, bs] = S.buyer;
    ctx.save(); ctx.beginPath(); ctx.rect(dx, dy, dw, G - dy); ctx.clip();
    person(bx, G, bs, P.rust, { arms: got ? 'hold' : 'down', hop });
    ctx.restore();
  }
  // porte qui s'ouvre (charnière à gauche)
  const pw = dw * (1 - .82 * op);
  rr(dx, dy, pw, G - dy, 0, op > .5 ? P.brick : P.rust);
  if (op < .6) { rr(dx + pw * .14, dy + 40, pw * .72, 160, 8, P.brick); rr(dx + pw * .14, dy + 240, pw * .72, 200, 8, P.brick); circ(dx + pw * .86, dy + (G - dy) * .55, 11, P.cream2); }
  // sonnette
  const ring = pr(t, 20.35, 20.95), [bx, by] = S.bell;
  rr(bx - 22, by - 32, 44, 64, 12, P.dark); circ(bx, by, 12, ring > 0 && ring < 1 ? P.orange : P.cream2);
  if (ring > 0 && ring < 1) for (const k of [1, 2]) { ctx.save(); ctx.globalAlpha = 1 - ring; ctx.beginPath(); ctx.arc(bx, by, 30 + k * 18 + ring * 20, -.7, .7); ctx.lineWidth = 6; ctx.strokeStyle = P.orange; ctx.stroke(); ctx.restore(); }
  // livreur
  const [cx, cs] = S.courier, ci = E.out(pr(t, 20.0, 20.35));
  ctx.save(); ctx.translate((1 - ci) * (W - cx + 200), 0);
  const give = pr(t, 21.5, 22.0);
  person(cx, G, cs, P.orange, { arms: give < 1 ? 'hold' : 'down', helmet: true, pack: true, flip: true });
  ctx.restore();
  // le carton passe de main en main
  const [bxp, bsp] = S.buyer, from = [cx - 30 * cs + (1 - ci) * (W - cx + 200), G - 100 * cs], to = [bxp + 30 * bsp, G - 100 * bsp - 26 * Math.sin(Math.PI * pr(t, 22.05, 22.4))];
  const ge = E.inOut(give), bp = [lerp(from[0], to[0], ge), lerp(from[1], to[1], ge) - Math.sin(Math.PI * ge) * 60];
  logo(bp[0], bp[1], 40 * cs, 1);
  heading(T.s6, [P.dark, P.rust], t, 22.2, null, S.head);
}

function sceneWords(t) {   // 24 – 27 s
  const S = L.s7, size = fit(T.mots, S.size, S.maxW), cols = [P.orange, P.rust, P.brick];
  T.mots.forEach((m, i) => {
    const t0 = 24.15 + i * .7, p = pr(t, t0, t0 + .45);
    if (p <= 0) return;
    const y = S.ys[i], off = -size * 1.2 * (1 - E.back(p));
    const sq = .12 * Math.sin(Math.PI * pr(t, t0 + .2, t0 + .45));
    ctx.save(); ctx.beginPath(); ctx.rect(0, y - size * 1.1, W, size * 1.25); ctx.clip(); CLIP = [0, y - size * 1.1, W, y + size * .15];
    withT(S.x, y + off, 1, () => { ctx.scale(1 + sq * .5, 1 - sq); txt(m, 0, 0, size, { color: cols[i], align: 'center' }); });
    ctx.restore(); CLIP = null;
    const c = E.out(pr(t, t0 + .3, t0 + .6));
    if (c > 0) {
      const w = measure(T.legendes[i], S.cap, true);
      ctx.save(); ctx.beginPath(); ctx.rect(S.x - w / 2 - 30, y + 18, w + 60, S.cap * 1.6); ctx.clip();
      txt(T.legendes[i], S.x, y + S.cap * 1.3 + 18 + (1 - c) * S.cap * 1.5, S.cap, { body: true, align: 'center', alpha: c });
      ctx.restore();
    }
  });
}

function sceneEnd(t) {     // 27 – 30 s
  const S = L.s8, drop = pr(t, 27.1, 27.5), land = pr(t, 27.5, 27.75), mv = E.inOut(pr(t, 28.15, 28.6));
  const c = [lerp(S.c0[0], S.c1[0], mv), lerp(S.c0[1], S.c1[1], mv)], s = lerp(S.c0[2], S.c1[2], mv);
  if (drop > 0) {
    const y = c[1] - (1 - E.in(drop)) * (c[1] + 3 * s) - 30 * Math.sin(Math.PI * pr(t, 27.75, 28.0));
    logo(c[0], y, s, E.back(pr(t, 27.65, 28.1)), .16 * Math.sin(Math.PI * land));
  }
  const [nx, ny, ns, nw, na] = S.name, size = fit([T.nom], ns, nw);
  const a = E.out(pr(t, 28.3, 28.65));
  if (a > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, ny - size, W, size * 1.15); ctx.clip(); txt(T.nom, nx, ny + size * (1 - a), size, { align: na, alpha: a }); ctx.restore(); }
  const [bx, by, bs] = S.base, bsz = fit(T.base, bs, nw, true);
  T.base.forEach((l, i) => {
    const b = E.out(pr(t, 28.55 + i * .12, 28.9 + i * .12));
    if (b > 0) txt(l, bx + (na === 'left' ? 0 : 0) - (1 - b) * 0, by + i * bsz * 1.2 + (1 - b) * 30, bsz, { body: true, align: na, alpha: b, color: i ? P.rust : P.dark });
  });
  const k = E.back(pr(t, 29.0, 29.35));
  const bw = measure(T.bientot, 34, true) + 56, bx0 = S.bientot[2] === 'left' ? S.bientot[0] + bw / 2 : S.bientot[0];
  if (k > 0) withT(bx0, S.bientot[1], k, () => { const w = bw; rr(-w / 2, -32, w, 64, 32, P.rust); txt(T.bientot, 0, 12, 34, { body: true, color: P.cream, align: 'center' }); });
}

// ===================== TIMELINE =====================
const CUTS = [[11, P.rust, P.orange], [14, P.orange, P.brick], [20, P.rust, P.cream2], [24, P.brick, P.rust], [27, P.orange, P.rust]];
function draw(t) {
  BOXES = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = P.cream; ctx.fillRect(0, 0, W, H);
  if (t < 11) scenePhone(t);
  else if (t < 14) sceneSeller(t);
  else if (t < 20) sceneMap(t);
  else if (t < 24) sceneDoor(t);
  else if (t < 27) sceneWords(t);
  else sceneEnd(t);
  for (const [tc, a, b] of CUTS) wipe(t, tc, a, b);
}

// Repères audio (lus par audio.py)
const CUES = [];
{ const all = T.s1.join(''); for (let i = 0; i < all.length; i++) if (all[i] !== ' ') CUES.push([+(.25 + 1.5 * (i + .5) / all.length).toFixed(3), 'key']); }
CUES.push([1.8, 'whoosh'], [4.3, 'click'], [4.55, 'swipe'], [5.6, 'strike'], [8.2, 'whoosh'], [9.3, 'click'], [9.32, 'pop'], [9.7, 'pop'],
  [11.0, 'wipe'], [11.5, 'notif'], [12.8, 'click'], [12.82, 'success'], [14.0, 'wipe'], [14.25, 'pop'], [14.4, 'pop'], [15.0, 'shutter'], [15.4, 'bike'],
  [18.9, 'lock'], [20.0, 'wipe'], [20.35, 'bell'], [20.9, 'door'], [22.0, 'pop'], [22.2, 'success'], [24.0, 'wipe'],
  [24.4, 'thud'], [25.1, 'thud'], [25.8, 'thud'], [27.0, 'wipe'], [27.5, 'boing'], [27.7, 'sparkle'], [28.3, 'hit']);

window.FPS = FPS; window.DURATION = DURATION; window.CUES = CUES;
window.seek = t => { draw(t); return BOXES; };
window.ready = Promise.all(['bold 40px "Liberation Sans"', 'bold 40px Carlito'].map(f => document.fonts.load(f))).then(() => { draw(0); return true; });
if (Q.get('play')) {
  document.body.className = 'preview';
  window.ready.then(() => { const t0 = performance.now(); const loop = () => { draw(((performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(loop); }; loop(); });
}
