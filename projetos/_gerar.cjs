// Gera index.html e uma página por projeto a partir de dados.js.
// Rodar depois de mudar o conteúdo: node projetos/_gerar.cjs
const fs = require("fs");
const path = require("path");
const PROJETOS = require("./dados.js");

const BASE = "https://brunosobral.github.io/projetos/";
const raiz = __dirname;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SETA = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';

function cabeca({ titulo, descricao, url, imagem, prefixo }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${imagem}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${prefixo}../favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${prefixo}estilo.css">
</head>
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
<header class="topo largura">
  <a class="nome" href="${prefixo}">Bruno Sobral</a>
  <nav aria-label="Principal"><a href="${prefixo}#projetos">Projetos</a><a href="https://github.com/BrunoSobral">GitHub</a></nav>
</header>
`;
}

const RODAPE = `<footer class="rodape largura">
  <p>O código destes projetos é privado, porque eles lidam com dados meus ou de trabalho. Numa entrevista, mostro o código e o app funcionando.</p>
  <p>Feito em HTML, CSS e JavaScript, sem framework, com o Claude Code como par de programação.</p>
</footer>`;

function index() {
  const abre = `<p class="grande">A IA propõe. Uma pessoa decide.</p><p class="miuda">Quatro projetos meus, do problema ao fluxo de dados. Veja onde a IA entra em cada um e onde a decisão continua com quem usa.</p>`;
  const fecha = `<p class="grande">Ferramentas que as pessoas usam, com IA onde ela ajuda.</p><p class="miuda">Os diagramas e o que cada projeto resolve estão em brunosobral.github.io/projetos</p>`;
  const lista = PROJETOS.map((p) => `  <li class="projeto p-${p.id}">
    <div>
      <h3>${esc(p.nome)}</h3>
      <p class="resumo">${esc(p.resumo)}</p>
      <p class="onde-ia"><strong>IA:</strong> ${esc(p.ia)}</p>
      <a class="link-ver" href="${p.id}/">Ver como funciona ${SETA}</a>
    </div>
    <a class="miniatura" href="${p.id}/" tabindex="-1" aria-hidden="true"><img src="${p.telas[0].src}" alt="" loading="lazy"></a>
  </li>`).join("\n");

  return cabeca({
    titulo: "Bruno Sobral: projetos com IA aplicada",
    descricao: "Quatro projetos pessoais, do problema ao fluxo de dados, mostrando onde a IA entra e onde a decisão continua com uma pessoa.",
    url: BASE, imagem: BASE + "og/inicio.png", prefixo: "",
  }) + `<main id="conteudo">
<section class="abertura largura">
  <h1>Transformo processos em ferramentas que as pessoas usam.</h1>
  <p>Venho de sistemas corporativos, dados e regras de negócio. Hoje construo aplicações com IA aplicada, e em todas elas a IA sugere e uma pessoa confirma.</p>
</section>
<section class="apresentacao largura" aria-label="Apresentação dos projetos">
  <div class="palco" data-palco data-trilha="video/trilha.mp3" data-abre="${esc(abre)}" data-fecha="${esc(fecha)}"></div>
  <div class="controles">
    <button class="botao-tocar" type="button" data-tocar><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 9-14 9z"/></svg><span>Assistir</span></button>
    <div class="capitulos" data-capitulos></div>
    <button class="botao-som" type="button" data-som aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="alto" d="M4 9h4l5-4v14l-5-4H4z"/><path class="ondas" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/><path class="x" d="M16 9l5 6M21 9l-5 6"/></svg><span>Som ligado</span></button>
  </div>
  <ul class="legenda" aria-label="Como ler os diagramas">
    <li><i class="amostra pessoa"></i>Quem usa</li>
    <li><i class="amostra"></i>Parte do sistema</li>
    <li><i class="amostra ia"></i>Onde a IA entra</li>
    <li><i class="amostra decide"></i>Onde você decide</li>
  </ul>
  <p class="baixar"><a href="video/projetos-bruno-sobral.mp4" download>Baixar a apresentação em vídeo (MP4, 2 min, com música)</a></p>
</section>
<section class="largura" id="projetos">
  <h2 class="secao-titulo">Os projetos</h2>
  <p class="secao-intro">Cada página mostra o problema, o fluxo passo a passo, as decisões que eu defendo e os limites de cada um.</p>
  <ul class="projetos">
${lista}
  </ul>
</section>
</main>
${RODAPE}
<script src="dados.js"></script>
<script src="diagrama.js"></script>
<script src="player.js"></script>
</body>
</html>
`;
}

function pagina(p, i) {
  const ant = PROJETOS[(i + PROJETOS.length - 1) % PROJETOS.length];
  const prox = PROJETOS[(i + 1) % PROJETOS.length];
  const telas = (p.telas || []).map((t) => `<figure class="tela-projeto"><img src="../${t.src}" alt="${esc(t.alt)}" loading="lazy"><figcaption>${esc(t.legenda)}</figcaption></figure>`).join("\n");
  return cabeca({
    titulo: `${p.nome}: ${p.resumo}`,
    descricao: p.problema,
    url: BASE + p.id + "/", imagem: BASE + "og/" + p.id + ".png", prefixo: "../",
  }).replace("<body>", `<body class="p-${p.id}">`) + `<main id="conteudo" class="largura">
<section class="cabeca-projeto">
  <a class="voltar" href="../">Todos os projetos</a>
  <h1>${esc(p.nome)}</h1>
  <p class="resumo">${esc(p.resumo)}</p>
</section>
<dl class="fatos">
  <div><dt>O problema</dt><dd>${esc(p.problema)}</dd></div>
  <div><dt>Onde roda</dt><dd>${esc(p.ondeRoda)}</dd></div>
  <div class="fato-ia"><dt>Onde a IA entra</dt><dd>${esc(p.ia)}</dd></div>
</dl>
<section class="fluxo" aria-labelledby="t-fluxo">
  <div class="quadro"><div data-diagrama></div></div>
  <div>
    <h2 id="t-fluxo" class="secao-titulo" style="font-size:24px">Como funciona</h2>
    <p class="secao-intro" style="margin-bottom:12px">Toque num passo para ver onde ele acontece no diagrama.</p>
    <ol class="passos">
${p.passos.map((s, k) => `      <li><button type="button" data-passo="${k}" aria-current="${k === 0}">${esc(s.texto)}</button></li>`).join("\n")}
    </ol>
    <div class="acoes"><button class="botao-secundario" type="button" data-reproduzir><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 9-14 9z"/></svg>Reproduzir o fluxo</button></div>
  </div>
</section>
${telas}
<section class="texto-projeto">
  <div>
    <h2>Decisões que eu defendo</h2>
    <ul>
${p.decisoes.map((d) => `      <li>${esc(d)}</li>`).join("\n")}
    </ul>
  </div>
  <div>
    <h2>Limites</h2>
    <p>${esc(p.limites)}</p>
    <h2>Tecnologias</h2>
    <ul class="etiquetas">${p.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
  </div>
</section>
<nav class="proximo" aria-label="Outros projetos">
  <a href="../${ant.id}/">Anterior: ${esc(ant.nome)}</a>
  <a href="../${prox.id}/">Próximo: ${esc(prox.nome)}</a>
</nav>
</main>
${RODAPE}
<script src="../dados.js"></script>
<script src="../diagrama.js"></script>
<script>
(() => {
  const p = PROJETOS.find((x) => x.id === "${p.id}");
  const d = criarDiagrama(document.querySelector("[data-diagrama]"), p);
  const botoes = [...document.querySelectorAll("[data-passo]")];
  let timer;
  const marcar = (k, animar) => {
    d.mostrarPasso(k, animar);
    botoes.forEach((b, j) => b.setAttribute("aria-current", j === k ? "true" : "false"));
  };
  botoes.forEach((b, k) => b.addEventListener("click", () => { clearInterval(timer); marcar(k, true); }));
  document.querySelector("[data-reproduzir]").addEventListener("click", () => {
    clearInterval(timer);
    let k = 0;
    marcar(k, true);
    timer = setInterval(() => { k++; if (k >= p.passos.length) return clearInterval(timer); marcar(k, true); }, 2600);
  });
  marcar(0, false);
})();
</script>
</body>
</html>
`;
}

fs.writeFileSync(path.join(raiz, "index.html"), index());
PROJETOS.forEach((p, i) => {
  fs.mkdirSync(path.join(raiz, p.id), { recursive: true });
  fs.writeFileSync(path.join(raiz, p.id, "index.html"), pagina(p, i));
});
console.log("ok:", 1 + PROJETOS.length, "páginas");
