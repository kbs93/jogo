import { CONFIG, gameState } from "./config.js";

const emojiCabecaImg = new Image();
let possuiEmojiCustomizado = false;
let corCorpoCobra = "#f5d442"; // Cor padrão da cobra amarela

function converterParaHex(cor) {
  if (!cor) return "#f5d442";
  if (cor.startsWith("#")) {
    if (cor.length === 4) {
      return "#" + cor[1] + cor[1] + cor[2] + cor[2] + cor[3] + cor[3];
    }
    return cor.toLowerCase();
  }
  const rgb = cor.match(/\d+/g);
  if (!rgb || rgb.length < 3) return "#f5d442";
  return "#" + ((1 << 24) + (+rgb[0] << 16) + (+rgb[1] << 8) + +rgb[2]).toString(16).slice(1);
}

/**
 * Encontra a cor de base (rosto/pele/cabeça) do SVG
 */


/**
 * Analisa todos os elementos do SVG e escolhe a cor que ocupa a maior área (pele/rosto/base)
 */
function extrairCorPredominante(svgString) {
  try {
    const parser = new DOMParser();
    const docSvg = parser.parseFromString(svgString, "image/svg+xml");
    const pontuacaoCores = {};

    const elementos = docSvg.querySelectorAll("path, rect, circle, ellipse, polygon");

    elementos.forEach((el) => {
      const fill = el.getAttribute("fill");
      if (!fill || fill === "none" || fill === "transparent") return;

      const corHex = converterParaHex(fill);
      let peso = 10;

      // Estima a área ocupada por cada elemento gráfico
      if (el.tagName === "rect") {
        const w = parseFloat(el.getAttribute("width") || 0);
        const h = parseFloat(el.getAttribute("height") || 0);
        peso = w * h;
      } else if (el.tagName === "circle") {
        const r = parseFloat(el.getAttribute("r") || 0);
        peso = Math.PI * r * r;
      } else if (el.tagName === "ellipse") {
        const rx = parseFloat(el.getAttribute("rx") || 0);
        const ry = parseFloat(el.getAttribute("ry") || 0);
        peso = Math.PI * rx * ry;
      } else if (el.tagName === "path") {
        const d = el.getAttribute("d") || "";
        peso = d.length; // Caminhos mais longos desenham as superfícies maiores da cabeça
      }

      pontuacaoCores[corHex] = (pontuacaoCores[corHex] || 0) + peso;
    });

    // Encontra a cor com a maior soma de área no SVG
    let corVencedora = "#f5d442";
    let maiorPontuacao = -1;

    for (const [cor, pontos] of Object.entries(pontuacaoCores)) {
      if (pontos > maiorPontuacao) {
        maiorPontuacao = pontos;
        corVencedora = cor;
      }
    }

    return corVencedora;
  } catch (e) {
    console.warn("Erro ao calcular cor predominante:", e);
    return "#f5d442";
  }
}















export function obterCorCorpoCobra() {
  return corCorpoCobra;
}

/**
 * Atualiza o avatar e a cor do corpo com base no SVG
 */
