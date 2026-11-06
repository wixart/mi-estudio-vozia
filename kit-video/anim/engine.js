/* ===================================================================
   MOTOR DE VÍDEO EXPLICATIVO VERTICAL (1080x1920, 30 fps)
   - Lee window.TIMELINE (palabras con tiempos, escenas, bloques de subtítulo)
   - Lee window.BRAND (colores, logo) y window.SCENES (dibujo de cada escena)
   - Expone window.renderAt(t), window.getBounds(), window.getSfx(), window.ready
   =================================================================== */
const W = 1080, H = 1920, FPS = 30;
const cv = document.getElementById('c');
cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');

/* ---------- utilidades de tiempo y easing ---------- */
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const prog = (t, t0, d) => clamp((t - t0) / d);
const lerp = (a, b, p) => a + (b - a) * p;
const eOut = p => 1 - Math.pow(1 - p, 3);
const eIn = p => p * p * p;
const eInOut = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const eBack = p => { const c1 = 1.70158, c3 = c1 + 1; return p <= 0 ? 0 : 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
const eElastic = p => p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - .75) * (2 * Math.PI / 3)) + 1;
function rng(seed) { let s = seed >>> 0; return () => ((s = Math.imul(s ^ (s >>> 15), 1 | s) + 0x6D2B79F5 >>> 0) % 100000) / 100000; }
const norm = w => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

