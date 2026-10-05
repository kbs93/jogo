let svgOriginalString = "";
let mapaSubstituicoes = {};
let corOrigAtiva = null;

const PALETA_CORES = [
  "#fadcbc","#e0bb95","#bf8f68","#9b643d","#594539","#ffffff",
   "#808080", "#212121","#000000","#fd0a0a", "#800000", "#e74c3c", "#e67e22", 
  "#f1c40f", "#2ecc71", "#025c32", "#0612c2", "#f502e9","#0099ff", "#8e44ad", 
  "#fd79a8", "#d63031", "#e17055", "#ffeaa7", "#00b894", "#e584f8", 
  "#6c5ce7", "#ff7675", "#fdcb6e", "#00cec9", "#74b9ff", "#a29bfe","#05ffea"
];

function converterParaHex(cor) {
  if (cor.startsWith("#")) {
    if (cor.length === 4) {
      return "#" + cor[1] + cor[1] + cor[2] + cor[2] + cor[3] + cor[3];
    }
    return cor.toLowerCase();
  }
  const rgb = cor.match(/\d+/g);
  if (!rgb || rgb.length < 3) return "#ffffff";
  return "#" + ((1 << 24) + (+rgb[0] << 16) + (+rgb[1] << 8) + +rgb[2]).toString(16).slice(1);
}

export function extrairCoresSvg(svgString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const elementos = doc.querySelectorAll("[fill]");
  const cores = new Set();

  elementos.forEach(el => {
    const fill = el.getAttribute("fill");
    if (fill && fill !== "none" && fill !== "transparent") {
      cores.add(converterParaHex(fill));
    }
  });

  return Array.from(cores);
}

export function obterSvgCustomizado() {
  let resultado = svgOriginalString;
  Object.entries(mapaSubstituicoes).forEach(([original, nova]) => {
    const regex = new RegExp(`fill=["']${original}["']`, "gi");
    resultado = resultado.replace(regex, `fill="${nova}"`);
  });
  return resultado;
}

export function renderizarEditorCores(svgString, containerCores, previewBox, onAtualizarCor) {
  svgOriginalString = svgString;
  mapaSubstituicoes = {};
  containerCores.innerHTML = "";

  const cores = extrairCoresSvg(svgString);
  previewBox.innerHTML = svgString;
  corOrigAtiva = cores[0] || null;

  // Barra com setas de navegação (esquerda / direita)
  const navContainer = document.createElement("div");
  navContainer.className = "editor-nav-carrossel";

  const btnEsq = document.createElement("button");
  btnEsq.type = "button";
  btnEsq.className = "btn-nav-cor";
  btnEsq.innerHTML = '<i class="bi bi-chevron-left"></i>';

  const btnDir = document.createElement("button");
  btnDir.type = "button";
  btnDir.className = "btn-nav-cor";
  btnDir.innerHTML = '<i class="bi bi-chevron-right"></i>';

  const esteiraCores = document.createElement("div");
  esteiraCores.className = "editor-paleta-esteira";

  btnEsq.addEventListener("click", () => {
    esteiraCores.scrollBy({ left: -90, behavior: "smooth" });
  });

  btnDir.addEventListener("click", () => {
    esteiraCores.scrollBy({ left: 90, behavior: "smooth" });
  });

  PALETA_CORES.forEach(hex => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "editor-swatch-item";
    swatch.style.backgroundColor = hex;

    swatch.addEventListener("click", () => {
      if (!corOrigAtiva) return;
      const novaCor = hex.toLowerCase();
      mapaSubstituicoes[corOrigAtiva] = novaCor;

      const cardAtivo = containerCores.querySelector(`.editor-cor-botao[data-orig="${corOrigAtiva}"]`);
      if (cardAtivo) {
        cardAtivo.querySelector(".icone-gota").style.fill = novaCor;
        cardAtivo.querySelector(".editor-cor-hex").textContent = novaCor;
      }

      const svgAtualizado = obterSvgCustomizado();
      previewBox.innerHTML = svgAtualizado;
      if (onAtualizarCor) onAtualizarCor(svgAtualizado);
    });

    esteiraCores.appendChild(swatch);
  });

  navContainer.appendChild(btnEsq);
  navContainer.appendChild(esteiraCores);
  navContainer.appendChild(btnDir);

  // Grade com as gotas e códigos hex
  const gridBotoes = document.createElement("div");
  gridBotoes.className = "editor-cores-grid";

  cores.forEach((corOriginal, idx) => {
    mapaSubstituicoes[corOriginal] = corOriginal;

    const card = document.createElement("button");
    card.type = "button";
    card.className = `editor-cor-botao ${idx === 0 ? "selecionado" : ""}`;
    card.dataset.orig = corOriginal;

    card.innerHTML = `
      <svg class="icone-gota" viewBox="0 0 24 24" style="fill: ${corOriginal}">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
      </svg>
      <span class="editor-cor-hex">${corOriginal}</span>
    `;

    card.addEventListener("click", () => {
      corOrigAtiva = corOriginal;
      gridBotoes.querySelectorAll(".editor-cor-botao").forEach(b => b.classList.remove("selecionado"));
      card.classList.add("selecionado");
    });

    gridBotoes.appendChild(card);
  });

  containerCores.appendChild(navContainer);
  containerCores.appendChild(gridBotoes);
}