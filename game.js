/* ============================================================
   SINAIS — motor do jogo
   (Os textos ficam em roteiro.js; a arte em pixel.js.)

   Parâmetros de URL úteis para ensaiar/testar:
     ?cena=7      começa direto na cena 7 (9.2 = cena 9, parte 2)
     ?teste=1     joga sozinho, rápido, e mostra um log no canto
     &opcao=1|2   no teste, escolhe sempre a opção 1 ou 2 (padrão: alterna)
     &vel=0.5     multiplica os tempos (0.5 = metade do tempo)
     ?foto=1      desliga animações (para capturas de tela)
   Teclas: 1/2 escolhem, Espaço/Enter continuam, F tela cheia, M som.
   ============================================================ */
(function () {
  'use strict';

  const R = window.ROTEIRO, P = window.Pixel, I = P.ICONES;
  const $ = (s, raiz) => (raiz || document).querySelector(s);

  const params = new URLSearchParams(location.search);
  const TESTE = params.has('teste');
  if (params.has('foto')) document.documentElement.classList.add('foto');
  const OPCAO_TESTE = params.get('opcao') || 'alt';
  const AUTO = parseInt(params.get('auto'), 10) || 250; // teste: espera antes de cada toque automático
  const VEL_URL = parseFloat(params.get('vel'));
  const VEL_ROTEIRO = (R.config && R.config.velocidade) > 0 ? R.config.velocidade : 1;
  const BASE = VEL_URL > 0 ? VEL_URL : (TESTE ? 0.25 : 1);
  const FATOR = BASE / VEL_ROTEIRO; // tempos normais
  const FATOR_FIXO = BASE;          // tempos fixos (alerta vermelho de 10 s)

  // ---------- log / erros ----------
  const logEl = $('#log');
  function log(msg) { if (logEl) logEl.textContent += (TESTE ? Math.round(performance.now()) + 'ms ' : '') + msg + '\n'; }
  if (TESTE) logEl.hidden = false;
  function registrarErro(msg) {
    document.body.dataset.erro = '1';
    log('ERRO: ' + msg);
    if (TESTE) logEl.hidden = false;
    console.error(msg);
  }
  window.addEventListener('error', e => registrarErro(e.message + ' (linha ' + e.lineno + ')'));
  window.addEventListener('unhandledrejection', e => registrarErro('promise: ' + (e.reason && e.reason.stack || e.reason)));

  // ---------- elementos ----------
  const el = {
    fundo: $('#fundo'), screen: $('#screen'), vibra: $('#vibra'),
    sbHora: $('#sb-hora'), sbSom: $('#sb-som'), sbSinal: $('#sb-sinal'), sbRede: $('#sb-rede'),
    sbWifi: $('#sb-wifi'), sbBatPct: $('#sb-bat-pct'), sbBat: $('#sb-bat'),
    vBloqueio: $('#v-bloqueio'), lkHora: $('#lk-hora'), lkNotif: $('#lk-notif'),
    lkNome: $('#lk-n-nome'), lkTexto: $('#lk-n-texto'),
    lsItens: $('#ls-itens'), lsDica: $('#ls-dica'),
    chAvatar: $('#ch-avatar'), chNome: $('#ch-nome'), chEstado: $('#ch-estado'),
    faixa: $('#faixa'), msgs: $('#msgs'),
    escolhas: $('#escolhas'), acao: $('#acao'), mais: $('#mais'), campo: $('#campo'), enviar: $('#enviar'),
    camTitulo: $('#cam-titulo'), camQuadro: $('#cam-quadro'), camImg: $('#cam-img'), camPontos: $('#cam-pontos'),
    camFlash: $('#cam-flash'), camDica: $('#cam-dica'), camDisparar: $('#cam-disparar'), camEnviar: $('#cam-enviar'),
    tcVisor: $('#tc-visor'), tcDica: $('#tc-dica'), tcTeclas: $('#tc-teclas'), tcLigar: $('#tc-ligar'),
    clStatus: $('#cl-status'), clNumero: $('#cl-numero'), clNome: $('#cl-nome'),
    sobre: $('#sobre'), ov: $('#ov'),
    placar: $('#placar'), plIc: $('#pl-ic'), plNum: $('#pl-num'),
    btnTela: $('#btn-tela'), btnSom: $('#btn-som')
  };

  const estado = { status: null, hora: '00:00', contato: '', ultimoLado: null, escolhas: [], aoVivo: null };
  // Sinais: da cena atual e acumulados por tipo de violência
  const SIN = { cena: [], total: 0, marcados: 0, tipos: {} };

  // ============================================================
  // TEMPO, TOQUES E TECLAS
  // ============================================================
  let pularAtual = null;
  let teclaAtual = null;

  function esperar(ms, opts) {
    opts = opts || {};
    const fator = opts.fixo ? FATOR_FIXO : FATOR;
    return new Promise(resolve => {
      let feito = false;
      const fim = () => {
        if (feito) return;
        feito = true; clearTimeout(t);
        if (pularAtual === fim) pularAtual = null;
        resolve();
      };
      const t = setTimeout(fim, Math.max(0, ms * fator));
      if (opts.pulavel !== false && !opts.fixo) pularAtual = fim;
    });
  }
  function pular() { if (pularAtual) pularAtual(); }

  // Espera um toque em `alvo` (ou Espaço/Enter). opts.tempo = avança sozinho após X ms.
  function esperarToque(alvo, opts) {
    opts = opts || {};
    const teclas = opts.teclas || [' ', 'Enter'];
    return new Promise(resolve => {
      let feito = false, timer = null;
      const fim = () => {
        if (feito) return;
        feito = true; clearTimeout(timer);
        alvo.removeEventListener('click', clique);
        if (teclaAtual === tecla) teclaAtual = null;
        resolve();
      };
      const clique = e => { e.stopPropagation(); fim(); };
      const tecla = e => { if (teclas.indexOf(e.key) >= 0) { fim(); return true; } return false; };
      alvo.addEventListener('click', clique);
      teclaAtual = tecla;
      if (opts.tempo) timer = setTimeout(fim, opts.tempo * FATOR);
      if (TESTE) setTimeout(fim, opts.autoTeste != null ? opts.autoTeste : AUTO);
    });
  }

  document.addEventListener('keydown', e => {
    if (e.repeat) return;
    if (teclaAtual && teclaAtual(e)) { e.preventDefault(); return; }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pular(); return; }
    if (e.key === 'f' || e.key === 'F') alternarTelaCheia();
    if (e.key === 'm' || e.key === 'M') alternarSom();
  });

  // ---------- texto seguro ----------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const negrito = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const minutos = h => { const p = String(h).split(':'); return (+p[0]) * 60 + (+p[1] || 0); };
  const botao = (txt, id, cls) => `<button type="button" class="btn pxo ${cls || ''}" id="${id}"><span class="px">${txt}</span></button>`;

  // ============================================================
  // SOM (WebAudio — nenhum arquivo de áudio)
  // ============================================================
  const Som = {
    ctx: null, saida: null, mudo: false, loops: {},
    iniciar() {
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
          this.saida = this.ctx.createGain();
          this.saida.gain.value = this.mudo ? 0 : 0.7;
          this.saida.connect(this.ctx.destination);
          const b = this.ctx.createBuffer(1, 1, 22050), s = this.ctx.createBufferSource();
          s.buffer = b; s.connect(this.ctx.destination); s.start(0);
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
      } catch (e) { this.ctx = null; }
    },
    setMudo(m) {
      this.mudo = m;
      if (this.saida) this.saida.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.05);
    },
    tom(freq, dur, o) {
      o = o || {};
      if (!this.ctx || this.mudo || TESTE) return;
      const c = this.ctx, t0 = c.currentTime + (o.atraso || 0);
      const osc = c.createOscillator(), g = c.createGain();
      osc.type = o.tipo || 'square';
      osc.frequency.setValueAtTime(freq, t0);
      if (o.ate) osc.frequency.exponentialRampToValueAtTime(o.ate, t0 + dur);
      const vol = o.vol != null ? o.vol : 0.08;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + (o.ataque || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(this.saida);
      osc.start(t0); osc.stop(t0 + dur + 0.05);
    },
    ruido(dur, vol) {
      if (!this.ctx || this.mudo || TESTE) return;
      const c = this.ctx, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = c.createBufferSource(), g = c.createGain();
      s.buffer = b; g.gain.value = vol || 0.15;
      s.connect(g); g.connect(this.saida); s.start();
    },
    notificacao() { this.tom(988, 0.12, { vol: 0.07 }); this.tom(1319, 0.2, { vol: 0.06, atraso: 0.1 }); },
    recebida() { this.tom(784, 0.06, { vol: 0.04 }); this.tom(1046, 0.08, { vol: 0.035, atraso: 0.06 }); },
    enviada() { this.tom(420, 0.1, { vol: 0.04, ate: 840 }); },
    clique() { this.tom(660, 0.03, { vol: 0.03 }); },
    blip() { this.tom(520 + Math.random() * 80, 0.025, { vol: 0.018 }); },
    sinal() { this.tom(660, 0.07, { vol: 0.06 }); this.tom(990, 0.12, { vol: 0.06, atraso: 0.07 }); },
    erro() { this.tom(150, 0.09, { vol: 0.05 }); },
    obturador() { this.ruido(0.07, 0.25); this.tom(1800, 0.03, { vol: 0.04, atraso: 0.05 }); },
    porta() { [0, 0.09, 0.18].forEach(a => this.tom(90, 0.06, { vol: 0.12, atraso: a })); },
    vibracao() {
      this.tom(110, 0.16, { vol: 0.03, tipo: 'sawtooth' });
      this.tom(110, 0.16, { vol: 0.03, tipo: 'sawtooth', atraso: 0.24 });
    },
    dtmf(d) {
      const L = { 1: 697, 2: 697, 3: 697, 4: 770, 5: 770, 6: 770, 7: 852, 8: 852, 9: 852, '*': 941, 0: 941, '#': 941 };
      const C = { 1: 1209, 4: 1209, 7: 1209, '*': 1209, 2: 1336, 5: 1336, 8: 1336, 0: 1336, 3: 1477, 6: 1477, 9: 1477, '#': 1477 };
      this.tom(L[d], 0.16, { vol: 0.06, tipo: 'sine' }); this.tom(C[d], 0.16, { vol: 0.06, tipo: 'sine' });
    },
    chamada() {
      this.pararChamada();
      const tocar = () => this.tom(425, 1.0, { vol: 0.08, tipo: 'sine', ataque: 0.02 });
      tocar();
      this.loops.chamada = setInterval(tocar, 3000);
    },
    pararChamada() { clearInterval(this.loops.chamada); },
    coracao() {
      this.pararCoracao();
      const bater = () => { this.tom(90, 0.16, { vol: 0.4, tipo: 'sine' }); this.tom(80, 0.2, { vol: 0.3, tipo: 'sine', atraso: 0.24 }); };
      bater();
      this.loops.coracao = setInterval(bater, 1000);
    },
    pararCoracao() { clearInterval(this.loops.coracao); }
  };
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(t =>
    document.addEventListener(t, () => Som.iniciar(), { capture: true, passive: true }));

  const toqueTela = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  function vibrar() {
    el.vibra.classList.remove('vibrando'); void el.vibra.offsetWidth; el.vibra.classList.add('vibrando');
    Som.vibracao();
    if (!Som.mudo && toqueTela && navigator.vibrate) { try { navigator.vibrate([110, 70, 110]); } catch (e) { /* sem suporte */ } }
  }
  // Tela de bloqueio: vibra uma vez (som conforme o modo do celular)
  function avisoBloqueio() {
    const som = estado.status && estado.status.som;
    if (som === 'naoPerturbe') return;
    if (som === 'normal') Som.notificacao();
    vibrar();
  }
  // Dentro do chat: só um som baixinho, e só se o celular estiver com som
  function avisoChat() {
    if (estado.status && estado.status.som === 'normal') Som.recebida();
  }

  // ---------- tela cheia / mudo ----------
  const fsOk = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  if (!fsOk) el.btnTela.hidden = true;
  function alternarTelaCheia() {
    if (!fsOk) return;
    const d = document;
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else { const r = d.documentElement; (r.requestFullscreen || r.webkitRequestFullscreen).call(r); }
    } catch (e) { /* ignorado */ }
  }
  function alternarSom() {
    Som.setMudo(!Som.mudo);
    el.btnSom.classList.toggle('mudo', Som.mudo);
    el.btnSom.setAttribute('aria-label', Som.mudo ? 'Som desligado' : 'Som ligado');
    try { localStorage.setItem('sinais-mudo', Som.mudo ? '1' : '0'); } catch (e) { /* sem storage */ }
  }
  el.btnTela.addEventListener('click', e => { e.stopPropagation(); e.currentTarget.blur(); alternarTelaCheia(); });
  el.btnSom.addEventListener('click', e => { e.stopPropagation(); e.currentTarget.blur(); alternarSom(); });
  try { if (localStorage.getItem('sinais-mudo') === '1') alternarSom(); } catch (e) { /* sem storage */ }

  // ============================================================
  // ARTE
  // ============================================================
  function desenharEm(cv, src) {
    cv.width = src.width; cv.height = src.height;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0);
  }
  let papeis = {};
  function montarArte() {
    document.querySelectorAll('[data-ic]').forEach(e => { const k = e.dataset.ic; if (I[k]) e.innerHTML = I[k]; });
    el.plIc.innerHTML = I.alerta;
    desenharEm($('#mao-tras'), P.maoTras());
    desenharEm($('#mao-frente'), P.maoFrente());
    desenharEm($('#moldura'), P.moldura());
    el.screen.style.setProperty('--cantos', P.cantosPixel(10));
    papeis = { claro: P.comoURL(P.papelParede('claro')), escuro: P.comoURL(P.papelParede('escuro')) };
    pintarFundo(0);
  }
  function pintarFundo(parte) { desenharEm(el.fundo, P.fundoPalco(parte, 200, 120)); }

  // ============================================================
  // CELULAR: STATUS, TEMA, TELAS
  // ============================================================
  function aplicarStatus(st) {
    const s = estado.status = Object.assign({ hora: '12:00', som: 'normal', wifi: 3, rede: '', sinal: 4, bateria: 50, carregando: false }, st);
    el.sbSom.innerHTML = s.som === 'silencioso' ? I.silencioso : s.som === 'naoPerturbe' ? I.lua : '';
    el.sbSinal.innerHTML = I.sinal(s.sinal);
    el.sbRede.textContent = s.rede || '';
    el.sbWifi.innerHTML = s.wifi > 0 ? I.wifi(s.wifi) : '';
    mostrarBateria(s.bateria, s.carregando);
    definirHora(s.hora);
  }
  function mostrarBateria(b, carregando) { el.sbBatPct.textContent = b + '%'; el.sbBat.innerHTML = I.bateria(b, carregando); }
  function definirHora(h) { estado.hora = h; el.sbHora.textContent = h; el.lkHora.textContent = h; }
  function temaPorHora(h) { const m = minutos(h); return (m >= 6 * 60 && m < 18 * 60) ? 'claro' : 'escuro'; }
  function aplicarTema(c) {
    const tema = (c.tema && c.tema !== 'auto') ? c.tema : temaPorHora(c.status.hora);
    el.screen.dataset.tema = tema;
    el.vBloqueio.style.backgroundImage = `url(${papeis[tema]})`;
  }
  function mostrarView(v) { el.screen.dataset.view = v; if (TESTE) log('tela ' + v); }
  function definirParte(n) {
    document.body.className = document.body.className.replace(/\bparte-\S+/g, '').trim();
    document.body.classList.add('parte-' + n);
    pintarFundo(n);
  }

  function prepararCena(c) {
    aplicarStatus(c.status);
    aplicarTema(c);
    prepararChat(c.contato || 'Amor');
    el.lkNotif.hidden = true;
    mostrarView('bloqueio');
  }

  // ---------- conversa ----------
  const AVATAR_COR = { 'Amor': '#9b1c1c', 'Mãe': '#b4530f', 'Nat': '#6b2d5c' };
  const avatarHTML = nome => nome === 'Amor' ? I.coracao : esc(String(nome).charAt(0));

  function prepararChat(contato) {
    estado.contato = contato;
    estado.ultimoLado = null;
    estado.aoVivo = null;
    pararCronometro();
    el.chNome.textContent = contato;
    el.chAvatar.innerHTML = avatarHTML(contato);
    el.chAvatar.className = 'avatar px';
    el.chAvatar.style.setProperty('--av', AVATAR_COR[contato] || '#7a2a1a');
    el.chEstado.textContent = 'online';
    el.chEstado.classList.remove('digitando');
    el.msgs.innerHTML = '<div class="espaco"></div><div class="chip px">Hoje</div>';
    el.faixa.hidden = true; el.faixa.innerHTML = '';
    el.escolhas.hidden = true; el.escolhas.innerHTML = '';
    esconderAcao();
    el.sobre.hidden = true; el.sobre.innerHTML = '';
    el.mais.classList.remove('pulsar');
    limparCampo();
  }
  function rolar() { el.msgs.scrollTo({ top: el.msgs.scrollHeight, behavior: TESTE ? 'auto' : 'smooth' }); }
  function mostrarAcao(html) { el.acao.innerHTML = html; el.acao.hidden = false; requestAnimationFrame(rolar); }
  function esconderAcao() { el.acao.hidden = true; el.acao.innerHTML = ''; }

  function adicionarBolha(p, hora) {
    const lado = p.de === 'vitima' ? 'out' : 'in';
    const div = document.createElement('div');
    div.className = 'msg pxo ' + lado + (estado.ultimoLado && estado.ultimoLado !== lado ? ' troca' : '');
    const b = document.createElement('div');
    b.className = 'bolha px';
    if (p.tipo === 'fotoUnica') {
      b.innerHTML = `<span class="foto-unica">${I.unica}<span class="fu-txt">Foto</span></span>`;
    } else if (p.tipo === 'fotoFlores') {
      b.classList.add('midia'); b.appendChild(P.flores());
      b.firstChild.setAttribute('aria-label', 'Foto de um buquê de flores');
    } else if (p.tipo === 'localizacao') {
      b.classList.add('midia', 'local'); b.appendChild(P.mapa(null));
      b.insertAdjacentHTML('beforeend', '<span class="local-legenda">Localização atual</span>');
    } else {
      b.textContent = p.texto;
    }
    b.insertAdjacentHTML('beforeend', `<span class="meta">${esc(hora)}${lado === 'out' ? I.ticks : ''}</span>`);
    div.appendChild(b);
    el.msgs.appendChild(div);
    estado.ultimoLado = lado;
    if (p.tipo === 'fotoUnica' && !p.abrir) {
      setTimeout(() => abrirFotoUnica(div), 2600 * FATOR);
    }
    registrarSinal(div, p);
    rolar();
    return div;
  }
  function abrirFotoUnica(div) {
    const f = div.querySelector('.foto-unica');
    if (f) { f.classList.add('aberta'); f.querySelector('.fu-txt').textContent = 'Aberta'; const d = f.querySelector('.abrir-dica'); if (d) d.remove(); }
  }
  function adicionarChip(t) {
    const d = document.createElement('div');
    d.className = 'chip px'; d.textContent = t;
    el.msgs.appendChild(d);
    estado.ultimoLado = null;
    rolar();
  }
  function mostrarDigitando(on) {
    el.chEstado.textContent = on ? 'digitando…' : 'online';
    el.chEstado.classList.toggle('digitando', on);
    let d = el.msgs.querySelector('.msg.digitando');
    if (on && !d) {
      d = document.createElement('div');
      d.className = 'msg pxo in digitando' + (estado.ultimoLado === 'out' ? ' troca' : '');
      d.innerHTML = '<div class="bolha px"><span class="pontos"><span></span><span></span><span></span></span></div>';
      el.msgs.appendChild(d);
      rolar();
    }
    if (!on && d) d.remove();
  }

  // ============================================================
  // SINAIS
  // ============================================================
  function registrarSinal(div, p) {
    if (!p.sinal) return;
    const tipo = p.violencia || 'psicológica';
    const s = { nome: p.sinal, violencia: tipo, marcado: false };
    div._sinal = s;
    SIN.cena.push(s);
    SIN.total++;
    (SIN.tipos[tipo] = SIN.tipos[tipo] || { total: 0, marcados: 0 }).total++;
    if (TESTE && SIN.total % 3 !== 0) setTimeout(() => marcar(div), 60);
  }
  function marcar(m) {
    const s = m._sinal;
    if (!s || s.marcado) return;
    s.marcado = true;
    SIN.marcados++;
    SIN.tipos[s.violencia].marcados++;
    const perto = el.msgs.scrollHeight - el.msgs.scrollTop - el.msgs.clientHeight < 60;
    m.classList.add('marcada');
    const etq = document.createElement('div');
    etq.className = 'etiqueta px';
    etq.innerHTML = I.alerta + '<span>' + esc(s.nome) + '</span>';
    m.appendChild(etq);
    atualizarPlacar(true);
    Som.sinal();
    if (perto) rolar();
  }
  function errou(m) {
    m.classList.remove('errou'); void m.offsetWidth; m.classList.add('errou');
    Som.erro();
  }
  function atualizarPlacar(pulo) {
    el.plNum.textContent = SIN.marcados;
    if (pulo) { el.placar.classList.remove('pulo'); void el.placar.offsetWidth; el.placar.classList.add('pulo'); }
  }
  el.msgs.addEventListener('click', e => {
    const m = e.target.closest('.msg');
    if (!m || m.classList.contains('digitando') || m.classList.contains('abrir')) return;
    if (m._sinal) { if (!m._sinal.marcado) marcar(m); }
    else errou(m);
  });

  function relatorioCenaHTML(oculto) {
    const lista = SIN.cena;
    if (!lista.length) return '';
    const ok = lista.filter(s => s.marcado).length;
    return `<div class="pxo" style="--oc:rgba(245,183,0,.7);margin-top:30px"><div class="rel px" id="rel"${oculto ? ' hidden' : ''}>` +
      `<div class="rel-tit"><span>SINAIS NESTA CONVERSA</span><b>${ok}/${lista.length}</b></div><ul>` +
      lista.map(s => `<li class="${s.marcado ? 'ok' : 'perdido'}">${s.marcado ? I.check : I.xis}<span>${esc(s.nome)}</span><span class="rel-tipo">${esc(s.violencia)}</span></li>`).join('') +
      '</ul>' + (ok < lista.length ? '<div class="rel-dica">Os marcados com X passaram despercebidos.</div>' : '') + '</div></div>';
  }

  // ============================================================
  // CAMPO DE DIGITAÇÃO E MENSAGENS
  // ============================================================
  function limparCampo() {
    el.campo.textContent = 'Mensagem';
    el.campo.classList.add('vazio');
    el.campo.classList.remove('cursor');
    el.enviar.classList.remove('pulsar');
  }
  function digitar(texto, maxMs) {
    return new Promise(resolve => {
      el.campo.classList.remove('vazio');
      el.campo.classList.add('cursor');
      el.campo.textContent = '';
      const dur = Math.min(maxMs || 1300, 22 * texto.length + 200) * FATOR;
      const t0 = performance.now();
      let feito = false;
      const fim = () => {
        if (feito) return;
        feito = true; clearInterval(iv);
        el.campo.textContent = texto;
        if (pularAtual === fim) pularAtual = null;
        resolve();
      };
      const iv = setInterval(() => {
        const k = dur > 0 ? Math.min(1, (performance.now() - t0) / dur) : 1;
        el.campo.textContent = texto.slice(0, Math.ceil(texto.length * k));
        if (k >= 1) fim();
      }, 30);
      pularAtual = fim;
    });
  }

  async function enviarVitima(p) {
    const hora = p.hora || estado.hora;
    await esperar(450);
    if (p.camera === 'roupa') return cameraRoupa(p, hora);
    if (p.anexo) return enviarAnexo(p, hora);
    const rotulo = p.tipo === 'localizacao' ? 'Localização atual' : (p.tipo ? 'Foto' : null);
    if (rotulo) { el.campo.classList.remove('vazio'); el.campo.textContent = rotulo; }
    else await digitar(p.texto);
    if (p.aguardarEnvio) {
      el.campo.classList.remove('cursor');
      el.enviar.classList.add('pulsar');
      await esperarToque(el.enviar);
    } else {
      await esperar(rotulo ? 600 : 300);
    }
    limparCampo();
    definirHora(hora);
    adicionarBolha(p, hora);
    Som.enviada();
    await esperar(350);
  }

  async function receber(p) {
    const hora = p.hora || estado.hora;
    const n = p.tipo ? 12 : String(p.texto || '').length;
    await esperar(350);
    mostrarDigitando(true);
    await esperar(Math.min(2600, 650 + n * 30));
    mostrarDigitando(false);
    definirHora(hora);
    const div = adicionarBolha(p, hora);
    avisoChat();
    if (p.abrir) return abrirFotoDele(div);
    await esperar(Math.min(2200, 650 + n * 22));
  }

  // ============================================================
  // MINI-INTERAÇÕES
  // ============================================================
  function prepararCamera(arte, titulo) {
    desenharEm(el.camImg, arte);
    el.camQuadro.style.setProperty('--ar', (arte.width / arte.height).toFixed(4));
    el.camTitulo.textContent = titulo;
    el.camPontos.innerHTML = '';
    el.camDisparar.hidden = true; el.camEnviar.hidden = true;
    el.camDisparar.classList.remove('pulsar');
  }
  function flash() { el.camFlash.classList.remove('on'); void el.camFlash.offsetWidth; el.camFlash.classList.add('on'); }

  // Cena 1: tirar a foto da roupa e mandar como visualização única
  async function cameraRoupa(p, hora) {
    const T = R.interacoes.roupa;
    prepararCamera(P.roupa(), T.titulo);
    el.camDica.textContent = T.dica;
    el.camDisparar.hidden = false; el.camDisparar.classList.add('pulsar');
    mostrarView('camera');
    await esperarToque(el.camDisparar);
    el.camDisparar.classList.remove('pulsar');
    Som.obturador(); flash();
    await esperar(450, { pulavel: false });
    el.camDisparar.hidden = true; el.camEnviar.hidden = false;
    el.camDica.textContent = T.enviada;
    await esperarToque(el.camEnviar);
    mostrarView('chat');
    await esperar(300, { pulavel: false });
    definirHora(hora);
    adicionarBolha(p, hora);
    Som.enviada();
    await esperar(400);
  }

  // Cena 2: abrir a foto de visualização única que ele mandou
  async function abrirFotoDele(div) {
    const T = R.interacoes.fotoDele;
    div.classList.add('abrir');
    const f = div.querySelector('.foto-unica');
    if (f) f.insertAdjacentHTML('beforeend', `<span class="abrir-dica">· ${esc(T.dica)}</span>`);
    await esperarToque(div);
    div.classList.remove('abrir');
    Som.clique();
    el.sobre.innerHTML = '<div class="sobre-barra"><i></i></div>' +
      `<div class="perfil px"><span class="p-av px">${I.pessoa}</span><span class="p-txt"><b>${esc(T.usuario)}</b>${esc(T.texto)} <small>${esc(T.tempo)}</small></span></div>` +
      '<div class="s-fechar">toque para fechar</div>';
    el.sobre.hidden = false;
    await esperarToque(el.sobre, { tempo: 4000 });
    el.sobre.hidden = true; el.sobre.innerHTML = '';
    abrirFotoUnica(div);
    await esperar(600);
  }

  // Cena 3: o relógio dos 20 minutos corre enquanto ela decide
  let cron = null;
  function iniciarCronometro(min) {
    pararCronometro();
    let s = min * 60, ticks = 0, bat = estado.status.bateria;
    el.faixa.className = 'faixa'; el.faixa.hidden = false;
    const render = () => {
      const mm = String(Math.floor(s / 60)).padStart(2, '0'), ss = String(s % 60).padStart(2, '0');
      el.faixa.innerHTML = `${I.relogio}<span class="fx-tempo">${mm}:${ss}</span><span class="fx-txt">${esc(R.interacoes.cronometro)}</span>`;
      el.faixa.classList.toggle('urgente', s < 5 * 60);
    };
    render();
    cron = setInterval(() => {
      s = Math.max(0, s - 15); ticks++;
      if (ticks % 16 === 0 && bat > 1) { bat--; estado.status.bateria = bat; mostrarBateria(bat, false); }
      render();
      if (s === 0) pararCronometro();
    }, 250);
  }
  function pararCronometro() { clearInterval(cron); cron = null; }

  // Cena 5: procurar a chave pela casa
  async function procurarChave() {
    const T = R.interacoes.chave;
    prepararCamera(P.casa(), T.titulo);
    el.camDica.textContent = T.dica;
    mostrarView('camera');
    const nomes = Object.keys(P.CASA_PONTOS);
    const vistos = new Set();
    await new Promise(resolve => {
      nomes.forEach(k => {
        const [x, y, w, h] = P.CASA_PONTOS[k];
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'cam-ponto';
        b.style.cssText = `left:${x}%;top:${y}%;width:${w}%;height:${h}%`;
        b.setAttribute('aria-label', k);
        b.addEventListener('click', ev => {
          ev.stopPropagation();
          if (vistos.has(k)) return;
          vistos.add(k);
          b.classList.add('visto');
          el.camDica.textContent = T.lugares[k] || '';
          if (k === 'porta') {
            Som.porta();
            const a = $('#cam-area'); a.classList.remove('chacoalha'); void a.offsetWidth; a.classList.add('chacoalha');
          } else Som.clique();
          if (vistos.size === nomes.length) setTimeout(resolve, 1100 * FATOR);
        });
        el.camPontos.appendChild(b);
      });
      if (TESTE) Array.from(el.camPontos.children).forEach((b, i) => setTimeout(() => b.click(), 120 + i * 90));
    });
    el.camDica.textContent = T.fim;
    await esperar(1600, { pulavel: false });
    mostrarView('chat');
    await esperar(500);
  }

  // Cena 7: localização dele se aproximando
  function aoVivo(t) {
    const T = R.interacoes.aoVivo;
    estado.aoVivo = t;
    const km = T.distanciaKm * (1 - t);
    const dist = km < 1 ? Math.max(10, Math.round(km * 100) * 10) + ' m' : km.toFixed(1).replace('.', ',') + ' km';
    el.faixa.className = 'faixa mapa-faixa'; el.faixa.hidden = false;
    el.faixa.innerHTML = '';
    el.faixa.appendChild(P.mapa(t));
    el.faixa.insertAdjacentHTML('beforeend', `<span class="fx-txt">${esc(T.texto)}<br><span class="fx-dist">a ${dist} de você</span></span>`);
    el.faixa.dataset.dist = dist;
    if (!el.sobre.hidden && el.sobre.dataset.tipo === 'mapa') abrirMapa();
    Som.clique();
  }
  function abrirMapa() {
    const T = R.interacoes.aoVivo;
    el.sobre.dataset.tipo = 'mapa';
    el.sobre.innerHTML = '';
    el.sobre.appendChild(P.mapa(estado.aoVivo));
    el.sobre.insertAdjacentHTML('beforeend', `<div class="s-txt">${esc(T.texto)}</div><div class="s-dist">${esc(el.faixa.dataset.dist || '')}</div><div class="s-fechar">toque para fechar</div>`);
    el.sobre.hidden = false;
  }
  el.faixa.addEventListener('click', () => { if (estado.aoVivo != null) abrirMapa(); });
  el.sobre.addEventListener('click', () => {
    if (el.sobre.dataset.tipo === 'mapa') { el.sobre.hidden = true; el.sobre.dataset.tipo = ''; }
  });

  // Cena 9: enviar a localização pelo "+"
  async function enviarAnexo(p, hora) {
    const T = R.interacoes.anexo;
    el.mais.classList.add('pulsar');
    mostrarAcao(`<div class="acao-dica">${esc(T.dica)}</div>`);
    await esperarToque(el.mais);
    el.mais.classList.remove('pulsar');
    Som.clique();
    mostrarAcao(`<button type="button" class="btn-acao anexo pxo" id="btn-anexo"><span class="px">${I.pin}${esc(T.opcao)}</span></button>`);
    await esperarToque($('#btn-anexo'));
    esconderAcao();
    definirHora(hora);
    adicionarBolha(p, hora);
    Som.enviada();
    await esperar(500);
  }

  // Cena 9: discar 1-9-0
  async function discar(numero) {
    const T = R.interacoes.ligar;
    el.tcVisor.textContent = '';
    el.tcDica.textContent = T.dica;
    el.tcLigar.classList.remove('pronto');
    const teclas = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']];
    el.tcTeclas.innerHTML = teclas.map(([d, l]) => `<button type="button" class="tc-tecla px" data-d="${d}">${d}<small>${l || '&nbsp;'}</small></button>`).join('');
    mostrarView('teclado');
    let i = 0;
    const proxima = () => {
      el.tcTeclas.querySelectorAll('.tc-tecla').forEach(b => b.classList.toggle('proxima', b.dataset.d === numero[i]));
    };
    proxima();
    await new Promise(resolve => {
      el.tcTeclas.onclick = e => {
        const b = e.target.closest('.tc-tecla');
        if (!b || i >= numero.length) return;
        const d = b.dataset.d;
        Som.dtmf(d);
        b.classList.add('apertada'); setTimeout(() => b.classList.remove('apertada'), 150);
        if (d !== numero[i]) return;
        el.tcVisor.textContent += d;
        i++;
        proxima();
        if (i >= numero.length) { el.tcDica.textContent = ''; resolve(); }
      };
      if (TESTE) numero.split('').forEach((d, k) => setTimeout(() => el.tcTeclas.querySelector(`[data-d="${d}"]`).click(), 100 + k * 90));
    });
    el.tcTeclas.onclick = null;
    el.tcLigar.classList.add('pronto');
    await esperarToque(el.tcLigar);
  }

  async function passoLigar190() {
    const T = R.interacoes.ligar, L = R.ligacao || {};
    await esperar(900);
    mostrarAcao(`<button type="button" class="btn-acao pxo" id="btn-190"><span class="px">${I.fone}${esc(T.botao)}</span></button>`);
    await esperarToque($('#btn-190'));
    esconderAcao();
    await discar(L.numero || '190');
    el.clNumero.textContent = L.numero || '190';
    el.clNome.textContent = L.nome || '';
    el.clStatus.textContent = L.status || 'Ligando…';
    mostrarView('chamada');
    Som.chamada();
    await esperar(4500, { pulavel: false });
    await telaAlertaVermelho();
    Som.pararChamada();
  }

  // ============================================================
  // ESCOLHAS
  // ============================================================
  function mostrarEscolhas(opcoes) {
    return new Promise(resolve => {
      el.escolhas.innerHTML = '<div class="escolhas-rotulo">Escolha sua resposta</div>';
      let feito = false;
      const botoes = opcoes.map((op, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'opcao pxo';
        b.innerHTML = `<span class="px"><span class="num">${i + 1}</span><span class="op-txt">${op.acao ? `<span class="acao-txt">${esc(op.acao)}</span>` : ''}${esc(op.texto)}</span></span>`;
        b.addEventListener('click', e => { e.stopPropagation(); escolher(i); });
        el.escolhas.appendChild(b);
        return b;
      });
      el.escolhas.hidden = false;
      requestAnimationFrame(rolar);
      function escolher(i) {
        if (feito) return;
        feito = true;
        if (teclaAtual === tecla) teclaAtual = null;
        botoes[i].classList.add('escolhida');
        Som.clique();
        setTimeout(() => {
          el.escolhas.hidden = true; el.escolhas.innerHTML = '';
          requestAnimationFrame(rolar);
          resolve(i);
        }, 280);
      }
      const tecla = e => {
        const k = parseInt(e.key, 10);
        if (k >= 1 && k <= opcoes.length) { escolher(k - 1); return true; }
        return false;
      };
      teclaAtual = tecla;
      if (TESTE) {
        const n = OPCAO_TESTE === 'alt' ? (estado.escolhas.length % 2) : (parseInt(OPCAO_TESTE, 10) - 1 || 0);
        setTimeout(() => escolher(Math.min(Math.max(0, n), opcoes.length - 1)), AUTO + 50);
      }
    });
  }

  async function passoEscolha(opcoes) {
    await esperar(500, { pulavel: false });
    const i = await mostrarEscolhas(opcoes);
    pararCronometro();
    estado.escolhas.push(i + 1);
    const op = opcoes[i];
    await enviarVitima({ de: 'vitima', texto: op.texto, sinal: op.sinal, violencia: op.violencia });
    const resps = op.resposta == null ? [] : (Array.isArray(op.resposta) ? op.resposta : [op.resposta]);
    for (const r of resps) await receber(typeof r === 'string' ? { de: 'agressor', texto: r } : Object.assign({ de: 'agressor' }, r));
    if (op.pensamento) {
      await esperar(1100);
      await telaPensamento(op.pensamento);
    }
  }

  // ---------- telas do celular ----------
  async function telaBloqueio(c, notif) {
    el.lkNotif.hidden = true;
    mostrarView('bloqueio');
    await esperar(700, { pulavel: false });
    if (notif) {
      el.lkNome.textContent = c.contato || 'Amor';
      el.lkTexto.textContent = notif.tipo ? 'Foto' : notif.texto;
      el.lkNotif.hidden = false;
      avisoBloqueio();
    }
    // abre sozinho (ou com um toque)
    await esperarToque(el.vBloqueio, { tempo: notif ? 2200 : 1300 });
    Som.clique();
  }

  async function telaLista() {
    el.lsItens.innerHTML = '';
    let alvo = null;
    (R.listaConversas || []).forEach(c => {
      const li = document.createElement('li');
      li.className = 'ls-item' + (c.destaque ? ' destaque' : '');
      li.innerHTML = `<span class="avatar px" style="--av:${AVATAR_COR[c.nome] || '#7a2a1a'}">${avatarHTML(c.nome)}</span>` +
        `<span class="ls-txt"><span class="ls-nome">${esc(c.nome)}</span><span class="ls-previa">${esc(c.previa)}</span></span>` +
        `<span class="ls-hora">${esc(c.hora)}</span>`;
      if (c.destaque) { li.setAttribute('role', 'button'); li.tabIndex = 0; alvo = li; }
      el.lsItens.appendChild(li);
    });
    el.lsDica.textContent = R.dicaLista || '';
    el.lsDica.classList.remove('on');
    mostrarView('lista');
    const t = setTimeout(() => el.lsDica.classList.add('on'), 2500 * FATOR);
    await esperarToque(alvo || el.lsItens);
    clearTimeout(t);
    Som.clique();
  }

  // ============================================================
  // TELAS POR CIMA (overlays)
  // ============================================================
  const ov = el.ov;
  const ovAberto = () => !ov.hidden;

  async function mostrarOverlay(cls, html) {
    if (TESTE) log('overlay ' + cls);
    if (ovAberto()) {
      ov.classList.add('trocando');
      await esperar(260, { pulavel: false, fixo: true });
      ov.className = 'ov on trocando ' + cls;
      ov.innerHTML = html;
      ov.scrollTop = 0;
      void ov.offsetWidth;
      ov.classList.remove('trocando');
    } else {
      ov.className = 'ov ' + cls;
      ov.innerHTML = html;
      ov.hidden = false;
      ov.scrollTop = 0;
      void ov.offsetWidth;
      ov.classList.add('on');
    }
    await esperar(60, { pulavel: false, fixo: true });
  }
  async function fecharOverlay() {
    if (!ovAberto()) return;
    ov.classList.remove('on');
    await esperar(320, { pulavel: false, fixo: true });
    ov.hidden = true; ov.innerHTML = ''; ov.className = 'ov';
  }

  // Máquina de escrever: tocar (ou Espaço) completa o texto na hora
  function datilografar(alvo, texto) {
    return new Promise(resolve => {
      let i = 0, feito = false, t = null;
      alvo.classList.add('cursor-blk');
      const fim = () => {
        if (feito) return;
        feito = true; clearTimeout(t);
        alvo.textContent = texto;
        alvo.classList.remove('cursor-blk');
        ov.removeEventListener('click', fim);
        if (pularAtual === fim) pularAtual = null;
        resolve();
      };
      const passo = () => {
        if (feito) return;
        i = Math.min(texto.length, i + 1);
        alvo.textContent = texto.slice(0, i);
        if (i % 2 === 0 && texto[i - 1] !== ' ') Som.blip();
        if (i >= texto.length) return fim();
        const ch = texto[i - 1];
        t = setTimeout(passo, (/[.!?…]/.test(ch) ? 260 : /[,;:]/.test(ch) ? 120 : 30) * FATOR);
      };
      t = setTimeout(passo, 150 * FATOR);
      ov.addEventListener('click', fim);
      pularAtual = fim;
    });
  }

  const caixaPx = (html, oc, cls) => `<div class="pxo" style="--oc:${oc}"><div class="px ${cls || ''}">${html}</div></div>`;

  function canaisHTML() {
    return '<div class="canais">' + (R.canais || []).map(c =>
      caixaPx(`<h3>${esc(c.titulo)}</h3><p>${esc(c.texto)}</p>` +
        (c.endereco ? `<p class="end">${esc(c.endereco)}</p>` : '') +
        (c.telefones ? `<p class="end">${esc(c.telefones)}</p>` : ''), 'rgba(232,93,4,.75)', 'canal')).join('') + '</div>';
  }

  async function telaAlerta() {
    const A = R.abertura;
    await mostrarOverlay('alerta',
      `<div class="caixa"><div class="alerta-icone">${I.alerta}</div>` +
      `<h1 class="alerta-titulo">${esc(A.titulo)}</h1><p class="alerta-texto">${esc(A.texto)}</p>` +
      canaisHTML() + botao(esc(A.botao || 'Continuar'), 'ov-ok') + '</div>');
    await esperarToque($('#ov-ok'));
  }

  async function telaTitulo() {
    await mostrarOverlay('titulo',
      `<div class="caixa centro"><div class="titulo-barras">${P.barrasSinal(4, '#ff2a36')}</div>` +
      `<h1 class="titulo-jogo">${esc(R.config.titulo)}</h1><div class="titulo-sub">${esc(R.config.subtitulo)}</div>` +
      botao('JOGAR', 'ov-ok') + '<p class="dica-som">Melhor com o som ligado.</p></div>');
    await esperarToque($('#ov-ok'));
  }

  async function telaTutorial() {
    const T = R.tutorial;
    if (!T) return;
    await mostrarOverlay('tutorial',
      '<div class="caixa">' + caixaPx(
        `<div class="janela-titulo">${esc(T.titulo)}</div><ul class="tut-linhas">${T.linhas.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` +
        `<div style="margin-top:18px"><span class="tut-exemplo pxo"><span class="px">Exemplo de mensagem marcada</span></span><span class="tut-etq">! sinal</span></div>` +
        botao(esc(T.botao || 'Começar'), 'ov-ok'), 'var(--laranja)', 'janela') + '</div>');
    await esperarToque($('#ov-ok'));
  }

  async function cartao(html, ms) {
    await mostrarOverlay('cartao', `<div class="caixa centro">${html}</div>`);
    await esperarToque(ov, { tempo: ms || 2400 });
  }
  const cartaoParte = p => cartao(
    `<div class="cartao-barras">${P.barrasSinal(p.barras || 4, p.cor || '#e85d04')}</div>` +
    `<div class="cartao-num">${esc(p.numero)}</div><h2 class="cartao-nome cor">${esc(p.nome)}</h2>`, 2600);
  const cartaoCena = c => cartao(
    `<div class="cartao-num">CENA ${Math.floor(c.id)}</div><h2 class="cartao-nome">${esc(c.titulo)}</h2>` +
    (c.subtitulo ? `<div class="cartao-sub">${esc(c.subtitulo)}</div>` : ''), 2200);

  // Frase solta (antes de uma cena)
  async function telaFrase(t) {
    await mostrarOverlay('frase', `<div class="caixa centro"><p class="frase-texto" id="frase"></p></div>`);
    await datilografar($('#frase'), t);
    await esperarToque(ov, { tempo: 1800 });
  }

  // Fim de cena: frase de efeito + sinais da conversa
  async function telaFimDeCena(frase) {
    const rel = relatorioCenaHTML(!!frase);
    await mostrarOverlay('frase',
      `<div class="caixa centro">${frase ? '<p class="frase-texto" id="frase"></p>' : ''}${rel}` +
      (rel ? `<div id="ov-ok-box"${frase ? ' hidden' : ''}>${botao('CONTINUAR ' + I.seta, 'ov-ok')}</div>` : '') + '</div>');
    if (frase) await datilografar($('#frase'), frase);
    if (rel) {
      const r = $('#rel'), b = $('#ov-ok-box');
      if (r) r.hidden = false;
      if (b) b.hidden = false;
      await esperarToque($('#ov-ok'));
    } else {
      await esperarToque(ov, { tempo: 2000 });
    }
  }

  async function telaPensamento(t) {
    await mostrarOverlay('pensamento',
      '<div class="caixa">' + caixaPx(
        `<div class="dialogo-rotulo">PENSAMENTOS</div><p class="pens-texto" id="pens"></p><span class="dialogo-seta" id="seta">${I.seta}</span>`,
        '#fff', 'dialogo') + '</div>');
    await datilografar($('#pens'), '“' + t + '”');
    $('#seta').classList.add('on');
    await esperarToque(ov, { tempo: Math.max(2200, t.length * 40) });
  }

  async function telaAlertaVermelho() {
    const A = R.alertaVermelho;
    const seg = (R.config && R.config.tempoAlertaVermelho) || 10;
    let texto = esc(A.texto);
    if (A.numero) texto = texto.replace(esc(A.numero) + ' mulheres', `<strong>${esc(A.numero)} mulheres</strong>`);
    await mostrarOverlay('vermelho',
      `<div class="caixa centro"><div class="vm-rotulo">${I.alerta}<span>ALERTA</span></div>` +
      (A.numero ? `<div class="vm-numero">${esc(A.numero)}</div>` : '') +
      `<p class="vm-texto">${texto}</p>` +
      `<div class="vm-barra"><i style="animation-duration:${(seg * FATOR_FIXO).toFixed(2)}s"></i></div></div>`);
    Som.pararChamada();
    Som.coracao();
    if (navigator.vibrate && toqueTela && !Som.mudo) { try { navigator.vibrate([200, 100, 200]); } catch (e) { /* */ } }
    await esperar(seg * 1000, { fixo: true });
    Som.pararCoracao();
  }

  async function telaFinal() {
    const F = R.final;
    definirParte('fim');
    const total = F.paragrafos.length;
    for (let i = 0; i < total; i++) {
      await mostrarOverlay('final',
        `<div class="caixa"><p class="fin-p">${negrito(F.paragrafos[i])}</p>` +
        `<div class="fin-rodape"><span class="fin-cont">${i + 1}/${total}</span>${botao('CONTINUAR ' + I.seta, 'ov-ok', 'claro')}</div></div>`);
      await esperarToque($('#ov-ok'));
    }
    if (F.ultimaFrase) {
      const corte = F.ultimaFrase.indexOf('. ');
      const a = corte > 0 ? F.ultimaFrase.slice(0, corte + 1) : F.ultimaFrase;
      const b = corte > 0 ? F.ultimaFrase.slice(corte + 2) : '';
      await mostrarOverlay('final',
        `<div class="caixa centro"><p class="fin-ultima">${esc(a)}${b ? `<span>${esc(b)}</span>` : ''}</p>` +
        `<div style="margin-top:30px">${botao('CONTINUAR ' + I.seta, 'ov-ok', 'claro')}</div></div>`);
      await esperarToque($('#ov-ok'));
    }
  }

  async function telaRelatorioFinal() {
    if (!SIN.total) return;
    const ordem = ['psicológica', 'física', 'sexual', 'moral', 'patrimonial'];
    const tipos = Object.keys(SIN.tipos).sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
    const pct = Math.round(100 * SIN.marcados / SIN.total);
    const defs = R.tiposViolencia || {};
    await mostrarOverlay('relatorio',
      `<div class="caixa centro"><div class="rf-tit">${esc(R.final.relatorio || 'VOCÊ RECONHECEU')}</div>` +
      `<div class="rf-num">${SIN.marcados} DE ${SIN.total}</div><div class="rf-sub">sinais de violência nesta história</div>` +
      `<div class="rf-barra"><i style="width:${pct}%"></i></div>` +
      '<div class="rf-tipos">' + tipos.map(k => caixaPx(
        `<h3><span>VIOLÊNCIA ${esc(k.toUpperCase())}</span><span>${SIN.tipos[k].marcados}/${SIN.tipos[k].total}</span></h3><p>${esc(defs[k] || '')}</p>`,
        'rgba(245,183,0,.55)', 'rf-tipo')).join('') + '</div>' +
      `<p class="rf-fonte">${esc(R.fonteTipos || '')}</p>` +
      botao('CONTINUAR ' + I.seta, 'ov-ok') + '</div>');
    await esperarToque($('#ov-ok'));
  }

  async function telaFim() {
    const C = R.config;
    await mostrarOverlay('fim',
      `<div class="caixa centro"><h1 class="fim-titulo">${esc(R.final.fim || 'FIM')}</h1>` +
      `<div class="fim-sub">${esc(C.titulo)} · ${esc(C.subtitulo)}</div>` +
      (C.creditos ? `<p class="creditos">${esc(C.creditos)}</p>` : '') +
      `<p class="fim-texto">${esc(R.abertura.texto)}</p>` + canaisHTML() +
      botao('JOGAR NOVAMENTE', 'ov-ok') + '</div>');
    document.body.dataset.fim = '1';
    log('FIM OK | escolhas: ' + estado.escolhas.join(',') + ' | sinais: ' + SIN.marcados + '/' + SIN.total);
    if (TESTE) return;
    await esperarToque($('#ov-ok'));
    location.href = location.pathname;
  }

  // ============================================================
  // CENAS
  // ============================================================
  async function executarPasso(p) {
    await fecharOverlay();
    if (p.escolha) return passoEscolha(p.escolha);
    if (p.ligar190) return passoLigar190();
    if (p.procurarChave) return procurarChave();
    if (p.cronometro) { iniciarCronometro(p.cronometro); return esperar(400); }
    if (p.aoVivo != null) { aoVivo(p.aoVivo); return esperar(900); }
    if (p.pausa) return esperar(p.pausa);
    if (p.de) {
      const hora = p.hora || estado.hora;
      const salto = minutos(hora) - minutos(estado.hora);
      if (salto > 0) await esperar(Math.min(400 + salto * 220, 1800));
      return p.de === 'vitima' ? enviarVitima(p) : receber(p);
    }
    if (p.hora) { await esperar(800); definirHora(p.hora); }
    if (p.aviso) { adicionarChip(p.aviso); await esperar(1400); }
  }

  async function rodarCena(c) {
    const passos = c.passos || [];
    const primeiro = passos[0];
    const notif = (primeiro && primeiro.de && primeiro.de !== 'vitima') ? primeiro : null;
    await telaBloqueio(c, notif);
    if (c.abertura === 'lista') await telaLista();
    mostrarView('chat');
    let i = 0;
    if (notif) {
      const h = notif.hora || estado.hora;
      definirHora(h);
      adicionarBolha(notif, h);
      i = 1;
      await esperar(1300);
    } else {
      await esperar(600);
    }
    for (; i < passos.length; i++) await executarPasso(passos[i]);
    pararCronometro();
    if (!ovAberto()) await esperar(1400);
  }

  async function principal() {
    montarArte();
    const cenas = R.cenas;
    const inicio = parseFloat(params.get('cena')) || 0;
    let idx = 0;
    if (inicio) { idx = cenas.findIndex(c => c.id === inicio); if (idx < 0) idx = 0; }

    prepararCena(cenas[idx]);
    if (!inicio) await telaAlerta();
    await telaTitulo();
    if (!inicio) await telaTutorial();
    el.placar.hidden = false;
    atualizarPlacar(false);

    let parteAtual = 0;
    for (; idx < cenas.length; idx++) {
      const c = cenas[idx];
      SIN.cena = [];
      log('cena ' + c.id);
      if (c.fraseAntes) await telaFrase(c.fraseAntes);
      if (c.parte && c.parte !== parteAtual) {
        parteAtual = c.parte;
        definirParte(c.parte);
        const p = R.partes && R.partes[c.parte - 1];
        if (p) await cartaoParte(p);
      }
      if (c.titulo && c.mostrarCartao !== false) await cartaoCena(c);
      prepararCena(c);
      await fecharOverlay();
      await rodarCena(c);
      const ultima = idx === cenas.length - 1;
      if (!ultima && (c.frase || SIN.cena.length)) await telaFimDeCena(c.frase);
    }
    await telaFinal();
    await telaRelatorioFinal();
    await telaFim();
  }

  principal().catch(e => registrarErro(e && e.stack || e));
})();
