import { CONFIG, gameState } from "./config.js";
import { criarContaAleatoria, popularAlvosIniciais } from "./math.js";
import {
  criarEfeitoPerdaGomo,
  atualizarCobra,
  atualizarParticulas,
  desenharCabecaRealista,
  definirAvatarCobra
} from "./snake.js";
import { db } from "./firebaseConfig.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Elementos da interface capturados primeiro (evita erro de canvas indefinido)
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const inputContainer = document.getElementById("inputContainer");
const mathInput = document.getElementById("mathInput");
const timerTxt = document.getElementById("timerTxt");
const pontosTxt = document.getElementById("pontosTxt");
const recordeTxt = document.getElementById("recordeTxt");
const gameOverModal = document.getElementById("gameOverModal");
const pontosFinalTxt = document.getElementById("pontosFinalTxt");
const recordeFinalTxt = document.getElementById("recordeFinalTxt");
const btnReiniciar = document.getElementById("btnReiniciar");

// 2. Leitura do UID pela URL e busca direta no Firestore
const params = new URLSearchParams(window.location.search);
export const usuarioId = params.get("uid");

export let perfilJogador = {
  id: usuarioId || null,
  apelido: "",
  recorde: 0,
  emojiSvg: ""
};

if (usuarioId) {
  getDoc(doc(db, "usuarios", usuarioId))
    .then((snap) => {
      if (snap.exists()) {
        const dados = snap.data();
        perfilJogador.apelido = dados.apelido || "";
        perfilJogador.recorde = dados.recorde || 0;
        perfilJogador.emojiSvg = dados.emojiSvg || "";
        gameState.recorde = perfilJogador.recorde;
        if (recordeTxt) recordeTxt.textContent = gameState.recorde;

        // Aplica o avatar salvo no Firebase na cabeça da cobra
        if (dados.emojiSvg) {
          definirAvatarCobra(dados.emojiSvg);
        }
      }
    })
    .catch((err) => console.error("Erro ao carregar dados do jogador:", err));
}

function redimensionar() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", redimensionar);
redimensionar();

window.addEventListener("mousemove", (e) => {
  gameState.mouse.x = e.clientX;
  gameState.mouse.y = e.clientY;
});

function pararTimer() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
}

function dispararGameOver() {
  gameState.emJogo = false;
  pararTimer();
  inputContainer.style.display = "none";

if (gameState.pontos > gameState.recorde) {
    gameState.recorde = gameState.pontos;
    recordeTxt.textContent = gameState.recorde;

    // Atualiza diretamente no documento do usuário no Firebase (sem localStorage)
    if (usuarioId) {
      updateDoc(doc(db, "usuarios", usuarioId), {
        recorde: gameState.recorde,
        ultimoAcesso: new Date()
      }).catch(err => console.error("Erro ao salvar recorde no Firebase:", err));
    }
  }

  pontosFinalTxt.textContent = gameState.pontos;
  recordeFinalTxt.textContent = gameState.recorde;
  gameOverModal.style.display = "flex";
}

function iniciarTimer() {
  pararTimer();
  gameState.tempoRestante = CONFIG.tempoBase;
  timerTxt.textContent = gameState.tempoRestante;
  gameState.timerInterval = setInterval(() => {
    gameState.tempoRestante--;
    timerTxt.textContent = gameState.tempoRestante;

    if (gameState.tempoRestante <= 0) {
      mathInput.value = "";
      mathInput.classList.remove("erro");
      gameState.bloqueioInput = false;

      if (gameState.segmentos.length > 1) {
        const gomoRemovido = gameState.segmentos.pop();
        criarEfeitoPerdaGomo(gomoRemovido.x, gomoRemovido.y);
      }

      if (gameState.segmentos.length <= 1) {
        dispararGameOver();
        return;
      }

      if (gameState.alvoAtivo) {
        const idx = gameState.alvos.findIndex((a) => a.id === gameState.alvoAtivo.id);
        if (idx !== -1) gameState.alvos.splice(idx, 1);
        gameState.alvos.push(criarContaAleatoria());
      }

      gameState.alvoAtivo = null;
      gameState.entradaAtiva = false;
      inputContainer.style.display = "none";
      pararTimer();
    }
  }, 1000);
}

function reiniciarJogo() {
  gameState.pontos = 0;
  pontosTxt.textContent = "0";
  gameState.emJogo = true;
  gameState.entradaAtiva = false;
  gameState.bloqueioInput = false;
  gameState.alvoAtivo = null;
  gameState.particulas.length = 0;
  mathInput.classList.remove("erro");
  mathInput.value = "";
  inputContainer.style.display = "none";
  gameOverModal.style.display = "none";

  gameState.segmentos.length = 0;
  gameState.anguloAtual = 0;
  gameState.mouse.x = window.innerWidth / 2 + 100;
  gameState.mouse.y = window.innerHeight / 2;

  for (let i = 0; i < CONFIG.totalSegmentosInicial; i++) {
    gameState.segmentos.push({ x: -i * CONFIG.distanciaEntreSegmentos, y: 0 });
  }

  popularAlvosIniciais();
}

