// Apresentação animada: abertura, depois cada projeto (capa, fluxo passo a passo, telas) e o fechamento.
// Começa parada, com um botão de play no palco, como um vídeo; a música só toca depois do clique.

(function () {
  const palco = document.querySelector("[data-palco]");
  if (!palco) return;
  const params = new URLSearchParams(location.search);
  const gravando = params.has("gravar");

  const T = { abre: 4600, capa: 3400, passo: 3000, tela: 3800, fecha: 6000 };
  const momentos = [];
  const cenas = [];

  function cena(classe, html, projeto) {
    const div = document.createElement("div");
    div.className = "cena " + classe + (projeto ? " p-" + projeto.id : "");
    div.innerHTML = html;
    div.setAttribute("aria-hidden", "true");
    palco.appendChild(div);
    cenas.push(div);
    return div;
  }

  const abre = cena("cena-abre", palco.dataset.abre + `<ul class="lista-abre">${PROJETOS.map((p) => `<li class="p-${p.id}">${p.nome}</li>`).join("")}</ul>`);
  momentos.push({ cena: abre, dur: T.abre, cap: -1 });

  PROJETOS.forEach((p, ci) => {
    const capa = cena("cena-capa", `<p class="ordem">Projeto ${ci + 1} de ${PROJETOS.length}</p><p class="nome-projeto">${p.nome}</p><p class="problema">${p.problema}</p>`, p);
    momentos.push({ cena: capa, dur: T.capa, cap: ci });
    const fluxo = cena("cena-fluxo", `<div class="cab"><strong>${p.nome}</strong><span>como funciona</span></div><div class="area"><div></div></div><p class="fala"></p>`, p);
    const diag = criarDiagrama(fluxo.querySelector(".area > div"), p);
    const fala = fluxo.querySelector(".fala");
    p.passos.forEach((passo, k) => {
      momentos.push({
        cena: fluxo, dur: T.passo + (k === 0 ? 600 : 0), cap: ci,
        entrar() { diag.mostrarPasso(k, true); fala.innerHTML = `<b>${k + 1}</b>${passo.texto}`; },
        preparar() { diag.limpar(); fala.textContent = ""; },
      });
    });
    (p.telas || []).forEach((t) => {
      const tela = cena("cena-tela", `<img src="${t.src}" alt="${t.alt}" loading="lazy"><p class="fala">${t.legenda}</p>`, p);
      momentos.push({ cena: tela, dur: T.tela, cap: ci });
    });
  });

  const fecha = cena("cena-fecha", palco.dataset.fecha);
  momentos.push({ cena: fecha, dur: T.fecha, cap: -1 });
  let soma = 0;
  momentos.forEach((m) => { m.inicio = soma; soma += m.dur; });
  const total = soma;

  // Camada do palco: botão grande de play quando parado, barra de tempo embaixo.
  const capaPlay = document.createElement("button");
  capaPlay.type = "button";
  capaPlay.className = "play-palco";
  capaPlay.innerHTML = `<span class="circulo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg></span><span class="rotulo-play">Assistir a apresentação <small>2 min, com música</small></span>`;
  palco.appendChild(capaPlay);
  const tempo = document.createElement("div");
  tempo.className = "tempo";
  tempo.innerHTML = `<i class="trilho"><i class="cheio"></i></i><span class="relogio">0:00 / ${mmss(total)}</span>`;
  palco.appendChild(tempo);
  const cheio = tempo.querySelector(".cheio"), relogio = tempo.querySelector(".relogio");
  function mmss(ms) { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

  // Trilha: só toca depois de um clique (regra dos navegadores) e acompanha o ponto da apresentação.
  const audio = new Audio(palco.dataset.trilha || "");
  audio.preload = "auto";
  audio.volume = 0.7;
  let comSom = true;
  const botaoSom = document.querySelector("[data-som]");
  function marcarSom() {
    if (!botaoSom) return;
    botaoSom.setAttribute("aria-pressed", comSom ? "true" : "false");
    botaoSom.querySelector("span").textContent = comSom ? "Som ligado" : "Som desligado";
    botaoSom.classList.toggle("mudo", !comSom);
  }
  if (botaoSom) botaoSom.addEventListener("click", () => {
    comSom = !comSom;
    marcarSom();
    if (comSom && tocando) sincronizarAudio(true); else audio.pause();
  });
  function sincronizarAudio(forcar) {
    if (gravando || !palco.dataset.trilha) return;
    const alvo = (momentos[indice].inicio + decorrido) / 1000;
    if (forcar || Math.abs(audio.currentTime - alvo) > 0.6) { try { audio.currentTime = alvo; } catch (e) {} }
    if (comSom && tocando) audio.play().catch(() => {});
  }

  // Capítulos: um botão por projeto, com a barra de progresso dentro.
  const caixaCap = document.querySelector("[data-capitulos]");
  const botoesCap = PROJETOS.map((p, ci) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "capitulo p-" + p.id;
    b.innerHTML = `<span>${p.nome}</span><i class="barra"></i>`;
    b.addEventListener("click", () => { ir(momentos.findIndex((m) => m.cap === ci)); tocar(); });
    caixaCap.appendChild(b);
    return b;
  });
  const duracaoCap = PROJETOS.map((_, ci) => momentos.filter((m) => m.cap === ci).reduce((s, m) => s + m.dur, 0));

  const botao = document.querySelector("[data-tocar]");
  const rotulo = botao.querySelector("span");
  const icone = botao.querySelector("path");
  const ICONE_TOCAR = "M5 3l14 9-14 9z", ICONE_PAUSA = "M6 4h4v16H6zM14 4h4v16h-4z";

  let indice = -1, decorrido = 0, tocando = false, ultimo = 0, quadro;

  function ir(i) {
    const anterior = momentos[indice];
    indice = i;
    decorrido = 0;
    const m = momentos[i];
    if (!anterior || anterior.cena !== m.cena) {
      cenas.forEach((c) => { c.classList.toggle("visivel", c === m.cena); c.setAttribute("aria-hidden", c === m.cena ? "false" : "true"); });
      if (m.preparar) m.preparar();
    }
    if (m.entrar) m.entrar();
    atualizarCapitulos();
    if (tocando) sincronizarAudio(false);
  }

  function atualizarCapitulos() {
    const m = momentos[indice];
    botoesCap.forEach((b, ci) => {
      b.setAttribute("aria-current", m && m.cap === ci ? "true" : "false");
      let feito = 0;
      for (let j = 0; j < momentos.length; j++) {
        if (momentos[j].cap !== ci) continue;
        if (j < indice) feito += momentos[j].dur;
        else if (j === indice) feito += decorrido;
      }
      b.querySelector(".barra").style.width = Math.min(100, (feito / duracaoCap[ci]) * 100) + "%";
    });
    const agora = m ? m.inicio + decorrido : 0;
    cheio.style.width = Math.min(100, (agora / total) * 100) + "%";
    relogio.textContent = mmss(agora) + " / " + mmss(total);
  }

  function laco(t) {
    if (!tocando) return;
    decorrido += t - ultimo;
    ultimo = t;
    if (decorrido >= momentos[indice].dur) {
      if (indice + 1 < momentos.length) ir(indice + 1);
      else { pausar(true); return; }
    }
    atualizarCapitulos();
    quadro = requestAnimationFrame(laco);
  }

  function tocar() {
    if (indice < 0 || (indice === momentos.length - 1 && !tocando && decorrido >= momentos[indice].dur)) ir(0);
    tocando = true;
    ultimo = performance.now();
    cancelAnimationFrame(quadro);
    quadro = requestAnimationFrame(laco);
    rotulo.textContent = "Pausar";
    icone.setAttribute("d", ICONE_PAUSA);
    palco.classList.add("tocando");
    palco.classList.remove("parado");
    sincronizarAudio(true);
  }

  function pausar(fim) {
    tocando = false;
    cancelAnimationFrame(quadro);
    rotulo.textContent = fim ? "Ver de novo" : "Continuar";
    icone.setAttribute("d", ICONE_TOCAR);
    palco.classList.remove("tocando");
    palco.classList.add("parado");
    capaPlay.querySelector(".rotulo-play").firstChild.textContent = fim ? "Ver de novo " : "Continuar ";
    audio.pause();
  }

  const alternar = () => (tocando ? pausar(false) : tocar());
  botao.addEventListener("click", alternar);
  capaPlay.addEventListener("click", alternar);
  // Clicar no próprio palco também pausa e continua, como num vídeo.
  palco.addEventListener("click", (e) => { if (e.target === capaPlay || capaPlay.contains(e.target)) return; alternar(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && tocando) pausar(false); });
  marcarSom();

  ir(0);
  palco.classList.add("parado");
  if (gravando) {
    document.documentElement.classList.add("gravando");
    setTimeout(tocar, 400);
  }
  window.apresentacao = { duracao: total };
})();
