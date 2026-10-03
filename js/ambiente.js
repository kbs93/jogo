import { CONFIG, gameState } from "./config.js";
import { criarContaAleatoria, popularAlvosIniciais } from "./math.js";
import {
  criarEfeitoPerdaGomo,
  atualizarCobra,
  atualizarParticulas,
  desenharCabecaRealista
} from "./snake.js";

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

recordeTxt.textContent = gameState.recorde;

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
    localStorage.setItem("mathSnakeHighScore", gameState.recorde);
    recordeTxt.textContent = gameState.recorde;
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

function desenhar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cabeca = gameState.segmentos[0] || { x: 0, y: 0 };
  const centroX = window.innerWidth / 2;
  const centroY = window.innerHeight / 2;

  ctx.save();
  ctx.translate(centroX - cabeca.x, centroY - cabeca.y);

  // Grid
// Grid otimizado com único batch de desenho
  ctx.strokeStyle = "#131e2b";
  ctx.lineWidth = 1;
  const step = 50;
  const offsetX = Math.floor((cabeca.x - centroX) / step) * step;
  const offsetY = Math.floor((cabeca.y - centroY) / step) * step;

  ctx.beginPath();
  for (let x = offsetX - step; x < offsetX + canvas.width + step * 2; x += step) {
    ctx.moveTo(x, offsetY - step);
    ctx.lineTo(x, offsetY + canvas.height + step * 2);
  }
  for (let y = offsetY - step; y < offsetY + canvas.height + step * 2; y += step) {
    ctx.moveTo(offsetX - step, y);
    ctx.lineTo(offsetX + canvas.width + step * 2, y);
  }
  ctx.stroke();

  // Alvos matemáticos
  if (gameState.emJogo) {
    ctx.font = "bold 26px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < gameState.alvos.length; i++) {
      const a = gameState.alvos[i];
      const isAtivo = gameState.alvoAtivo && gameState.alvoAtivo.id === a.id;
      ctx.fillStyle = isAtivo ? "#ffff00" : "#00e5ff";
      ctx.shadowColor = isAtivo ? "#ffff00" : "#00e5ff";
      ctx.shadowBlur = isAtivo ? 18 : 12;
      ctx.fillText(a.texto, a.x, a.y);
    }
    ctx.shadowBlur = 0;
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