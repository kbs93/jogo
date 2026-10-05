import { CONFIG, gameState } from "./config.js";

const emojiCabecaImg = new Image();
emojiCabecaImg.src = "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Grinning%20face%20with%20big%20eyes/3D/grinning_face_with_big_eyes_3d.png";

/**
 * Atualiza o avatar da cobra com o SVG salvo no Firebase
 */
export function definirAvatarCobra(svgString) {
  if (!svgString) return;

  let svgTratado = svgString;

  // 1. Garante o namespace XML para o Canvas aceitar o SVG
  if (!svgTratado.includes("xmlns=")) {
    svgTratado = svgTratado.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // 2. Garante dimensões explícitas para cálculo de naturalWidth
  if (!svgTratado.includes("width=")) {
    svgTratado = svgTratado.replace("<svg", '<svg width="128" height="128"');
  }

  // 3. Conversão para Base64 segura e síncrona (não expira na memória)
  try {
    const base64 = btoa(unescape(encodeURIComponent(svgTratado)));
    emojiCabecaImg.src = `data:image/svg+xml;base64,${base64}`;
  } catch (e) {
    emojiCabecaImg.src = `data:image/svg+xml;utf8,${encodeURIComponent(svgTratado)}`;
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
      cor: Math.random() > 0.3 ? "#ff3366" : "#ff9900"
    });
  }
}

export function atualizarCobra() {
  const cabeca = gameState.segmentos[0];
  const centroX = window.innerWidth / 2;
  const centroY = window.innerHeight / 2;

  // Se NÃO estiver a resolver uma conta, processa teclado ou rato
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

  // Deslocamento contínuo
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
  const fatorVisual = 1.28;
  const tamanho = (raio * 2) * fatorVisual;

  if (emojiCabecaImg.complete && emojiCabecaImg.naturalWidth !== 0) {
    ctx.drawImage(emojiCabecaImg, x - tamanho / 2, y - tamanho / 2, tamanho, tamanho);
  } else {
    ctx.beginPath();
    ctx.arc(x, y, raio, 0, Math.PI * 2);
    ctx.fillStyle = "#f5a623";
    ctx.fill();
  }
}