document.addEventListener("click", () => {
  if (gameState.entradaAtiva && gameState.emJogo && !gameState.bloqueioInput) {
    mathInput.focus();
  }
});

btnReiniciar.addEventListener("click", reiniciarJogo);

mathInput.addEventListener("input", () => {
  if (gameState.bloqueioInput || !gameState.alvoAtivo) return;

  mathInput.value = mathInput.value.replace(/\D/g, "");
  const digitado = mathInput.value;
  if (!digitado) return;

  const valorInt = parseInt(digitado, 10);
  const strEsperada = String(gameState.alvoAtivo.resultado);

  if (valorInt === gameState.alvoAtivo.resultado) {
    gameState.pontos += 2;
    pontosTxt.textContent = gameState.pontos;
    mathInput.value = "";

    const ultimo = gameState.segmentos[gameState.segmentos.length - 1];
    gameState.segmentos.push({ x: ultimo.x, y: ultimo.y });

    const idx = gameState.alvos.findIndex((a) => a.id === gameState.alvoAtivo.id);
    if (idx !== -1) gameState.alvos.splice(idx, 1);
    gameState.alvos.push(criarContaAleatoria());

    gameState.alvoAtivo = null;
    gameState.entradaAtiva = false;
    inputContainer.style.display = "none";
    pararTimer();
    return;
  }

  if (digitado.length >= strEsperada.length) {
    gameState.bloqueioInput = true;
    mathInput.classList.add("erro");

    setTimeout(() => {
      mathInput.value = "";
      mathInput.classList.remove("erro");
      gameState.bloqueioInput = false;
      mathInput.focus();
    }, 180);
  }
});

function atualizar() {
  atualizarCobra();
  atualizarParticulas();

  const cabeca = gameState.segmentos[0];
  if (!gameState.entradaAtiva) {
    const raioAtivacao = 50;
    for (let i = 0; i < gameState.alvos.length; i++) {
      const a = gameState.alvos[i];
      const dist = Math.hypot(a.x - cabeca.x, a.y - cabeca.y);
      if (dist <= raioAtivacao) {
        gameState.alvoAtivo = a;
        gameState.entradaAtiva = true;
        inputContainer.style.display = "flex";
        mathInput.value = "";
        mathInput.focus();
        iniciarTimer();
        break;
      }
    }
  }
}



// Textura favo de mel BLOCO HEXAGONAL PISO
const offscreenCanvas = document.createElement("canvas");
const offscreenCtx = offscreenCanvas.getContext("2d");
const raioHex = 200;
const larguraHex = Math.sqrt(3) * raioHex;
const alturaHex = 2 * raioHex;

offscreenCanvas.width = larguraHex;
offscreenCanvas.height = alturaHex * 1.5;

function desenharHexagonoUnitario(cx, cy, r) {
  const pontos = [];
  for (let i = 0; i < 6; i++) {
    const angulo = (Math.PI / 180) * (60 * i + 30);
    pontos.push({
      x: cx + r * Math.cos(angulo),
      y: cy + r * Math.sin(angulo)
    });
  }

  // 1. Base e preenchimento com luz zenital (deslocada para cima)
  offscreenCtx.beginPath();
  pontos.forEach((p, idx) => {
    if (idx === 0) offscreenCtx.moveTo(p.x, p.y);
    else offscreenCtx.lineTo(p.x, p.y);
  });
  offscreenCtx.closePath();

  const grad = offscreenCtx.createRadialGradient(cx, cy - r * 0.25, 2, cx, cy, r);
  grad.addColorStop(0, "#2d276b");
  grad.addColorStop(0.65, "#17143f");
  grad.addColorStop(1, "#0a091d");
  offscreenCtx.fillStyle = grad;
  offscreenCtx.fill();

  // 2. Chanfro Inferior (Sombra profunda da pastilha)
  offscreenCtx.beginPath();
  offscreenCtx.moveTo(pontos[0].x, pontos[0].y);
  offscreenCtx.lineTo(pontos[1].x, pontos[1].y);
  offscreenCtx.lineTo(pontos[2].x, pontos[2].y);
  offscreenCtx.strokeStyle = "#060512";
  offscreenCtx.lineWidth = 3;
  offscreenCtx.stroke();

  // 3. Chanfro Superior (Borda chanfrada iluminada / Relevo)
  offscreenCtx.beginPath();
  offscreenCtx.moveTo(pontos[3].x, pontos[3].y);
  offscreenCtx.lineTo(pontos[4].x, pontos[4].y);
  offscreenCtx.lineTo(pontos[5].x, pontos[5].y);
  offscreenCtx.lineTo(pontos[0].x, pontos[0].y);
  offscreenCtx.strokeStyle = "#463d9e";
  offscreenCtx.lineWidth = 2.5;
  offscreenCtx.stroke();
}

