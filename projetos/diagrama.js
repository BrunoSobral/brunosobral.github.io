// Desenha o fluxo de um projeto em SVG e anima os passos.
// Em telas largas o fluxo corre da esquerda para a direita; abaixo de 560 px, de cima para baixo.

(function () {
  const SVG = "http://www.w3.org/2000/svg";
  const H = { colW: 214, noW: 160, linhaH: 124, margem: 28 };
  const V = { noW: 236, gap: 30, margem: 20, folga: 76 };
  const LINHA_TXT = 18;
  const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(nome, attrs, pai) {
    const n = document.createElementNS(SVG, nome);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(n);
    return n;
  }

  // Quebra o rótulo em linhas de até `max` caracteres, sem cortar palavras.
  function quebrar(texto, max) {
    const linhas = [];
    let atual = "";
    for (const p of texto.split(" ")) {
      if ((atual + " " + p).trim().length > max && atual) {
        linhas.push(atual);
        atual = p;
      } else atual = (atual + " " + p).trim();
    }
    if (atual) linhas.push(atual);
    return linhas;
  }

  function posicoes(projeto, vertical) {
    const pos = {};
    if (!vertical) {
      for (const n of projeto.nos) {
        const linhas = quebrar(n.rotulo, 19);
        const h = Math.max(54, linhas.length * LINHA_TXT + 28);
        pos[n.id] = { x: H.margem + n.coluna * H.colW, y: H.margem + n.faixa * H.linhaH + (H.linhaH - 30 - h) / 2 + 8, w: H.noW, h, linhas };
      }
      const colunas = Math.max(...projeto.nos.map((n) => n.coluna)) + 1;
      return { pos, largura: H.margem * 2 + (colunas - 1) * H.colW + H.noW, altura: H.margem * 2 + 3 * H.linhaH - 30 };
    }
    const ordem = [...projeto.nos].sort((a, b) => a.coluna - b.coluna || a.faixa - b.faixa);
    let y = V.margem;
    ordem.forEach((n, i) => {
      const linhas = quebrar(n.rotulo, 28);
      const h = Math.max(48, linhas.length * LINHA_TXT + 24);
      pos[n.id] = { x: V.margem + (n.faixa === 1 ? 0 : n.faixa === 0 ? 0 : 0), y, w: V.noW, h, linhas, ordem: i };
      y += h + V.gap;
    });
    return { pos, largura: V.margem * 2 + V.noW + V.folga, altura: y - V.gap + V.margem };
  }

  function caminho(a, b, vertical) {
    if (vertical) {
      if (b.ordem === a.ordem + 1) {
        const x = a.x + a.w / 2;
        return `M${x},${a.y + a.h} L${x},${b.y}`;
      }
      // Pula nós: contorna pela direita.
      const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x + b.w, y2 = b.y + b.h / 2;
      const desvio = Math.min(V.folga - 10, 22 + Math.abs(b.ordem - a.ordem) * 12);
      return `M${x1},${y1} C${x1 + desvio},${y1} ${x2 + desvio},${y2} ${x2},${y2}`;
    }
    if (a.x === b.x) {
      const x = a.x + a.w / 2;
      return b.y > a.y ? `M${x},${a.y + a.h} L${x},${b.y}` : `M${x},${a.y} L${x},${b.y + b.h}`;
    }
    const daDireita = b.x > a.x;
    const x1 = daDireita ? a.x + a.w : a.x, y1 = a.y + a.h / 2;
    const x2 = daDireita ? b.x : b.x + b.w, y2 = b.y + b.h / 2;
    const mx = (x1 + x2) / 2;
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  }

  function desenharNo(g, n, p) {
    const grupo = el("g", { class: `no no-${n.tipo}`, "data-no": n.id }, g);
    const rx = n.tipo === "pessoa" ? p.h / 2 : n.tipo === "servico" || n.tipo === "dados" ? 4 : 12;
    el("rect", { x: p.x, y: p.y, width: p.w, height: p.h, rx, class: "caixa" }, grupo);
    if (n.tipo === "dados") {
      el("line", { x1: p.x + 8, x2: p.x + p.w - 8, y1: p.y + 7, y2: p.y + 7, class: "faixa-dados" }, grupo);
    }
    if (n.tipo === "ia" || n.tipo === "decide") {
      const sx = p.x + 12, sy = p.y - 11;
      const selo = el("g", { class: "selo" }, grupo);
      el("rect", { x: sx, y: sy, width: n.tipo === "ia" ? 30 : 80, height: 20, rx: 10 }, selo);
      const t = el("text", { x: sx + (n.tipo === "ia" ? 15 : 40), y: sy + 14.5, "text-anchor": "middle" }, selo);
      t.textContent = n.tipo === "ia" ? "IA" : "você decide";
    }
    const t = el("text", { x: p.x + p.w / 2, y: p.y + p.h / 2 - ((p.linhas.length - 1) * LINHA_TXT) / 2 + 5, "text-anchor": "middle", class: "rotulo" }, grupo);
    p.linhas.forEach((l, i) => {
      const s = el("tspan", { x: p.x + p.w / 2, dy: i ? LINHA_TXT : 0 }, t);
      s.textContent = l;
    });
  }

  function criarDiagrama(alvo, projeto, opcoes = {}) {
    let atual = -1, svg, arestas = [], ponto, animacao, vertical = null;
    const forcarHorizontal = !!opcoes.horizontal;

    function desenhar() {
      const largura = alvo.clientWidth || 800;
      const v = !forcarHorizontal && largura < 560;
      if (v === vertical && svg) return;
      vertical = v;
      const { pos, largura: W, altura: A } = posicoes(projeto, vertical);
      alvo.innerHTML = "";
      svg = el("svg", { viewBox: `0 0 ${W} ${A}`, class: "diagrama" + (vertical ? " vertical" : ""), role: "img", "aria-label": `Fluxo do ${projeto.nome}: ` + projeto.passos.map((p, i) => `${i + 1}. ${p.texto}`).join(" ") }, alvo);
      const gA = el("g", { class: "arestas" }, svg);
      const gN = el("g", { class: "nos" }, svg);
      const gM = el("g", { class: "marcas" }, svg);
      arestas = [];
      projeto.passos.forEach((passo, i) => {
        passo.arestas.forEach(([de, para], j) => {
          const d = caminho(pos[de], pos[para], vertical);
          const path = el("path", { d, class: "aresta", "data-passo": i }, gA);
          arestas.push({ path, passo: i, de, para });
          if (j === 0) {
            const meio = path.getTotalLength ? path.getPointAtLength(path.getTotalLength() / 2) : { x: 0, y: 0 };
            const m = el("g", { class: "marca", "data-passo": i }, gM);
            el("circle", { cx: meio.x, cy: meio.y, r: 11 }, m);
            const t = el("text", { x: meio.x, y: meio.y + 4.5, "text-anchor": "middle" }, m);
            t.textContent = i + 1;
          }
        });
      });
      for (const n of projeto.nos) desenharNo(gN, n, pos[n.id]);
      ponto = el("circle", { r: 6, class: "ponto" }, svg);
      aplicar(atual, false);
    }

    function aplicar(i, animar) {
      if (!svg) return;
      cancelAnimationFrame(animacao);
      const acesos = new Set();
      if (i >= 0) acesos.add(projeto.passos[0].arestas[0][0]);
      for (const a of arestas) {
        a.path.classList.toggle("feita", a.passo < i);
        a.path.classList.toggle("ativa", a.passo === i);
        if (a.passo < i) acesos.add(a.de).add(a.para);
        if (a.passo === i) acesos.add(a.de);
      }
      svg.querySelectorAll(".marca").forEach((m) => {
        const p = +m.dataset.passo;
        m.classList.toggle("feita", p < i);
        m.classList.toggle("ativa", p === i);
      });
      const atuais = arestas.filter((a) => a.passo === i);
      const acender = () => {
        atuais.forEach((a) => acesos.add(a.para));
        svg.querySelectorAll(".no").forEach((g) => {
          const ligado = acesos.has(g.dataset.no);
          const destino = atuais.some((a) => a.para === g.dataset.no);
          g.classList.toggle("aceso", ligado);
          g.classList.toggle("chegou", destino);
        });
      };
      if (!animar || reduzido() || !atuais.length) {
        ponto.style.opacity = 0;
        acender();
        return;
      }
      // Nós de origem acendem já; os de destino quando o ponto chega.
      svg.querySelectorAll(".no").forEach((g) => {
        g.classList.toggle("aceso", acesos.has(g.dataset.no));
        g.classList.remove("chegou");
      });
      const trajeto = atuais[0].path, total = trajeto.getTotalLength(), inicio = performance.now(), dur = 900;
      ponto.style.opacity = 1;
      const passo = (t) => {
        const k = Math.min(1, (t - inicio) / dur);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const p = trajeto.getPointAtLength(total * e);
        ponto.setAttribute("cx", p.x);
        ponto.setAttribute("cy", p.y);
        if (k < 1) animacao = requestAnimationFrame(passo);
        else {
          ponto.style.opacity = 0;
          acender();
        }
      };
      animacao = requestAnimationFrame(passo);
    }

    const ro = new ResizeObserver(() => desenhar());
    ro.observe(alvo);
    desenhar();

    return {
      total: projeto.passos.length,
      get atual() { return atual; },
      mostrarPasso(i, animar = true) { atual = i; aplicar(i, animar); },
      mostrarTudo() { atual = projeto.passos.length; aplicar(atual, false); },
      limpar() { atual = -1; aplicar(-1, false); },
    };
  }

  window.criarDiagrama = criarDiagrama;
})();
