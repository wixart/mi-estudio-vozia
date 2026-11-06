/* ===================================================================
   ESCENAS · Jubilación 2027 · Asesoría Gama
   Cada escena recibe (lt = tiempo local en s, cue = función de sincronía con la voz)
   Zona útil de contenido: y 520–1560 (arriba van logo y subtítulos; abajo, la interfaz de la red social)
   =================================================================== */
const B = () => window.BRAND;
window.SCENES = {

  /* 1 · "En 2027 se acaba la transición. La edad de jubilación queda fija." */
  hook(lt, cue) {
    bg('cork');
    const tEnd = cue('2027') + .55;
    const yr = Math.min(2027, 2023 + Math.floor(prog(lt, .05, tEnd - .05) * 4.999));
    // contador de año (estilo marcador)
    at(540, 640, { s: pop(lt, 0, .45) }, () => {
      fillRR(-280, -95, 560, 190, 26, B().dark); ctx.strokeStyle = B().copper; ctx.lineWidth = 8; rr(-280, -95, 560, 190, 26); ctx.stroke();
      String(yr).split('').forEach((d, k) => {
        const x = -195 + k * 130; ctx.fillStyle = B().card; rr(x - 54, -70, 108, 140, 12); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x - 54, -2, 108, 4);
        text(d, x, 8, 112, B().dark);
      });
    });
    // hoja con el calendario de transición
    const rows = [['2023', '66 a. y 4 m.'], ['2024', '66 a. y 6 m.'], ['2025', '66 a. y 8 m.'], ['2026', '66 a. y 10 m.'], ['2027', '67 AÑOS']];
    at(540, 1180 + drop(lt, .15, .6), { r: rad(-1.5) }, () => {
      paper(-370, -380, 740, 770);
      text('EDAD ORDINARIA', 0, -290, 52, B().green);
      text('si no tienes carrera de cotización larga', 0, -235, 28, '#6B6B6B', { weight: 500 });
      rows.forEach(([y, a], k) => {
        const ap = prog(lt, .1 + k * (tEnd - .1) / 4.6, .25); if (ap <= 0) return;
        const yy = -150 + k * 92, last = k === 4;
        ctx.globalAlpha = ap;
        if (last) { ctx.fillStyle = 'rgba(210,69,47,.12)'; rr(-330, yy - 40, 660, 80, 12); ctx.fill(); }
        text(y, -300, yy + 3, 46, last ? B().red : '#333', { align: 'left' });
        text(a, 300, yy + 3, 46, last ? B().red : '#333', { align: 'right' });
        if (!last) { ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(-320, yy + 44, 640, 3); }
        ctx.globalAlpha = 1;
      });
    });
    stamp('EDAD FIJA', 560, 1515, lt, cue('fija') - .28, { rot: rad(-9), size: 78 });
  },

  /* 2 · "Si tienes 38 años y 6 meses cotizados o más, te jubilas a los 65. Si no llegas, a los 67." */
  edad(lt, cue) {
    bg('teal');
    const LINE = 1060, base = 1545;
    // línea de 38 años y 6 meses
    const lp = eOut(prog(lt, cue('38') - .2, .6));
    if (lp > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W * lp, H); ctx.clip(); dashed(0, LINE, W); ctx.restore(); }
    // grupo izquierdo: pila alta
    const nL = Math.round(lerp(0, 46, eOut(prog(lt, .1, cue('cotizados') + .3))));
    coins(380, base, nL, 140);
    person(200, 1560, .95, { shirt: B().green, wave: eOut(prog(lt, cue('65'), .4)) * .9, bob: -Math.abs(Math.sin(prog(lt, cue('65'), .6) * Math.PI)) * 30 });
    // grupo derecho: pila baja
    const nR = Math.round(lerp(0, 24, eOut(prog(lt, cue('llegas') - .7, .8))));
    coins(900, base, nR, 140);
    if (lt > cue('llegas') - .8) person(720, 1560, .95 * eBack(prog(lt, cue('llegas') - .8, .4)), { shirt: B().copper });
    at(745, LINE - 58, { s: pop(lt, cue('38') + .1) }, () => tag('38 AÑOS Y 6 MESES', 0, 0, 38));
    // tarjetas de edad
    const card = (x, num, col, t0) => at(x, 690, { s: pop(lt, t0) }, () => {
      fillRR(-180, -130, 360, 260, 26, B().card);
      ctx.fillStyle = col; rr(-180, -130, 360, 70, [26, 26, 0, 0]); ctx.fill();
      ctx.fillStyle = '#fff'; [-90, 90].forEach(x => { ctx.beginPath(); ctx.arc(x, -130, 12, 0, 7); ctx.fill(); });
      text('JUBILACIÓN', 0, -93, 34, '#fff');
      text(num, 0, 25, 120, col); text('AÑOS', 0, 98, 38, '#555');
    });
    card(290, '65', B().green, cue('65'));
    card(790, '67', B().copper, cue('67'));
  },

  /* 3 · requisitos generales */
  requisitos(lt, cue) {
    bg('wood');
    at(540, 990 + drop(lt, 0, .55), {}, () => {
      fillRR(-400, -460, 800, 900, 28, B().clip);
      paper(-365, -400, 730, 810, { pin: false });
      ctx.fillStyle = '#B8B8B8'; rr(-110, -490, 220, 90, 18); ctx.fill(); ctx.fillStyle = '#8E8E8E'; rr(-70, -470, 140, 30, 12); ctx.fill();
      text('REQUISITOS', 0, -315, 58, B().green);
      const rowsT = [['Alta o situación', 'asimilada al alta', 'alta'], ['Mínimo 15 años', 'cotizados', '15'], ['2 de ellos en los', 'últimos 15 años', '2']];
      rowsT.forEach(([a, b, w], k) => {
        const t0 = cue(w), y = -170 + k * 200, ap = prog(lt, t0 - .35, .3);
        ctx.globalAlpha = .25 + .75 * ap;
        ctx.strokeStyle = '#999'; ctx.lineWidth = 5; rr(-310, y - 42, 84, 84, 16); ctx.stroke();
        text(a, -190, y - 24, 46, '#222', { align: 'left' }); text(b, -190, y + 32, 40, '#555', { align: 'left', weight: 500 });
        ctx.globalAlpha = 1;
        check(-268, y, 52, prog(lt, t0, .4));
      });
    });
    // barra de los últimos 15 años
    const bp = prog(lt, cue('2') + .15, .4);
    if (bp > 0) at(540, 1525, { s: eBack(bp) }, () => {
      fillRR(-420, -40, 840, 80, 16, B().card);
      for (let k = 0; k < 15; k++) {
        const x = -400 + k * 53.3, on = (k === 8 || k === 9) && lt > cue('2') + .45 + (k - 8) * .2;
        ctx.fillStyle = on ? B().green : B().track; rr(x, -26, 47, 52, 6); ctx.fill();
      }
      text('ÚLTIMOS 15 AÑOS', 0, -64, 30, B().reqLabel);
    });
  },

  /* 4 · jubilación anticipada */
  anticipada(lt, cue) {
    bg('sage');
    // reloj que retrocede
    const sp = eInOut(prog(lt, cue('adelantarla') - .4, 1.6));
    at(540, 690, { s: pop(lt, 0) }, () => {
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.arc(10, 12, 165, 0, 7); ctx.fill();
      ctx.fillStyle = B().green; ctx.beginPath(); ctx.arc(0, 0, 165, 0, 7); ctx.fill();
      ctx.fillStyle = B().card; ctx.beginPath(); ctx.arc(0, 0, 140, 0, 7); ctx.fill();
      for (let k = 0; k < 12; k++) { ctx.save(); ctx.rotate(k * Math.PI / 6); ctx.fillStyle = '#555'; ctx.fillRect(-4, -128, 8, k % 3 ? 14 : 26); ctx.restore(); }
      ctx.lineCap = 'round'; ctx.strokeStyle = '#222';
      ctx.lineWidth = 12; ctx.save(); ctx.rotate(rad(60) - sp * Math.PI * 1.2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -70); ctx.stroke(); ctx.restore();
      ctx.lineWidth = 8; ctx.save(); ctx.rotate(-sp * Math.PI * 8); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -108); ctx.stroke(); ctx.restore();
      ctx.lineCap = 'butt'; ctx.fillStyle = B().red; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fill();
      // flecha circular hacia atrás
      if (sp > 0 && sp < 1) { ctx.strokeStyle = B().copper; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(0, 0, 200, -Math.PI / 2, -Math.PI / 2 - Math.PI * 1.3 * eOut(Math.min(1, sp * 2)), true); ctx.stroke(); }
    });
    const card = (y, num, title, sub, col, t0) => at(540, y, { s: pop(lt, t0) }, () => {
      fillRR(-420, -78, 840, 156, 22, B().card);
      ctx.fillStyle = col; rr(-420, -78, 210, 156, [22, 0, 0, 22]); ctx.fill();
      text(num, -315, -8, 76, '#fff'); text('AÑOS', -315, 50, 28, '#fff');
      text(title, -180, -22, 48, col, { align: 'left' }); text(sub, -180, 34, 32, '#555', { align: 'left', weight: 500 });
    });
    card(965, '−2', 'VOLUNTARIA', 'hasta 2 años antes', B().green, cue('voluntaria'));
    card(1150, '−4', 'INVOLUNTARIA', 'hasta 4 años · casos legales', B().copper, cue('involuntaria'));
    // la pensión se reduce
    const r0 = cue('reduce') - .5;
    if (lt > r0) {
      const n = Math.round(lerp(15, 7, eInOut(prog(lt, r0 + .5, .9))));
      at(0, 0, { a: prog(lt, r0, .25) }, () => {
        coins(330, 1545, n, 130);
        ctx.fillStyle = B().red; const ay = 1360 + eOut(prog(lt, r0 + .4, .5)) * 60;
        rr(498, ay, 36, 90, 8); ctx.fill(); ctx.beginPath(); ctx.moveTo(470, ay + 86); ctx.lineTo(562, ay + 86); ctx.lineTo(516, ay + 150); ctx.fill();
        at(330, 1545 - n * 13 - 60, {}, () => tag('PENSIÓN', 0, 0, 30, B().green));
      });
      at(780, 1420, { s: pop(lt, r0 + .2), r: rad(-4) }, () => { tag('COEFICIENTES', 0, -36, 34); tag('REDUCTORES', 0, 36, 34); });
    }
  },

  /* 5 · jubilación demorada */
  demorada(lt, cue) {
    bg('sky');
    const cloud = (x, y, s) => at(x, y, { s }, () => { ctx.fillStyle = B().cloud; [[0, 0, 60], [55, -20, 70], [120, 0, 55], [60, 15, 60]].forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(a, b, r, 0, 7); ctx.fill(); }); });
    cloud(140 + lt * 12, 1060, .7); cloud(820 - lt * 9, 1000, .55);
    // columnas que crecen
    const hs = [120, 180, 250, 320, 400];
    hs.forEach((h, k) => {
      const p = eBack(prog(lt, .1 + k * .14, .5)), x = 125 + k * 175, hh = h * p;
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x + 10, 1560 - hh + 10, 150, hh);
      ctx.fillStyle = k === 4 ? B().coin : B().column; ctx.fillRect(x, 1560 - hh, 150, hh);
      ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(x + 120, 1560 - hh, 30, hh);
      if (p > .5) coins(x + 75, 1560 - hh - 8, 2 + k, 110);
    });
    // flecha ascendente
    const ap = eOut(prog(lt, cue('incentivos') - .3, .7));
    if (ap > 0) { ctx.strokeStyle = B().green; ctx.lineWidth = 22; ctx.lineCap = 'round';
      const x0 = 150, y0 = 1380, x1 = lerp(x0, 820, ap), y1 = lerp(y0, 1060, ap);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.lineCap = 'butt';
      at(x1, y1, { r: Math.atan2(y1 - y0, x1 - x0) }, () => { ctx.fillStyle = B().green; ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(-24, -38); ctx.lineTo(-24, 38); ctx.fill(); }); }
    // tarjetas de incentivos
    const opt = (y, icon, title, sub, col, t0) => at(540, y + drop(lt, t0 - .2, .5), {}, () => {
      fillRR(-420, -60, 840, 120, 20, B().card);
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(-350, 0, 42, 0, 7); ctx.fill(); text(icon, -350, 4, 44, '#fff');
      text(title, -285, -16, 40, '#222', { align: 'left' }); text(sub, -285, 30, 30, '#666', { align: 'left', weight: 500 });
    });
    opt(580, '%', 'PORCENTAJE ADICIONAL', 'más pensión cada mes', B().green, cue('porcentaje'));
    opt(725, '€', 'CANTIDAD A TANTO ALZADO', 'un pago único', B().copper, cue('alzado'));
    opt(870, '+', 'FÓRMULA MIXTA', 'combina ambas', B().greenMid, cue('mixta'));
  },

  /* 6 · cálculo de la pensión */
  calculo(lt, cue) {
    bg('board');
    // calculadora
    at(540, 800 + drop(lt, 0, .5), { r: rad(2) }, () => {
      fillRR(-210, -280, 420, 560, 34, B().green);
      ctx.fillStyle = B().screen; rr(-170, -240, 340, 120, 14); ctx.fill();
      const showQ = lt < cue('base') - .1;
      const val = showQ ? (lt < .3 ? '0' : String(Math.floor(lt * 7919) % 9000 + 1000)) : 'BR × %';
      text(showQ && lt > .3 ? val + ',00 €' : val, 150, -178, showQ ? 50 : 56, B().dark, { align: 'right' });
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        const idx = r * 4 + c, act = Math.floor(lt * 6) % 16 === idx && lt < cue('base');
        ctx.fillStyle = act ? B().coin : (c === 3 ? B().copper : B().key); rr(-170 + c * 88, -90 + r * 88, 72, 72, 14); ctx.fill();
      }
    });
    at(790, 600, { s: pop(lt, .25), r: rad(8) }, () => bubble('¿?', 0, 0, { col: B().red, size: 56, tail: 'left' }));
    // fórmula
    at(540, 1175, { s: pop(lt, cue('base')) }, () => { fillRR(-380, -55, 760, 110, 20, B().green); text('BASE REGULADORA', 0, 4, 50, '#fff'); });
    at(540, 1260, { s: pop(lt, cue('anos') - .15) }, () => text('×', 0, 0, 70, '#fff'));
    at(540, 1345, { s: pop(lt, cue('anos')) }, () => { fillRR(-380, -55, 760, 110, 20, B().copper); text('% POR AÑOS COTIZADOS', 0, 4, 46, '#fff'); });
    // reforma gradual
    const rp = prog(lt, cue('reforma') - .45, .35);
    if (rp > 0) at(540, 1490, { s: eBack(rp) }, () => {
      fillRR(-420, -48, 840, 96, 48, B().card);
      ctx.fillStyle = B().red; rr(-410, -38, 170, 76, 38); ctx.fill(); text('2027', -325, 3, 40, '#fff');
      ctx.fillStyle = B().track; rr(-215, -14, 400, 28, 14); ctx.fill();
      ctx.fillStyle = B().green; rr(-215, -14, 400 * lerp(.15, .45, eInOut(prog(lt, cue('reforma'), 1.2))), 28, 14); ctx.fill();
      text('REFORMA', 300, 3, 34, B().green);
    });
  },

  /* 7 · aviso: cada caso es distinto */
  aviso(lt, cue) {
    bg('cream');
    at(540, 1040 + drop(lt, 0, .5), { r: rad(-2) }, () => {
      paper(-350, -440, 700, 880);
      ctx.fillStyle = B().green; rr(-350, -440, 700, 120, [10, 10, 0, 0]); ctx.fill();
      text('INFORME DE', 0, -404, 34, '#fff'); text('VIDA LABORAL', 0, -360, 44, '#fff');
      for (let k = 0; k < 8; k++) {
        const y = -260 + k * 80;
        ctx.fillStyle = 'rgba(0,0,0,.12)'; rr(-300, y, 150, 18, 9); ctx.fill(); rr(-120, y, 260 - (k * 37) % 120, 18, 9); ctx.fill(); rr(180, y, 110, 18, 9); ctx.fill();
      }
      const hp = prog(lt, cue('caso') - .1, .35);
      if (hp > 0) { ctx.fillStyle = B().highlight; rr(-320, 140 - 28, 640 * eOut(hp), 74, 10); ctx.fill(); text('TU CASO', 0, 150, 52, B().ink, {}); }
    });
    at(830, 640, { s: pop(lt, cue('excepciones') - .1), r: rad(10) }, () => tag('EXCEPCIONES', 0, 0, 38, B().red));
    // lupa: recorre el documento y se para en "TU CASO"
    const sweep = prog(lt, .3, Math.max(.5, cue('caso') - .5));
    const mx = lt < cue('caso') - .2 ? 540 + Math.sin(sweep * Math.PI * 2.2) * 220 : lerp(540 + Math.sin(2.2 * Math.PI) * 220, 560, eOut(prog(lt, cue('caso') - .2, .4)));
    const my = lt < cue('caso') - .2 ? lerp(820, 1140, sweep) : lerp(1140, 1190, eOut(prog(lt, cue('caso') - .2, .4)));
    at(mx, my, { s: pop(lt, .2) }, () => {
      ctx.save(); ctx.rotate(rad(40)); ctx.fillStyle = B().handle; rr(-24, 120, 48, 200, 18); ctx.fill(); ctx.restore();
      ctx.fillStyle = 'rgba(200,230,240,.25)'; ctx.beginPath(); ctx.arc(0, 0, 135, 0, 7); ctx.fill();
      ctx.strokeStyle = B().green; ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(0, 0, 135, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, 100, rad(200), rad(250)); ctx.stroke();
    });
  },

  /* 8 · cierre con llamada a la acción */
  cta(lt, cue) {
    bg('brand');
    // hojas decorativas
    const leaf = (x, y, r, s, sway) => at(x, y, { r: r + Math.sin(lt * 1.6 + sway) * .04, s }, () => {
      ctx.strokeStyle = B().leafStem; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -330); ctx.stroke();
      for (let k = 0; k < 6; k++) { const yy = -40 - k * 52, sd = k % 2 ? 1 : -1;
        ctx.save(); ctx.translate(0, yy); ctx.rotate(sd * .9); ctx.fillStyle = k % 2 ? B().leaf1 : B().leaf2;
        ctx.beginPath(); ctx.ellipse(0, -48, 26, 56, 0, 0, 7); ctx.fill(); ctx.restore(); }
    });
    const L = Object.assign({ logoY: 590, logoW: 900, b: [790, 935, 1080], title: 1260, c1: 1425, c2: 1540, foot: 1625, div: 0 }, B().ctaLayout || {});
    if (B().leaves !== false) { leaf(30, 420, rad(55), 1.1, 0); leaf(1060, 1700, rad(-125), 1.2, 2); leaf(1080, 260, rad(-70), .8, 1); }
    // logo
    at(540, L.logoY, { s: pop(lt, 0, .5) }, () => {
      const w = L.logoW, h = w * logoImg.height / logoImg.width;
      ctx.save(); ctx.drawImage(logoImg, -w / 2, -h / 2, w, h); ctx.restore();
    });
    // preguntas típicas
    bubble('¿A qué edad me jubilo?', 420, L.b[0], { col: B().green, size: 40, tail: 'left', r: rad(-3) }, pop(lt, .25));
    bubble('¿Cuánto cobraré?', 700, L.b[1], { col: B().copper, size: 40, tail: 'right', r: rad(3) }, pop(lt, .55));
    bubble('¿Me compensa adelantarla?', 470, L.b[2], { col: B().greenMid, size: 40, tail: 'left', r: rad(-2) }, pop(lt, .85));
    // título
    if (L.div) at(540, L.div, { a: prog(lt, .9, .4) }, () => { ctx.fillStyle = B().copper; rr(-110, -3, 220, 6, 3); ctx.fill(); });
    at(540, L.title, { a: prog(lt, 1, .4) }, () => { text('¿TIENES DUDAS SOBRE', 0, -36, 54, B().green); text('TU JUBILACIÓN?', 0, 32, 54, B().green); });
    // contacto
    const c0 = cue('escribenos') - .2;
    at(540, L.c1, { s: pop(lt, c0) }, () => { fillRR(-330, -48, 660, 96, 48, B().ctaBtn || B().green); text('asesoriagama.es', 0, 4, 44, '#fff'); });
    at(540, L.c2, { s: pop(lt, c0 + .25) }, () => { fillRR(-360, -44, 720, 88, 44, B().soft, false); text('info@asesoriagama.es', 0, 4, 40, B().green); });
    text('Guía orientativa · Bizkaia', 540, L.foot, 28, '#8A8A8A', { weight: 500 });
  }
};

/* efectos de sonido por escena: [instante local, tipo] */
window.SFX = {
  hook: c => [[0, 'pop'], [.3, 'tick'], [.55, 'tick'], [.8, 'tick'], [c('fija'), 'stamp']],
  edad: c => [[c('38') + .1, 'pop'], [c('65'), 'pop'], [c('67'), 'pop']],
  requisitos: c => [[c('alta'), 'ding'], [c('15'), 'ding'], [c('2'), 'ding']],
  anticipada: c => [[0, 'pop'], [c('voluntaria'), 'pop'], [c('involuntaria'), 'pop'], [c('reduce') - .3, 'down']],
  demorada: c => [[c('porcentaje') - .1, 'pop'], [c('alzado') - .1, 'pop'], [c('mixta') - .1, 'pop']],
  calculo: c => [[c('base'), 'pop'], [c('anos'), 'pop'], [c('reforma') - .4, 'pop']],
  aviso: c => [[c('excepciones'), 'pop'], [c('caso'), 'ding']],
  cta: c => [[0, 'pop'], [.25, 'pop'], [.55, 'pop'], [.85, 'pop'], [c('escribenos') - .2, 'ding']]
};