desenharHexagonoUnitario(larguraHex / 2, alturaHex * 0.75, raioHex - 2);
desenharHexagonoUnitario(0, 0, raioHex - 2);
desenharHexagonoUnitario(larguraHex, 0, raioHex - 2);
desenharHexagonoUnitario(0, alturaHex * 1.5, raioHex - 2);
desenharHexagonoUnitario(larguraHex, alturaHex * 1.5, raioHex - 2);

const texturaFundoHex = ctx.createPattern(offscreenCanvas, "repeat");

function desenhar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cabeca = gameState.segmentos[0] || { x: 0, y: 0 };
  const centroX = window.innerWidth / 2;
  const centroY = window.innerHeight / 2;

  ctx.save();
  ctx.translate(centroX - cabeca.x, centroY - cabeca.y);

  // Grid
// Grid otimizado com único batch de desenho
// Fundo favo de mel infinito em lote único
  ctx.fillStyle = texturaFundoHex;
  ctx.fillRect(cabeca.x - centroX, cabeca.y - centroY, canvas.width, canvas.height);

  // Alvos matemáticos
// Alvos matemáticos estilizados em pastilha flutuante
  if (gameState.emJogo) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < gameState.alvos.length; i++) {
      const a = gameState.alvos[i];
      const isAtivo = gameState.alvoAtivo && gameState.alvoAtivo.id === a.id;

      // Medição da largura da pílula com margem para a conta
      ctx.font = "bold 24px monospace";
      const larguraTexto = ctx.measureText(a.texto).width;
      const larguraPilula = Math.max(larguraTexto + 32, 80);
      const alturaPilula = 44;
      const raioBorda = alturaPilula / 2;

      const px = a.x - larguraPilula / 2;
      const py = a.y - alturaPilula / 2;

      // 1. Sombra e Brilho Neon (Orbe Flutuante)
      ctx.save();
      ctx.shadowColor = isAtivo ? "#ffe600" : "#00f0ff";
      ctx.shadowBlur = isAtivo ? 20 : 12;

      // 2. Fundo da Pastilha (translúcido com gradiente suave)
      const gradientePastilha = ctx.createLinearGradient(a.x, py, a.x, py + alturaPilula);
      if (isAtivo) {
        gradientePastilha.addColorStop(0, "rgba(255, 230, 0, 0.95)");
        gradientePastilha.addColorStop(1, "rgba(210, 160, 0, 0.95)");
      } else {
        gradientePastilha.addColorStop(0, "rgba(10, 25, 45, 0.88)");
        gradientePastilha.addColorStop(1, "rgba(5, 12, 24, 0.92)");
      }

      ctx.beginPath();
      ctx.roundRect(px, py, larguraPilula, alturaPilula, raioBorda);
      ctx.fillStyle = gradientePastilha;
      ctx.fill();

      // 3. Contorno Chanfrado / Borda de Energia
      ctx.lineWidth = isAtivo ? 3.5 : 2;
      ctx.strokeStyle = isAtivo ? "#ffffff" : "#00f0ff";
      ctx.stroke();
      ctx.restore();

      // 4. Texto da Conta
      ctx.fillStyle = isAtivo ? "#000000" : "#ffffff";
      ctx.fillText(a.texto, a.x, a.y + 1);
    }
  }

  // Partículas
  for (let i = 0; i < gameState.particulas.length; i++) {
    const p = gameState.particulas[i];
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.opacidade);
    ctx.fillStyle = p.cor;
    ctx.shadowColor = p.cor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Corpo da Cobra
  for (let i = gameState.segmentos.length - 1; i > 0; i--) {
    const seg = gameState.segmentos[i];
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, CONFIG.raioSegmento, 0, Math.PI * 2);
    ctx.fillStyle = "#f5d442";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 4;
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Cabeça do Emoji
  desenharCabecaRealista(ctx, cabeca.x, cabeca.y, CONFIG.raioSegmento);

  ctx.restore();
}

function loop() {
  if (gameState.emJogo) {
    atualizar();
  }
  desenhar();
  requestAnimationFrame(loop);
}

reiniciarJogo();
loop();

window.addEventListener("keydown", (e) => {
  const tecla = e.key.toLowerCase();
  if (["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(tecla)) {
    if (tecla === "w" || tecla === "arrowup") gameState.teclas.w = true;
    if (tecla === "a" || tecla === "arrowleft") gameState.teclas.a = true;
    if (tecla === "s" || tecla === "arrowdown") gameState.teclas.s = true;
    if (tecla === "d" || tecla === "arrowright") gameState.teclas.d = true;
  }
});

window.addEventListener("keyup", (e) => {
  const tecla = e.key.toLowerCase();
  if (tecla === "w" || tecla === "arrowup") gameState.teclas.w = false;
  if (tecla === "a" || tecla === "arrowleft") gameState.teclas.a = false;
  if (tecla === "s" || tecla === "arrowdown") gameState.teclas.s = false;
  if (tecla === "d" || tecla === "arrowright") gameState.teclas.d = false;
});