export function definirAvatarCobra(svgString) {
  if (!svgString || typeof svgString !== "string" || !svgString.trim()) {
    possuiEmojiCustomizado = false;
    corCorpoCobra = "#f5d442";
    return;
  }

  // Define a cor de todos os gomos da cobra
  corCorpoCobra = extrairCorPredominante(svgString);

  let svgTratado = svgString;

  if (!svgTratado.includes("xmlns=")) {
    svgTratado = svgTratado.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  if (!svgTratado.includes("width=")) {
    svgTratado = svgTratado.replace("<svg", '<svg width="128" height="128"');
  }

  try {
    const base64 = btoa(unescape(encodeURIComponent(svgTratado)));
    emojiCabecaImg.src = `data:image/svg+xml;base64,${base64}`;
    possuiEmojiCustomizado = true;
  } catch (e) {
    emojiCabecaImg.src = `data:image/svg+xml;utf8,${encodeURIComponent(svgTratado)}`;
    possuiEmojiCustomizado = true;
  }
}

export function criarEfeitoPerdaGomo(x, y) {
  for (let i = 0; i < 16; i++) {
    const ang = Math.random() * Math.PI * 2;
    const vel = 1.5 + Math.random() * 3.5;
    gameState.particulas.push({
      x: x,
      y: y,
      vx: Math.cos(ang) * vel,
      vy: Math.sin(ang) * vel,
      raio: 2 + Math.random() * 3,
      opacidade: 1.0,
      cor: Math.random() > 0.3 ? corCorpoCobra : "#ff9900"
    });
  }
}

export function atualizarCobra() {
  const cabeca = gameState.segmentos[0];
  const centroX = window.innerWidth / 2;
  const centroY = window.innerHeight / 2;

  if (!gameState.entradaAtiva) {
    let dxTeclado = 0;
    let dyTeclado = 0;

    if (gameState.teclas.w) dyTeclado -= 1;
    if (gameState.teclas.s) dyTeclado += 1;
    if (gameState.teclas.a) dxTeclado -= 1;
    if (gameState.teclas.d) dxTeclado += 1;

    let anguloDesejado = null;

    if (dxTeclado !== 0 || dyTeclado !== 0) {
      anguloDesejado = Math.atan2(dyTeclado, dxTeclado);
    } else {
      const dxMouse = gameState.mouse.x - centroX;
      const dyMouse = gameState.mouse.y - centroY;
      const distMouse = Math.hypot(dxMouse, dyMouse);

      if (distMouse > 15) {
        anguloDesejado = Math.atan2(dyMouse, dxMouse);
      }
    }

    if (anguloDesejado !== null) {
      let diferencaAngulo = anguloDesejado - gameState.anguloAtual;

      while (diferencaAngulo < -Math.PI) diferencaAngulo += Math.PI * 2;
      while (diferencaAngulo > Math.PI) diferencaAngulo -= Math.PI * 2;

      if (Math.abs(diferencaAngulo) < CONFIG.taxaGiro) {
        gameState.anguloAtual = anguloDesejado;
      } else {
        gameState.anguloAtual += Math.sign(diferencaAngulo) * CONFIG.taxaGiro;
      }
    }
  }

  const velAtual = gameState.entradaAtiva ? CONFIG.velocidadeDigitando : CONFIG.velocidade;
  cabeca.x += Math.cos(gameState.anguloAtual) * velAtual;
  cabeca.y += Math.sin(gameState.anguloAtual) * velAtual;

  for (let i = 1; i < gameState.segmentos.length; i++) {
    const segAtual = gameState.segmentos[i];
    const segFrente = gameState.segmentos[i - 1];

    const distDx = segFrente.x - segAtual.x;
    const distDy = segFrente.y - segAtual.y;
    const dist = Math.hypot(distDx, distDy);

    if (dist > CONFIG.distanciaEntreSegmentos) {
      const ang = Math.atan2(distDy, distDx);
      segAtual.x = segFrente.x - Math.cos(ang) * CONFIG.distanciaEntreSegmentos;
      segAtual.y = segFrente.y - Math.sin(ang) * CONFIG.distanciaEntreSegmentos;
    }
  }
}

export function atualizarParticulas() {
  for (let i = gameState.particulas.length - 1; i >= 0; i--) {
    const p = gameState.particulas[i];
    p.x += p.vx;
    p.y += p.vy;
    p.opacidade -= 0.035;
    if (p.opacidade <= 0) gameState.particulas.splice(i, 1);
  }
}

export function desenharCabecaRealista(ctx, x, y, raio) {
  if (possuiEmojiCustomizado && emojiCabecaImg.complete && emojiCabecaImg.naturalWidth !== 0) {
    const fatorVisual = 1.35;
    const tamanho = (raio * 2) * fatorVisual;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(gameState.anguloAtual - Math.PI / 2);
    ctx.drawImage(emojiCabecaImg, -tamanho / 2, -tamanho / 2, tamanho, tamanho);
    ctx.restore();
    return;
  }

  // Corpo Único Padrão
  ctx.beginPath();
  ctx.arc(x, y, raio, 0, Math.PI * 2);
  ctx.fillStyle = corCorpoCobra;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 4;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Olhos direcionais
  const ang = gameState.anguloAtual;
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);

  const distFrente = raio * 0.35;
  const distLateral = raio * 0.45;
  const raioOlho = raio * 0.22;
  const raioPupila = raioOlho * 0.45;

  const o1X = x + cos * distFrente - sin * (-distLateral);
  const o1Y = y + sin * distFrente + cos * (-distLateral);

  const o2X = x + cos * distFrente - sin * distLateral;
  const o2Y = y + sin * distFrente + cos * distLateral;

  ctx.beginPath();
  ctx.arc(o1X, o1Y, raioOlho, 0, Math.PI * 2);
  ctx.arc(o2X, o2Y, raioOlho, 0, Math.PI * 2);
  ctx.fillStyle = "#161326";
  ctx.fill();

  const brilhoOffX = cos * (raioOlho * 0.35);
  const brilhoOffY = sin * (raioOlho * 0.35);

  ctx.beginPath();
  ctx.arc(o1X + brilhoOffX, o1Y + brilhoOffY, raioPupila, 0, Math.PI * 2);
  ctx.arc(o2X + brilhoOffX, o2Y + brilhoOffY, raioPupila, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
}