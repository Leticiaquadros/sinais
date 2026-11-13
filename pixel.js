/* ============================================================
   SINAIS — pixel art
   Toda a arte do jogo é desenhada aqui, por código, em baixa
   resolução e ampliada com "image-rendering: pixelated".
   Unidade: 1 pixel de arte = 1% da largura do celular.
   ============================================================ */
window.Pixel = (function () {
  'use strict';

  // ---------- paleta ----------
  const C = {
    preto: '#0a0505', carvao: '#160c0c', vinho: '#3d0a0d', vinho2: '#5c1018',
    vermelho: '#b3121b', vermelhoVivo: '#e0242f', laranja: '#e85d04', laranjaClaro: '#f48c06',
    amarelo: '#f5b700', creme: '#f5ebe4', branco: '#fffaf5',
    // pele
    peleLuz: '#ebb08b', pele: '#cf8a66', peleSombra: '#a35f47', peleEscura: '#6f3b2e',
    unha: '#f3cdb6', contorno: '#24100e', bordaLuz: '#ff7b3a',
    // manga
    manga: '#2a0e11', mangaLuz: '#4a161b', mangaBorda: '#6b2026'
  };
  const PELE = [C.peleLuz, C.pele, C.peleSombra, C.peleEscura, C.unha, C.contorno, C.bordaLuz];

  // ---------- utilidades ----------
  function tela(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }

  // Desenha formas vetoriais em baixa resolução e transforma em pixel art:
  // sem antisserrilhado, cores presas à paleta e contorno de 1 pixel.
  function rasterizar(w, h, desenhar, o) {
    o = o || {};
    const c = tela(w, h), g = c.getContext('2d');
    desenhar(g);
    const img = g.getImageData(0, 0, w, h), d = img.data;
    const pal = (o.paleta || []).map(rgb);
    const lim = o.limiar != null ? o.limiar : 128;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < lim) { d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0; continue; }
      if (pal.length) {
        let best = 0, bd = 1e12;
        for (let k = 0; k < pal.length; k++) {
          const p = pal[k], dd = (p[0] - d[i]) ** 2 + (p[1] - d[i + 1]) ** 2 + (p[2] - d[i + 2]) ** 2;
          if (dd < bd) { bd = dd; best = k; }
        }
        d[i] = pal[best][0]; d[i + 1] = pal[best][1]; d[i + 2] = pal[best][2];
      }
      d[i + 3] = 255;
    }
    if (o.contorno) {
      const cc = rgb(o.contorno), a = new Uint8Array(w * h);
      for (let p = 0; p < w * h; p++) a[p] = d[p * 4 + 3] ? 1 : 0;
      // contornoAteY: não contorna abaixo dessa linha (para emendar com outra camada)
      const yMax = o.contornoAteY != null ? Math.min(h, o.contornoAteY) : h;
      for (let y = 0; y < yMax; y++) for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (a[p]) continue;
        if ((x > 0 && a[p - 1]) || (x < w - 1 && a[p + 1]) || (y > 0 && a[p - w]) || (y < h - 1 && a[p + w])) {
          const i = p * 4; d[i] = cc[0]; d[i + 1] = cc[1]; d[i + 2] = cc[2]; d[i + 3] = 255;
        }
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  // Junta várias camadas (canvases do mesmo tamanho), na ordem.
  function compor(w, h, camadas) {
    const c = tela(w, h), g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    camadas.forEach(l => l && g.drawImage(l, 0, 0));
    return c;
  }

  // Sprite a partir de linhas de texto. mapa: { 'a': '#cor', ... } ('.' = vazio)
  function sprite(linhas, mapa) {
    const h = linhas.length, w = Math.max.apply(null, linhas.map(l => l.length));
    const c = tela(w, h), g = c.getContext('2d');
    linhas.forEach((l, y) => {
      for (let x = 0; x < l.length; x++) {
        const cor = mapa[l[x]];
        if (cor) { g.fillStyle = cor; g.fillRect(x, y, 1, 1); }
      }
    });
    return c;
  }
  function carimbar(g, spr, x, y) { g.drawImage(spr, Math.round(x), Math.round(y)); }

  // Pontilhado ordenado (Bayer 4x4) entre cores de um degradê.
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function degrade(w, h, cores, tFn) {
    const c = tela(w, h), g = c.getContext('2d');
    const img = g.createImageData(w, h), d = img.data, pal = cores.map(rgb);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let t = Math.max(0, Math.min(0.9999, tFn(x, y))) * (pal.length - 1);
      const k = Math.floor(t), f = t - k;
      const lim = (BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
      const p = pal[f > lim ? Math.min(k + 1, pal.length - 1) : k];
      const i = (y * w + x) * 4;
      d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  // Ícone em SVG nítido a partir de linhas. '#' = cor atual; outras letras via mapa.
  function svg(linhas, mapa, extra) {
    mapa = mapa || {};
    const h = linhas.length, w = Math.max.apply(null, linhas.map(l => l.length));
    let s = `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" ${extra || ''}>`;
    linhas.forEach((l, y) => {
      let x = 0;
      while (x < l.length) {
        const ch = l[x];
        if (ch === '.' || ch === ' ') { x++; continue; }
        let n = 1;
        while (x + n < l.length && l[x + n] === ch) n++;
        const cor = ch === '#' ? 'currentColor' : (mapa[ch] || 'currentColor');
        const op = (mapa['op_' + ch] != null) ? ` opacity="${mapa['op_' + ch]}"` : '';
        s += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${cor}"${op}/>`;
        x += n;
      }
    });
    return s + '</svg>';
  }

  // ============================================================
  // MÃO (175 x 300; o celular ocupa x 35..135, y 0..216)
  // ============================================================
  const MW = 175, MH = 300, OX = 35;

  function maoTras() {
    // lado direito começa mais baixo: acima da base do polegar não aparece palma
    const palmaD = 'M20 300 C18 284 15 270 9 256 C3 242 -3 224 -7 204 C-10 184 -14 150 -14 112 L50 100 L101 176 C110 186 118 200 122 212 C125 224 124 238 119 250 C114 260 107 268 104 278 L103 300 Z';
    const palma = rasterizar(MW, MH, g => {
      g.translate(OX, 0);
      const p = new Path2D(palmaD);
      g.fillStyle = C.pele; g.fill(p);
      g.save(); g.clip(p);
      // lado do mindinho em sombra
      g.fillStyle = C.peleSombra;
      g.beginPath(); g.ellipse(-4, 240, 15, 70, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(16, 300, 18, 38, 0, 0, 7); g.fill();
      // sombra do celular sobre a palma
      g.fillStyle = C.peleSombra; g.fillRect(-2, 216, 104, 8);
      g.fillStyle = C.peleEscura; g.fillRect(-2, 216, 104, 3);
      // luz no monte do polegar
      g.fillStyle = C.peleLuz;
      g.beginPath(); g.ellipse(112, 204, 5, 24, -0.15, 0, 7); g.fill();
      // vinco da palma
      g.fillStyle = C.peleSombra;
      g.beginPath(); g.moveTo(26, 238); g.quadraticCurveTo(62, 252, 100, 236); g.lineTo(100, 238); g.quadraticCurveTo(62, 255, 26, 240); g.fill();
      g.restore();
      // luz de borda (fundo vermelho/laranja)
      g.save(); g.clip(p);
      g.strokeStyle = C.bordaLuz; g.lineWidth = 2.2; g.translate(-1.6, 0); g.stroke(p);
      g.restore();
    }, { paleta: PELE, contorno: C.contorno });

    const manga = rasterizar(MW, MH, g => {
      g.translate(OX, 0);
      const p = new Path2D('M2 300 L6 266 C40 258 80 256 112 262 L116 300 Z');
      g.fillStyle = C.manga; g.fill(p);
      g.save(); g.clip(p);
      g.fillStyle = C.mangaLuz; g.fillRect(-5, 262, 130, 5);
      g.fillStyle = C.mangaBorda; g.fillRect(-5, 260, 130, 2);
      g.fillStyle = C.mangaLuz;
      for (let x = 14; x < 110; x += 12) g.fillRect(x, 272, 1, 28);
      g.restore();
    }, { paleta: [C.manga, C.mangaLuz, C.mangaBorda], contorno: C.contorno });

    return compor(MW, MH, [palma, manga]);
  }

  function dedo(x0, y, h, xPonta) {
    return rasterizar(MW, MH, g => {
      g.translate(OX, 0);
      const w = xPonta - x0, r = h / 2;
      const p = new Path2D();
      p.roundRect(x0, y, w, h, r);
      g.fillStyle = C.pele; g.fill(p);
      g.save(); g.clip(p);
      g.fillStyle = C.peleSombra; g.fillRect(x0 - 2, y + h * 0.62, w + 4, h);
      g.fillStyle = C.peleLuz; g.fillRect(x0 + r * 0.6, y + 1.2, w - r * 1.4, 2.2);
      // dobra do dedo
      g.fillStyle = C.peleEscura; g.fillRect(x0 + w * 0.48, y + 2.5, 1.2, h - 5);
      // unha
      g.fillStyle = C.unha; g.fillRect(xPonta - 4.2, y + 3.2, 3.4, h - 6.6);
      g.fillStyle = C.peleSombra; g.fillRect(xPonta - 4.4, y + 3.2, 1, h - 6.6);
      g.restore();
    }, { paleta: PELE, contorno: C.contorno });
  }

  function maoFrente() {
    // pontas a x=2: ficam só sobre a moldura (a tela começa em x=3)
    const dedos = [
      dedo(-16, 153, 16, 1.6),  // mindinho
      dedo(-22, 135, 19, 2),    // anelar
      dedo(-24, 115, 20, 2),    // médio
      dedo(-21, 96, 19, 2)      // indicador
    ];
    // Polegar apoiado na lateral direita: ponta arredondada com unha,
    // dobra na articulação e base larga que se funde à palma (sem contorno embaixo).
    const polegar = rasterizar(MW, MH, g => {
      g.translate(OX, 0);
      const p = new Path2D(
        'M103 151 C107.5 151 110.5 154.5 110.8 160.5 C111 165 110.4 168.5 111 172 ' +
        'C113 178 116 184 117.6 191 C120 201 123 211 124.6 221 C126 232 125 245 122 256 ' +
        'L105 256 C102.5 242 101 228 100 214 C99 200 98 187 97.5 175 C97 164 97.6 151 103 151 Z');
      g.fillStyle = C.pele; g.fill(p);
      g.save(); g.clip(p);
      // sombra do lado de fora (direita) e sob a ponta
      g.fillStyle = C.peleSombra;
      g.beginPath(); g.ellipse(124, 216, 7, 46, -0.22, 0, 7); g.fill();
      g.beginPath(); g.ellipse(111.5, 164, 3, 9, 0, 0, 7); g.fill();
      // luz da tela do celular no lado de dentro (esquerda)
      g.strokeStyle = C.peleLuz; g.lineWidth = 2.6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(99.6, 178); g.quadraticCurveTo(100.6, 205, 103.5, 240); g.stroke();
      g.beginPath(); g.moveTo(104, 172); g.lineTo(107, 172); g.stroke();
      // dobra da articulação
      g.strokeStyle = C.peleEscura; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(100.5, 176.5); g.quadraticCurveTo(105, 178.5, 109.5, 176); g.stroke();
      g.strokeStyle = C.peleSombra;
      g.beginPath(); g.moveTo(101.5, 180); g.quadraticCurveTo(105, 181.5, 108.5, 179.5); g.stroke();
      // unha
      const unha = new Path2D(); unha.roundRect(99.2, 153.6, 7.4, 9.6, 2.6);
      g.fillStyle = C.unha; g.fill(unha);
      g.fillStyle = C.peleSombra; g.fillRect(99.6, 162.4, 6.6, 1.2);
      g.fillStyle = '#fff2e8'; g.fillRect(100.4, 155, 1.2, 4);
      g.restore();
      // luz de borda laranja (contraluz do fundo)
      g.save(); g.clip(p);
      g.strokeStyle = C.bordaLuz; g.lineWidth = 2; g.translate(-1.4, 0); g.stroke(p);
      g.restore();
    }, { paleta: PELE.concat(['#fff2e8']), contorno: C.contorno, contornoAteY: 228 });
    return compor(MW, MH, dedos.concat([polegar]));
  }

  // ============================================================
  // MOLDURA DO CELULAR (102 x 218; o celular ocupa x 1..101)
  // ============================================================
  function moldura() {
    return rasterizar(102, 218, g => {
      // botões laterais
      g.fillStyle = '#2a1818';
      g.fillRect(100, 46, 2, 16);           // power
      g.fillRect(0, 38, 2, 9);              // volume +
      g.fillRect(0, 50, 2, 9);              // volume -
      const corpo = new Path2D(); corpo.roundRect(1, 0, 100, 217, 13);
      g.fillStyle = '#140909'; g.fill(corpo);
      const aro = new Path2D(); aro.roundRect(2, 1, 98, 215, 12);
      g.strokeStyle = '#3a2424'; g.lineWidth = 1; g.stroke(aro);
      g.fillStyle = '#4e3030'; g.fillRect(14, 1, 30, 1); // brilho
      const tela_ = new Path2D(); tela_.roundRect(4, 3, 94, 211, 10);
      g.fillStyle = '#050303'; g.fill(tela_);
    }, { paleta: ['#140909', '#3a2424', '#4e3030', '#050303', '#2a1818'], contorno: '#000000' });
  }

  // Cantos em degrau para a tela (clip-path), raio r em unidades (cqw)
  function cantosPixel(r) {
    // off[j] = recuo horizontal da linha j (0 = linha da borda) num canto de raio r
    const off = [];
    for (let j = 0; j < r; j++) { const d = r - j - 0.5; off.push(Math.round(r - Math.sqrt(r * r - d * d))); }
    const u = v => `${v}cqw`, D = v => `calc(100% - ${v}cqw)`;
    const pts = [];
    for (let j = r - 1; j >= 0; j--) pts.push(`${u(off[j])} ${u(j + 1)}`, `${u(off[j])} ${u(j)}`);   // sup. esquerdo
    for (let j = 0; j < r; j++) pts.push(`${D(off[j])} ${u(j)}`, `${D(off[j])} ${u(j + 1)}`);       // sup. direito
    for (let j = r - 1; j >= 0; j--) pts.push(`${D(off[j])} ${D(j + 1)}`, `${D(off[j])} ${D(j)}`); // inf. direito
    for (let j = 0; j < r; j++) pts.push(`${u(off[j])} ${D(j)}`, `${u(off[j])} ${D(j + 1)}`);       // inf. esquerdo
    return `polygon(${pts.join(',')})`;
  }

  // ============================================================
  // FUNDOS (pontilhados)
  // ============================================================
  const BRILHO_PARTE = {
    0: ['#0a0505', '#1c0708', '#36090c'],
    1: ['#0a0505', '#2a1606', '#5a3608', '#8a5a08'],
    2: ['#0a0505', '#2a0e05', '#5c2208', '#8f3a06'],
    3: ['#0a0505', '#2a0507', '#5a0a10', '#8c0f18'],
    fim: ['#050202', '#1a0405', '#3a070a']
  };
  function fundoPalco(parte, w, h) {
    w = w || 200; h = h || 120;
    const cores = BRILHO_PARTE[parte] || BRILHO_PARTE[0];
    return degrade(w, h, cores, (x, y) => {
      const dx = (x - w / 2) / (w * 0.42), dy = (y - h * 0.58) / (h * 0.62);
      return Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)) * 1.05;
    });
  }

  function papelParede(tema) {
    const w = 47, h = 105;
    if (tema === 'claro') {
      const c = degrade(w, h, ['#f7c27a', '#ef9a4e', '#d4561d', '#9a2a0e', '#5a1206'], (x, y) => y / h);
      const g = c.getContext('2d');
      // sol se pondo
      g.fillStyle = '#ffe0a0';
      const sol = sprite(['..####..', '.######.', '########', '########', '.######.', '..####..'], { '#': '#ffe3a6' });
      carimbar(g, sol, 30, 60);
      // prédios em silhueta
      g.fillStyle = '#3a0c06';
      [[0, 82, 7], [7, 76, 6], [13, 86, 8], [21, 72, 5], [26, 80, 9], [35, 70, 6], [41, 84, 6]].forEach(([x, y, bw]) => g.fillRect(x, y, bw, h - y));
      g.fillStyle = '#f7c27a';
      [[2, 86], [9, 80], [9, 86], [15, 90], [23, 76], [23, 82], [28, 84], [37, 74], [37, 80], [43, 88]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
      return c;
    }
    const c = degrade(w, h, ['#3a0a0c', '#22060a', '#120305', '#060202'], (x, y) => {
      const dx = (x - w / 2) / w, dy = (y - h * 0.3) / h;
      return Math.min(1, Math.sqrt(dx * dx * 1.5 + dy * dy) * 1.9);
    });
    const g = c.getContext('2d');
    g.fillStyle = '#c98a8a';
    [[5, 8], [40, 12], [22, 4], [33, 30], [9, 40], [44, 52], [15, 66], [30, 90], [3, 96]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
    const lua = sprite(['.###.', '##...', '#....', '##...', '.###.'], { '#': '#f0d6d0' });
    carimbar(g, lua, 37, 46);
    return c;
  }

  // ============================================================
  // FOTO DO BUQUÊ (64 x 48)
  // ============================================================
  const ROSA = sprite([
    '..oooo..',
    '.oRrrRo.',
    'oRrddrRo',
    'oRdlRdro',
    'ordRdlRo',
    'oRrddrRo',
    '.oRrrRo.',
    '..oooo..'
  ], { o: '#3a0508', d: '#6e0a12', r: '#b3121b', R: '#d72a32', l: '#ff8080' });
  const ROSA2 = sprite([
    '..ooo..',
    '.oRrRo.',
    'oRddrRo',
    'ordlRro',
    'oRrddRo',
    '.oRrRo.',
    '..ooo..'
  ], { o: '#3a0508', d: '#6e0a12', r: '#b3121b', R: '#d72a32', l: '#ff8080' });
  const FOLHA = sprite([
    '...oo.',
    '.ooGGo',
    'oGGgGo',
    'ogGgo.',
    '.oo...'
  ], { o: '#10260f', g: '#2f5a36', G: '#4e8a4f' });
  const FOLHA_E = sprite([
    '.oo...',
    'oGGoo.',
    'oGgGGo',
    '.ogGgo',
    '...oo.'
  ], { o: '#10260f', g: '#2f5a36', G: '#4e8a4f' });
  const LACO = sprite([
    'oo.....oo',
    'oRRo.oRRo',
    'oRdRoRdRo',
    'oRRoooRRo',
    'oo.oRo.oo',
    '...oRo...',
    '..oR.Ro..',
    '..oo.oo..'
  ], { o: '#3a0508', R: '#e0242f', d: '#9e0f19' });
  const CARTAO = sprite([
    'oooooooooo',
    'owwwwwwwwo',
    'owwrr.rrwo',
    'owwrrrrrwo',
    'owwwrrrwwo',
    'owwwwrwwwo',
    'owwwwwwwwo',
    'oooooooooo'
  ], { o: '#5a3a30', w: '#fff3e8', r: '#e0242f' });

  function flores() {
    const w = 64, h = 48;
    const fundo = degrade(w, h, ['#3a1814', '#2a100d', '#1a0908', '#0e0505'], (x, y) => {
      const dx = (x - w * 0.5) / w, dy = (y - h * 0.45) / h;
      return Math.min(1, Math.sqrt(dx * dx + dy * dy) * 1.8);
    });
    const papel = rasterizar(w, h, g => {
      const p = new Path2D('M13 19 L51 19 L37 47 L27 47 Z');
      g.fillStyle = '#ddb382'; g.fill(p);
      g.save(); g.clip(p);
      g.fillStyle = '#b98a58'; g.beginPath(); g.moveTo(13, 19); g.lineTo(32, 19); g.lineTo(31, 47); g.lineTo(27, 47); g.fill();
      g.fillStyle = '#f0cf9e'; g.fillRect(40, 20, 2, 14);
      g.restore();
    }, { paleta: ['#ddb382', '#b98a58', '#f0cf9e'], contorno: '#3b2414' });
    const flor = tela(w, h), g = flor.getContext('2d');
    carimbar(g, FOLHA_E, 8, 15); carimbar(g, FOLHA, 50, 14);
    carimbar(g, FOLHA_E, 12, 7); carimbar(g, FOLHA, 46, 6);
    carimbar(g, FOLHA, 37, 3);
    [[15, 10, ROSA2], [22, 4, ROSA], [30, 1, ROSA], [38, 5, ROSA], [44, 11, ROSA2],
      [19, 12, ROSA], [27, 9, ROSA], [35, 11, ROSA], [24, 16, ROSA2], [32, 17, ROSA2]].forEach(([x, y, s]) => carimbar(g, s, x, y));
    carimbar(g, LACO, 27, 27);
    const card = tela(w, h); carimbar(card.getContext('2d'), CARTAO, 46, 33);
    return compor(w, h, [fundo, papel, flor, card]);
  }

  // ============================================================
  // MAPA (64 x 40) — t = 0..1: posição do ponto "dele" (ou null)
  // ============================================================
  const PIN = sprite([
    '.ooooo.',
    'orrrrro',
    'orrwrro',
    'orwwwro',
    'orrwrro',
    '.orrro.',
    '..oro..',
    '...o...'
  ], { o: '#4a050a', r: '#e0242f', w: '#ffffff' });
  const PONTO = sprite(['.www.', 'wkkkw', 'wkRkw', 'wkkkw', '.www.'], { w: '#ffffff', k: '#5a0a10', R: '#ff3b3b' });
  function mapa(t) {
    const w = 64, h = 40;
    const c = tela(w, h), g = c.getContext('2d');
    g.fillStyle = '#e9e0d3'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d8ccbb';
    [[2, 2, 10, 8], [20, 2, 16, 8], [44, 2, 18, 8], [2, 16, 10, 10], [44, 16, 8, 10], [2, 32, 10, 6], [20, 32, 16, 6], [44, 32, 18, 6]].forEach(r => g.fillRect.apply(g, r));
    g.fillStyle = '#b9d6a3'; g.fillRect(20, 16, 16, 10); g.fillRect(54, 16, 8, 10);
    g.fillStyle = '#ffffff';
    g.fillRect(0, 11, w, 3); g.fillRect(0, 28, w, 3); g.fillRect(14, 0, 3, h); g.fillRect(39, 0, 3, h);
    // avenida diagonal
    g.fillStyle = '#f2c46b';
    for (let x = 0; x < w; x++) { const y = Math.round(h - 2 - x * 0.62); g.fillRect(x, y, 1, 3); }
    // casa da Nat (destino)
    carimbar(g, PIN, 28, 12);
    if (t != null) {
      // trajeto dele: da borda inferior esquerda até o pino
      const x = Math.round(2 + (30 - 2) * t), y = Math.round(36 + (19 - 36) * t);
      g.fillStyle = 'rgba(224,36,47,.35)';
      for (let k = 0; k <= 1; k += 0.05) {
        const kx = Math.round(2 + (30 - 2) * k * t), ky = Math.round(36 + (19 - 36) * k * t);
        g.fillRect(kx, ky, 1, 1);
      }
      carimbar(g, PONTO, x - 2, y - 2);
    }
    return c;
  }

  // ============================================================
  // CÂMERA — roupa em cima da cama (94 x 120)
  // ============================================================
  function roupa() {
    const w = 94, h = 120;
    const cama = degrade(w, h, ['#6a1f2a', '#5a1822', '#4a121b'], (x, y) => (Math.sin(x * 0.35 + y * 0.12) + 1) / 2 * 0.6 + y / h * 0.4);
    const g0 = cama.getContext('2d');
    // travesseiro
    const trav = rasterizar(w, h, g => { const p = new Path2D(); p.roundRect(14, 4, 66, 20, 6); g.fillStyle = '#efe2d6'; g.fill(p); g.fillStyle = '#d4c2b2'; g.fillRect(14, 18, 66, 6); }, { paleta: ['#efe2d6', '#d4c2b2'], contorno: '#3a1a1a' });
    // vestido
    const vestido = rasterizar(w, h, g => {
      const p = new Path2D('M38 30 L44 30 L47 36 L50 30 L56 30 L58 44 L55 52 L68 92 L26 92 L39 52 L36 44 Z');
      g.fillStyle = C.laranja; g.fill(p);
      g.save(); g.clip(p);
      g.fillStyle = '#b84a03'; g.beginPath(); g.moveTo(26, 92); g.lineTo(40, 52); g.lineTo(44, 52); g.lineTo(36, 92); g.fill();
      g.fillStyle = '#ff8a3a'; g.fillRect(50, 34, 3, 16); g.fillRect(54, 60, 2, 26);
      g.fillStyle = '#7a2a02'; g.fillRect(38, 51, 18, 2);
      g.restore();
    }, { paleta: [C.laranja, '#b84a03', '#ff8a3a', '#7a2a02'], contorno: '#2a0a02' });
    // sandálias
    const sand = sprite([
      '.oooooo...oooooo.',
      'okkkkkko.okkkkkko',
      'okwkkkko.okkkwkko',
      '.oooooo...oooooo.'
    ], { o: '#0a0505', k: '#2a2020', w: '#8a7a70' });
    const s = tela(w, h); carimbar(s.getContext('2d'), sand, 39, 100);
    g0.imageSmoothingEnabled = false;
    return compor(w, h, [cama, trav, vestido, s]);
  }

  // ============================================================
  // CÂMERA — casa / porta trancada (94 x 150)
  // Pontos de busca em % (x, y, w, h) para os botões por cima.
  // ============================================================
  const CASA_PONTOS = {
    gancho: [5, 21, 28, 10],
    porta: [46, 11, 47, 66],
    mesa: [2, 45, 38, 11],
    gaveta: [2, 64, 40, 13]
  };
  function casa() {
    const w = 94, h = 150;
    const parede = degrade(w, h, ['#4a3530', '#3d2a26', '#2e1f1c'], (x, y) => y / (h * 0.75));
    const g = parede.getContext('2d');
    g.fillStyle = '#24140f'; g.fillRect(0, 112, w, h - 112);
    g.fillStyle = '#3a2219'; for (let x = 0; x < w; x += 10) g.fillRect(x, 112, 1, h - 112);
    g.fillStyle = '#1a0d0a'; g.fillRect(0, 111, w, 2);
    const porta = rasterizar(w, h, g2 => {
      g2.fillStyle = '#3a1f12'; g2.fillRect(44, 18, 42, 96);
      g2.fillStyle = '#6b3a22'; g2.fillRect(47, 21, 36, 92);
      g2.fillStyle = '#7d4528'; g2.fillRect(51, 26, 12, 34); g2.fillRect(67, 26, 12, 34); g2.fillRect(51, 66, 12, 40); g2.fillRect(67, 66, 12, 40);
      g2.fillStyle = '#5a3019'; g2.fillRect(51, 58, 12, 2); g2.fillRect(67, 58, 12, 2); g2.fillRect(51, 104, 12, 2); g2.fillRect(67, 104, 12, 2);
      g2.fillStyle = '#e0b040'; g2.fillRect(76, 68, 4, 3);
      g2.fillStyle = '#1a1a1a'; g2.fillRect(77, 74, 2, 3);
    }, { paleta: ['#3a1f12', '#6b3a22', '#7d4528', '#5a3019', '#e0b040', '#1a1a1a'], contorno: '#140a06' });
    const gancho = sprite([
      'oooooooooooooooooooo',
      'owwwwwwwwwwwwwwwwwwo',
      'oooooooooooooooooooo',
      '...k.....k.....k....',
      '...k.....k.....k....',
      '...kk....kk....kk...'
    ], { o: '#3a2418', w: '#8a6a4a', k: '#c8c0b0' });
    const mesa = rasterizar(w, h, g2 => {
      g2.fillStyle = '#5a3a26'; g2.fillRect(4, 76, 32, 4);
      g2.fillStyle = '#3e2618'; g2.fillRect(7, 80, 3, 32); g2.fillRect(30, 80, 3, 32);
      g2.fillStyle = '#b84a03'; g2.beginPath(); g2.ellipse(20, 74, 8, 3.5, 0, 0, 7); g2.fill();
      g2.fillStyle = '#7a2a02'; g2.fillRect(13, 73, 14, 1);
    }, { paleta: ['#5a3a26', '#3e2618', '#b84a03', '#7a2a02'], contorno: '#140a06' });
    const comoda = rasterizar(w, h, g2 => {
      g2.fillStyle = '#4e2e1c'; g2.fillRect(4, 98, 34, 15);
      g2.fillStyle = '#6a4028'; g2.fillRect(6, 100, 30, 5); g2.fillRect(6, 107, 30, 5);
      g2.fillStyle = '#c8a050'; g2.fillRect(20, 102, 2, 1); g2.fillRect(20, 109, 2, 1);
    }, { paleta: ['#4e2e1c', '#6a4028', '#c8a050'], contorno: '#140a06' });
    const camadas = tela(w, h); carimbar(camadas.getContext('2d'), gancho, 8, 36);
    return compor(w, h, [parede, porta, mesa, comoda, camadas]);
  }

  // ============================================================
  // ÍCONES (SVG nítido, cor = currentColor)
  // ============================================================
  const ICONES = {
    sinal(n) {
      const L = [];
      for (let y = 0; y < 6; y++) {
        let l = '';
        for (let b = 0; b < 4; b++) {
          const alt = 2 + b + (b === 3 ? 1 : 0);
          const ch = (6 - y) <= alt ? (b < n ? '#' : 'd') : '.';
          l += ch + (b < 3 ? '.' : '');
        }
        L.push(l);
      }
      return svg(L, { d: 'currentColor', op_d: 0.3 });
    },
    wifi(n) {
      const L = ['..aaaaa..', '.a.....a.', 'a..bbb..a', '..b...b..', '....c....'];
      return svg(L, { a: 'currentColor', b: 'currentColor', c: 'currentColor', op_a: n >= 3 ? 1 : 0.3, op_b: n >= 2 ? 1 : 0.3 });
    },
    bateria(p, carregando) {
      const cols = 9, cheio = Math.max(1, Math.round(cols * p / 100));
      const cor = carregando ? '#34c759' : (p <= 20 ? '#ff3b30' : 'currentColor');
      const L = ['###########.'];
      for (let y = 0; y < 3; y++) {
        let l = '#';
        for (let x = 0; x < cols; x++) l += x < cheio ? 'f' : '.';
        l += '##';
        L.push(l);
      }
      L.push('###########.');
      let s = svg(L, { f: cor });
      if (carregando) s = s.replace('</svg>', '<rect x="5" y="1" width="1" height="3" fill="#fff"/><rect x="4" y="2" width="3" height="1" fill="#fff"/></svg>');
      return s;
    },
    silencioso: (function () {
      const L = ['...##...', '..####..', '.######.', '.######.', '.######.', '########', '...##...', '........'].map(r => r.split(''));
      for (let i = 0; i < 8; i++) { if (i + 1 < 8) L[i][i + 1] = '.'; L[i][i] = '#'; }
      return svg(L.map(r => r.join('')));
    })(),
    lua: svg(['..###', '.##..', '##...', '##...', '##...', '.##..', '..###']),
    ticks: svg(['.....#..#', '#...#..#.', '.#.#..#..', '..#..#...']),
    cadeado: svg(['..###..', '.#...#.', '.#...#.', '#######', '###.###', '###.###', '#######']),
    voltar: svg(['...##', '..##.', '.##..', '##...', '.##..', '..##.', '...##']),
    video: svg(['######...', '#....#.##', '#....####', '#....#.##', '######...']),
    fone: svg(['###.....', '###.....', '##......', '##......', '.##.....', '..###...', '...#####', '....####']),
    enviar: svg(['#......', '###....', '#####..', '#######', '#####..', '###....', '#......']),
    mais: svg(['..#..', '..#..', '#####', '..#..', '..#..']),
    unica: svg(['..###..', '.#...#.', '#..#..#', '#.##..#', '#..#..#', '.#.#.#.', '..###..']),
    coracao: svg(['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...']),
    alerta: svg(['....#....', '...###...', '...#.#...', '..##.##..', '..#.#.#..', '.##.#.##.', '.#.....#.', '##..#..##', '#########']),
    pin: svg(['.#####.', '##...##', '#..#..#', '##...##', '.##.##.', '..###..', '...#...']),
    camera: svg(['..###....', '#########', '#..###..#', '#.#...#.#', '#.#...#.#', '#..###..#', '#########']),
    relogio: svg(['.#####.', '#..#..#', '#..#..#', '#..###.', '#.....#', '#.....#', '.#####.']),
    desligar: svg(['.#######.', '##.....##', '#.......#', '##.....##']),
    mudo: svg(['...#...#', '..##..#.', '####.#..', '####....', '####.#..', '..##..#.', '...#...#']),
    teclado: svg(['#.#.#', '.....', '#.#.#', '.....', '#.#.#', '.....', '..#..']),
    vivavoz: svg(['...#.#..', '..##..#.', '####.#.#', '####.#.#', '####.#.#', '..##..#.', '...#.#..']),
    tela: svg(['##...##', '#.....#', '.......', '.......', '#.....#', '##...##']),
    som: svg(['...#....', '..##.#..', '####..#.', '####..#.', '####..#.', '..##.#..', '...#....']),
    semSom: svg(['...#....', '..##....', '####.#.#', '####..#.', '####.#.#', '..##....', '...#....']),
    check: svg(['.....#', '....##', '#..##.', '####..', '.##...']),
    xis: svg(['#...#', '.#.#.', '..#..', '.#.#.', '#...#']),
    seta: svg(['#...', '##..', '###.', '####', '###.', '##..', '#...']),
    pessoa: svg(['..###..', '.#####.', '.#####.', '..###..', '.......', '.#####.', '#######', '#######'])
  };

  // Barras de sinal grandes (título / partes): n acesas de 4
  function barrasSinal(n, cor) {
    const L = [];
    for (let y = 0; y < 8; y++) {
      let l = '';
      for (let b = 0; b < 4; b++) {
        const alt = 2 * (b + 1);
        const ch = (8 - y) <= alt ? (b < n ? 'a' : 'd') : '.';
        l += ch + ch + (b < 3 ? '.' : '');
      }
      L.push(l);
    }
    return svg(L, { a: cor, d: cor, op_d: 0.22 });
  }

  function comoURL(c) { return c.toDataURL('image/png'); }

  return {
    C, rasterizar, compor, sprite, degrade, svg, tela,
    maoTras, maoFrente, moldura, cantosPixel, fundoPalco, papelParede,
    flores, mapa, roupa, casa, CASA_PONTOS, ICONES, barrasSinal, comoURL
  };
})();