/* ---------- primitivas de dibujo ---------- */
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fillRR(x, y, w, h, r, col, shadow = true) {
  if (shadow) { ctx.fillStyle = 'rgba(0,0,0,.18)'; rr(x + 10, y + 12, w, h, r); ctx.fill(); }
  ctx.fillStyle = col; rr(x, y, w, h, r); ctx.fill();
}
function font(size, weight = 700) { ctx.font = `${weight} ${size}px ${BRAND.font || 'Poppins'}`; }
function text(str, x, y, size, col, { weight = 700, align = 'center', base = 'middle', maxW } = {}) {
  font(size, weight); ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = base;
  if (maxW) { const m = ctx.measureText(str).width; if (m > maxW) { font(size * maxW / m, weight); } }
  ctx.fillText(str, x, y);
}
function tw(str, size, weight = 700) { font(size, weight); return ctx.measureText(str).width; }
/* aplica una transformación (posición, escala, rotación, opacidad) y dibuja */
function at(x, y, { s = 1, r = 0, a = 1 } = {}, fn) {
  if (a <= 0 || s <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(s, s); ctx.globalAlpha *= clamp(a); fn(); ctx.restore();
}
const pop = (t, t0, d = .4) => eBack(prog(t, t0, d));           // escala 0 → 1 con rebote
const drop = (t, t0, d = .5) => (1 - eBack(prog(t, t0, d))) * -1400; // caída desde arriba
const rad = d => d * Math.PI / 180;

/* papel con chincheta */
function paper(x, y, w, h, { pin = true, col = BRAND.card || '#FBF6EC' } = {}) {
  fillRR(x, y, w, h, 10, col);
  ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 3; rr(x, y, w, h, 10); ctx.stroke();
  if (pin) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(x + w / 2 + 4, y + 26, 14, 0, 7); ctx.fill();
    ctx.fillStyle = BRAND.red; ctx.beginPath(); ctx.arc(x + w / 2, y + 22, 14, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(x + w / 2 - 4, y + 17, 4, 0, 7); ctx.fill(); }
}
function lines(x, y, w, n, gap = 34, col = 'rgba(0,0,0,.14)', seed = 3) {
  const R = rng(seed); ctx.fillStyle = col;
  for (let i = 0; i < n; i++) { rr(x, y + i * gap, w * (.55 + R() * .45), 12, 6); ctx.fill(); }
}
/* etiqueta tipo cartel (fondo de color, texto blanco) */
function tag(str, x, y, size = 40, bg = BRAND.red, fg = '#fff', r = 10) {
  const w = tw(str, size) + size * 1.1, h = size * 1.6;
  fillRR(x - w / 2, y - h / 2, w, h, r, bg);
  text(str, x, y + size * .06, size, fg);
  return w;
}
/* sello de goma: baja, golpea, sube. p = tiempo local desde el inicio del golpe */
function stamp(str, x, y, t, t0, { rot = -.12, size = 70, col = BRAND.red } = {}) {
  const imp = t0 + .28; if (t < t0) return;
  if (t >= imp) {
    const k = 1 + .35 * (1 - eOut(prog(t, imp, .18)));
    at(x, y, { s: k, r: rot, a: .92 }, () => {
      const w = tw(str, size) + 70, h = size * 1.7;
      ctx.strokeStyle = col; ctx.lineWidth = 9; rr(-w / 2, -h / 2, w, h, 16); ctx.stroke();
      ctx.lineWidth = 3; rr(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 10); ctx.stroke();
      text(str, 0, size * .06, size, col);
      const R = rng(9); ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(0,0,0,${R() * .5})`; ctx.fillRect(-w / 2 + R() * w, -h / 2 + R() * h, 3 + R() * 7, 3 + R() * 5); }
      ctx.globalCompositeOperation = 'source-over';
    });
  }
  // el sello (mango) entra y sale
  const down = eIn(prog(t, t0, .28)), up = eOut(prog(t, imp + .12, .35));
  const hy = y - 900 * (1 - down) - 900 * up; if (up >= 1) return;
  at(x, hy, { r: rot }, () => {
    fillRR(-150, -40, 300, 50, 10, '#7A4A2A', false); fillRR(-170, 0, 340, 30, 8, col, false);
    ctx.fillStyle = '#8B5A33'; rr(-30, -150, 60, 115, 12); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, -175, 62, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(-20, -195, 16, 0, 7); ctx.fill();
  });
}
/* pila de monedas */
function coins(x, baseY, n, w = 130) {
  for (let i = 0; i < n; i++) {
    const y = baseY - i * 13;
    ctx.fillStyle = BRAND.coinDark; ctx.beginPath(); ctx.ellipse(x, y + 6, w / 2, 14, 0, 0, 7); ctx.fill();
    ctx.fillStyle = BRAND.coin; ctx.beginPath(); ctx.ellipse(x, y, w / 2, 14, 0, 0, 7); ctx.fill();
    if (i % 3 === 0) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x - w / 2 + 10, y - 2, 18, 5); }
  }
  if (n > 0) { const y = baseY - (n - 1) * 13; ctx.fillStyle = BRAND.coinLight; ctx.beginPath(); ctx.ellipse(x, y - 1, w / 2 - 14, 8, 0, 0, 7); ctx.fill(); }
}
/* línea discontinua */
function dashed(x0, y, x1, col = BRAND.red, wdt = 8) {
  ctx.strokeStyle = col; ctx.lineWidth = wdt; ctx.setLineDash([34, 18]);
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.setLineDash([]);
}
/* check verde dentro de círculo */
function check(x, y, r, p, col = BRAND.green) {
  if (p <= 0) return;
  at(x, y, { s: eBack(p) }, () => {
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = r * .22; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-r * .42, 0); ctx.lineTo(-r * .1, r * .32); ctx.lineTo(r * .45, -r * .35); ctx.stroke(); ctx.lineCap = 'butt';
  });
}
/* personaje sencillo (mayor, pelo canoso). wave: 0..1 levanta el brazo */
function person(x, footY, s = 1, { shirt = BRAND.green, hair = '#E9E6E1', wave = 0, bob = 0 } = {}) {
  at(x, footY + bob, { s }, () => {
    const sk = '#F2C7A0';
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, 0, 70, 12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2D3550'; rr(-38, -150, 32, 150, 10); ctx.fill(); rr(6, -150, 32, 150, 10); ctx.fill();
    ctx.fillStyle = '#3A2A20'; rr(-44, -16, 42, 18, 8); ctx.fill(); rr(4, -16, 42, 18, 8); ctx.fill();
    ctx.fillStyle = shirt; rr(-55, -290, 110, 160, 28); ctx.fill();
    // brazos
    ctx.fillStyle = shirt; rr(-78, -280, 30, 120, 14); ctx.fill();
    at(64, -275, { r: -wave * 2.4 }, () => { ctx.fillStyle = shirt; rr(-15, 0, 30, 120, 14); ctx.fill(); ctx.fillStyle = sk; ctx.beginPath(); ctx.arc(0, 124, 15, 0, 7); ctx.fill(); });
    ctx.fillStyle = sk; ctx.beginPath(); ctx.arc(-63, -156, 15, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.moveTo(-20, -290); ctx.lineTo(0, -262); ctx.lineTo(20, -290); ctx.fill();
    // cabeza
    ctx.fillStyle = sk; rr(-12, -310, 24, 26, 6); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -360, 52, 0, 7); ctx.fill();
    ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(0, -372, 54, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-50, -362, 14, 26, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(50, -362, 14, 26, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-19, -360, 13, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(19, -360, 13, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, -360); ctx.lineTo(6, -360); ctx.stroke();
    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(-19, -360, 4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(19, -360, 4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8A4A3A'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -340, 14, .2, Math.PI - .2); ctx.stroke();
    ctx.fillStyle = 'rgba(230,120,110,.35)'; ctx.beginPath(); ctx.arc(-32, -338, 9, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(32, -338, 9, 0, 7); ctx.fill();
  });
}
/* bocadillo de diálogo */
function bubble(str, x, y, { col = BRAND.green, fg = '#fff', size = 40, tail = 'left', r = -.04 } = {}, s = 1) {
  at(x, y, { s, r }, () => {
    const w = tw(str, size) + 70, h = size * 1.9;
    ctx.fillStyle = 'rgba(0,0,0,.18)'; rr(-w / 2 + 8, -h / 2 + 10, w, h, 26); ctx.fill();
    ctx.fillStyle = col; rr(-w / 2, -h / 2, w, h, 26); ctx.fill();
    const tx = tail === 'left' ? -w / 2 + 60 : w / 2 - 60;
    ctx.beginPath(); ctx.moveTo(tx - 20, h / 2 - 2); ctx.lineTo(tx + (tail === 'left' ? -30 : 30), h / 2 + 34); ctx.lineTo(tx + 22, h / 2 - 2); ctx.fill();
    text(str, 0, size * .06, size, fg);
  });
}

/* ---------- fondos con textura (se pintan una vez) ---------- */
const BG = {};
function makeBg(name, painter) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  painter(g); // grano general
  const R = rng(name.length * 77);
  for (let i = 0; i < 26000 * (BRAND.grain ?? 1); i++) { g.fillStyle = R() < .5 ? `rgba(0,0,0,${R() * .07})` : `rgba(255,255,255,${R() * .07})`; g.fillRect(R() * W, R() * H, 2 + R() * 2, 2 + R() * 2); }
  const v = g.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${BRAND.vignette ?? .28})`);
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  BG[name] = c;
}
function topBand(g, col) { g.fillStyle = col; g.fillRect(0, 0, W, 150); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 150, W, 10); }
function floor(g, y, col, line) { g.fillStyle = col; g.fillRect(0, y, W, H - y); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, y, W, 14);
  g.fillStyle = line; for (let x = 0; x < W; x += 180) g.fillRect(x, y + 14, 5, H - y); }
function buildBackgrounds() {
  makeBg('cork', g => { g.fillStyle = '#C8935B'; g.fillRect(0, 0, W, H); const R = rng(4);
    for (let i = 0; i < 9000; i++) { g.fillStyle = R() < .6 ? 'rgba(110,60,20,.22)' : 'rgba(255,220,160,.25)'; g.beginPath(); g.ellipse(R() * W, R() * H, 1 + R() * 4, 1 + R() * 3, R() * 3, 0, 7); g.fill(); }
    topBand(g, '#9B6A3C'); });
  makeBg('wood', g => { g.fillStyle = '#B5683A'; g.fillRect(0, 0, W, H); const R = rng(8);
    for (let y = 0; y < H; y += 170) { g.fillStyle = 'rgba(60,25,10,.45)'; g.fillRect(0, y, W, 5); g.fillStyle = 'rgba(255,200,150,.12)'; g.fillRect(0, y + 5, W, 3); }
    for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(80,35,15,${.05 + R() * .1})`; g.lineWidth = 1 + R() * 2; const y = R() * H; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 60) g.lineTo(x, y + Math.sin(x / 140 + i) * 4); g.stroke(); }
    topBand(g, '#7E4524'); });
  const wall = (name, col, stripe, bandCol, flCol, flLine) => makeBg(name, g => { g.fillStyle = col; g.fillRect(0, 0, W, H);
    g.fillStyle = stripe; for (let x = 0; x < W; x += 120) g.fillRect(x, 0, 60, H); topBand(g, bandCol); if (flCol) floor(g, 1560, flCol, flLine); });
  wall('teal', '#2F6E68', 'rgba(0,0,0,.06)', '#1F4C48', '#E3CFA6', 'rgba(120,80,40,.25)');
  wall('sage', '#7FA088', 'rgba(255,255,255,.06)', '#4F7A61', '#E9D9B8', 'rgba(120,80,40,.22)');
  wall('greenwall', BRAND.green, 'rgba(255,255,255,.05)', '#1E3E2F', '#E3CFA6', 'rgba(120,80,40,.25)');
  makeBg('sky', g => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2F5F96'); gr.addColorStop(1, '#79A6D2'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.05)'; for (let y = 0; y < H; y += 26) g.fillRect(0, y, W, 10); topBand(g, '#24497A'); floor(g, 1560, '#D9C29A', 'rgba(120,80,40,.22)'); });
  makeBg('cream', g => { g.fillStyle = BRAND.cream; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(0,0,0,.025)'; for (let x = 0; x < W; x += 120) g.fillRect(x, 0, 60, H); topBand(g, BRAND.sage); });
  makeBg('brand', g => { g.fillStyle = BRAND.paper; g.fillRect(0, 0, W, H); });
}
function buildCleanBackgrounds() {
  const header = g => { g.fillStyle = BRAND.header || '#fff'; g.fillRect(0, 0, W, 150); g.fillStyle = 'rgba(26,32,44,.07)'; g.fillRect(0, 150, W, 6); };
  const dots = (g, col) => { g.fillStyle = col; for (let y = 180; y < H; y += 44) for (let x = (y / 44 % 2) * 22; x < W; x += 44) { g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); } };
  const fl = (g, col, line) => { g.fillStyle = col; g.fillRect(0, 1560, W, H - 1560); g.fillStyle = 'rgba(26,32,44,.08)'; g.fillRect(0, 1560, W, 6); g.fillStyle = line; for (let x = 0; x < W; x += 180) g.fillRect(x, 1566, 3, H); };
  const C = BRAND.clean;
  makeBg('light', g => { g.fillStyle = C.light; g.fillRect(0, 0, W, H); dots(g, C.dot); fl(g, C.floor, C.floorLine); header(g); });
  makeBg('light2', g => { g.fillStyle = C.light2; g.fillRect(0, 0, W, H); dots(g, C.dot); fl(g, C.floor2, C.floorLine); header(g); });
  makeBg('blush', g => { g.fillStyle = C.blush; g.fillRect(0, 0, W, H); dots(g, C.blushDot); fl(g, C.blushFloor, C.floorLine); header(g); });
  makeBg('blushPlain', g => { g.fillStyle = C.blush; g.fillRect(0, 0, W, H); dots(g, C.blushDot); header(g); });
  makeBg('lightPlain', g => { g.fillStyle = C.light; g.fillRect(0, 0, W, H); dots(g, C.dot); header(g); });
  makeBg('slate', g => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, C.slate1); gr.addColorStop(1, C.slate2); g.fillStyle = gr; g.fillRect(0, 0, W, H); dots(g, 'rgba(255,255,255,.05)'); header(g); });
  makeBg('white', g => { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); header(g); });
}
function bg(name) { ctx.drawImage(BG[(BRAND.bgMap && BRAND.bgMap[name]) || name], 0, 0); }

/* ---------- línea de tiempo ---------- */
const TL = window.TIMELINE;
const SC = TL.scenes;
const LEAD = .35, TAIL = 2.8, TR = .5;     // anticipación visual, cola final, duración de la cortinilla
const starts = SC.map((s, i) => i === 0 ? 0 : Math.max(SC[i - 1].e + .05, s.s - LEAD));
const TOTAL = Math.round((TL.words[TL.words.length - 1].e + TAIL) * FPS) / FPS;
const bounds = starts.map((s, i) => [s, i + 1 < starts.length ? starts[i + 1] : TOTAL]);
const sceneWords = SC.map((_, i) => TL.words.filter(w => w.scene === i));
/* cue('palabra', n): instante (local a la escena) en que se dice la n-ésima aparición de la palabra */
function makeCue(i) {
  return (word, n = 0) => {
    const k = norm(word); let c = 0;
    for (const w of sceneWords[i]) if (norm(w.w) === k) { if (c === n) return w.s - starts[i]; c++; }
    console.warn('cue no encontrado', SC[i].id, word); return 0;
  };
}
const CUES = SC.map((_, i) => makeCue(i));

/* ---------- subtítulos palabra a palabra ---------- */
const chunks = []; TL.words.forEach(w => { (chunks[w.chunk] = chunks[w.chunk] || []).push(w); });
function captions(t) {
  let ci = -1;
  for (let i = 0; i < chunks.length; i++) if (chunks[i][0].s - .04 <= t) ci = i;
  if (ci < 0) return;
  const ch = chunks[ci]; const last = ch[ch.length - 1];
  if (ci === chunks.length - 1 && t > last.e + 1.6) return;
  if (ci < chunks.length - 1 && t > last.e + 1.2) return;
  const size = 60, lh = 78, maxW = 900; font(size);
  const sp = ctx.measureText(' ').width;
  // reparto en líneas usando el bloque entero (así no salta al aparecer palabras)
  const L = [[]]; let lw = 0;
  ch.forEach(w => { const ww = ctx.measureText(w.w).width; if (lw > 0 && lw + sp + ww > maxW) { L.push([]); lw = 0; } L[L.length - 1].push({ ...w, ww }); lw += (lw > 0 ? sp : 0) + ww; });
  const vis = L.map(l => l.filter(w => w.s - .04 <= t)).filter(l => l.length);
  if (!vis.length) return;
  const widths = vis.map(l => l.reduce((a, w, i) => a + w.ww + (i ? sp : 0), 0));
  const bw = Math.max(...widths) + 44, bh = vis.length * lh + 22, y0 = 330;
  ctx.fillStyle = 'rgba(0,0,0,.22)'; rr(W / 2 - bw / 2 + 6, y0 + 8, bw, bh, 18); ctx.fill();
  ctx.fillStyle = '#fff'; rr(W / 2 - bw / 2, y0, bw, bh, 18); ctx.fill();
  vis.forEach((l, li) => {
    let x = W / 2 - widths[li] / 2; const y = y0 + 11 + lh * li + lh / 2 + 3;
    l.forEach(w => {
      const a = prog(t, w.s - .04, .12);
      ctx.globalAlpha = a; text(w.w, x, y + (1 - a) * 8, size, w.emph ? (BRAND.capEmph || BRAND.red) : (BRAND.capText || '#1E1E1E'), { align: 'left' });
      ctx.globalAlpha = 1; x += w.ww + sp;
    });
  });
}

/* ---------- cortinilla entre escenas (franjas que suben) ---------- */
function drawScene(i, t) { ctx.save(); SCENES[SC[i].id](t - starts[i], CUES[i], t); ctx.restore(); }
function renderFrame(t) {
  let i = 0; while (i + 1 < starts.length && t >= starts[i + 1]) i++;
  const b = starts[i], bn = i + 1 < starts.length ? starts[i + 1] : 1e9;
  let o = -1, n = -1, p = 0;
  if (i > 0 && t < b + TR / 2) { o = i - 1; n = i; p = (t - (b - TR / 2)) / TR; }
  else if (t > bn - TR / 2) { o = i; n = i + 1; p = (t - (bn - TR / 2)) / TR; }
  if (o < 0) drawScene(i, t);
  else {
    const bh = H * 1.1, top = H - eInOut(clamp(p)) * (H + bh);
    if (top > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, top); ctx.clip(); drawScene(o, t); ctx.restore(); }
    if (top + bh < H) { ctx.save(); ctx.beginPath(); ctx.rect(0, top + bh, W, H); ctx.clip(); drawScene(n, t); ctx.restore(); }
    const st = BRAND.stripes; let y = top;
    const band = [[st[0], 26], [st[1], 40], [st[2], bh - 132], [st[1], 40], [st[0], 26]];
    band.forEach(([c, hh]) => { ctx.fillStyle = c; ctx.fillRect(0, y, W, hh + 1); y += hh; });
  }
  if (SC[i].id !== BRAND.noBadgeScene || o >= 0) brandBadge();
  captions(t);
}
let logoImg;
function brandBadge() {
  if (!logoImg) return;
  if (BRAND.badge === 'header') { const h = 122, w = h * logoImg.width / logoImg.height; ctx.drawImage(logoImg, W / 2 - w / 2, 14, w, h); return; } const w = 330, h = w * logoImg.height / logoImg.width;
  ctx.fillStyle = 'rgba(252,248,245,.93)'; rr(W / 2 - w / 2 - 22, 168 - 6, w + 44, h + 12, 40); ctx.fill();
  ctx.save(); ctx.drawImage(logoImg, W / 2 - w / 2, 168, w, h); ctx.restore();
}

/* ---------- efectos de sonido (lista de eventos para mezclar luego) ---------- */
function getSfx() {
  const ev = [];
  starts.forEach((s, i) => { if (i > 0) ev.push([s - .22, 'whoosh']); });
  SC.forEach((s, i) => { const f = SFX[s.id]; if (f) f(CUES[i]).forEach(([lt, type]) => ev.push([starts[i] + lt, type])); });
  return ev.filter(e => e[0] >= 0 && e[0] < TOTAL).sort((a, b) => a[0] - b[0]);
}

window.renderAt = t => { ctx.clearRect(0, 0, W, H); renderFrame(t); return true; };
window.frameJPEG = t => { window.renderAt(t); return cv.toDataURL('image/jpeg', .92); };
window.getBounds = () => ({ total: TOTAL, scenes: bounds.map((b, i) => ({ id: SC[i].id, s: b[0], e: b[1] })) });
window.getSfx = getSfx;
window.ready = (async () => {
  const fonts = BRAND.fonts || [['Poppins', 'Poppins-Bold.ttf', 700], ['Poppins', 'Poppins-Medium.ttf', 500], ['Poppins', 'Poppins-Regular.ttf', 400]];
  for (const [f, u, wgt] of fonts) { const ff = new FontFace(f, `url(${u})`, { weight: String(wgt) }); await ff.load(); document.fonts.add(ff); }
  logoImg = new Image(); logoImg.src = BRAND.logo; await logoImg.decode();
  if (BRAND.style === 'clean') buildCleanBackgrounds(); else buildBackgrounds(); return true;
})();
