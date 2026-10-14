import { gameState, CONFIG } from "./config.js";
import { obterCorCorpoCobra } from "./snake.js";

let socket = null;
let intervaloSync = null;
export const cacheImagensAvatares = {};

export function consumirAlvoNoServidor(alvoId) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ tipo: "consumirAlvo", id: alvoId }));
  }
}
export function enviarNovaContaAoServidor(conta) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ tipo: "adicionarAlvo", alvo: conta }));
  }
}
export function iniciarMultiplayer(usuarioId, perfilJogador) {
  if (!usuarioId) return;

  // Conexão automática pelo host atual (localhost ou IP da rede local)
  const hostAtual = window.location.hostname || "localhost";
  socket = new WebSocket(`ws://${hostAtual}:3000`);

  socket.addEventListener("open", () => {
    const cabeca = gameState.segmentos[0] || { x: 0, y: 0 };

    socket.send(JSON.stringify({
      tipo: "entrar",
      id: usuarioId,
      apelido: perfilJogador.apelido || "PLAYER",
      cor: obterCorCorpoCobra(),
      emojiSvg: perfilJogador.emojiSvg || "",
      x: Math.round(cabeca.x),
      y: Math.round(cabeca.y),
      angulo: Number(gameState.anguloAtual.toFixed(2)),
      tamanho: gameState.segmentos.length || CONFIG.totalSegmentosInicial
    }));

    // Envio a 30 FPS
    intervaloSync = setInterval(() => {
      if (!gameState.emJogo || gameState.segmentos.length === 0 || socket.readyState !== WebSocket.OPEN) return;

      const cab = gameState.segmentos[0];
      socket.send(JSON.stringify({
        tipo: "mover",
        x: Math.round(cab.x),
        y: Math.round(cab.y),
        angulo: Number(gameState.anguloAtual.toFixed(2)),
        tamanho: gameState.segmentos.length
      }));
    }, 33);
  });

  socket.addEventListener("message", (evento) => {
    try {
      const msg = JSON.parse(evento.data);

      // 1. Sincronização das contas compartilhadas
      // 1. Sincronização das contas
      if (msg.tipo === "alvos" && Array.isArray(msg.alvos)) {
        // Se o servidor estiver sem contas, o cliente cria e popula imediatamente
        if (msg.alvos.length === 0) {
          import("./math.js").then((m) => m.popularAlvosIniciais());
        } else {
          gameState.alvos = msg.alvos.slice(0, CONFIG.totalAlvos);
        }
        return;
      }
      // 2. Sincronização dos jogadores
      if (msg.tipo === "arena") {
        const idsAtivos = new Set();

        msg.jogadores.forEach((d) => {
          if (d.id === usuarioId) return;
          idsAtivos.add(d.id);

          if (!gameState.outrosJogadores[d.id]) {
            const segsIniciais = [];
            const qtd = d.tamanho || CONFIG.totalSegmentosInicial;
            for (let i = 0; i < qtd; i++) {
              segsIniciais.push({ x: d.x - (i * CONFIG.distanciaEntreSegmentos), y: d.y });
            }

            gameState.outrosJogadores[d.id] = {
              apelido: d.apelido || "PLAYER",
              cor: d.cor || "#ff5555",
              angulo: d.angulo || 0,
              anguloAlvo: d.angulo || 0,
              cabecaAlvo: { x: d.x, y: d.y },
              tamanhoAlvo: qtd,
              segmentos: segsIniciais
            };
          } else {
            const o = gameState.outrosJogadores[d.id];
            o.apelido = d.apelido;
            o.cor = d.cor;
            o.anguloAlvo = d.angulo;
            o.cabecaAlvo = { x: d.x, y: d.y };
            o.tamanhoAlvo = d.tamanho || o.segmentos.length;
          }

          if (d.emojiSvg && !cacheImagensAvatares[d.id]) {
            const img = new Image();
            let svgTratado = d.emojiSvg;
            if (!svgTratado.includes("xmlns=")) svgTratado = svgTratado.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
            if (!svgTratado.includes("width=")) svgTratado = svgTratado.replace("<svg", '<svg width="128" height="128"');
            try {
              img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgTratado)))}`;
            } catch (e) {
              img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svgTratado)}`;
            }
            cacheImagensAvatares[d.id] = img;
          }
        });

        for (const id in gameState.outrosJogadores) {
          if (!idsAtivos.has(id)) {
            delete gameState.outrosJogadores[id];
            delete cacheImagensAvatares[id];
          }
        }
      }

      if (msg.tipo === "remover") {
        delete gameState.outrosJogadores[msg.id];
        delete cacheImagensAvatares[msg.id];
      }
    } catch (e) {}
  });
}



export function atualizarOutrosJogadores() {
  for (const id in gameState.outrosJogadores) {
    const o = gameState.outrosJogadores[id];
    if (!o.segmentos || o.segmentos.length === 0) continue;

    const cabeca = o.segmentos[0];

    // 1. Desliza a cabeça em direção ao alvo real com velocidade natural
    if (o.cabecaAlvo) {
      const dx = o.cabecaAlvo.x - cabeca.x;
      const dy = o.cabecaAlvo.y - cabeca.y;
      const dist = Math.hypot(dx, dy);

      // Se estiver muito longe (teletransporte inicial), encaixa de vez
      if (dist > 250) {
        cabeca.x = o.cabecaAlvo.x;
        cabeca.y = o.cabecaAlvo.y;
      } else if (dist > 1) {
        // Interpolação suave e contínua a 60 FPS
        cabeca.x += dx * 0.25;
        cabeca.y += dy * 0.25;
      }
    }

    // 2. Curvatura suave do ângulo da cabeça
    if (typeof o.anguloAlvo === "number") {
      let diff = o.anguloAlvo - o.angulo;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      o.angulo += diff * 0.25;
    }

    // 3. Ajuste suave de gomos (se crescer ou diminuir)
    while (o.segmentos.length < o.tamanhoAlvo) {
      const ult = o.segmentos[o.segmentos.length - 1];
      o.segmentos.push({ x: ult.x, y: ult.y });
    }
    while (o.segmentos.length > o.tamanhoAlvo) {
      o.segmentos.pop();
    }

    // 4. Cada gomo segue o gomo da frente com distância fixa estrita
    for (let i = 1; i < o.segmentos.length; i++) {
      const segAtual = o.segmentos[i];
      const segFrente = o.segmentos[i - 1];

      const dx = segFrente.x - segAtual.x;
      const dy = segFrente.y - segAtual.y;
      const dist = Math.hypot(dx, dy);

      if (dist > CONFIG.distanciaEntreSegmentos) {
        const ang = Math.atan2(dy, dx);
        segAtual.x = segFrente.x - Math.cos(ang) * CONFIG.distanciaEntreSegmentos;
        segAtual.y = segFrente.y - Math.sin(ang) * CONFIG.distanciaEntreSegmentos;
      }
    }
  }
}

export function pararMultiplayer() {
  if (intervaloSync) {
    clearInterval(intervaloSync);
    intervaloSync = null;
  }
  if (socket) {
    socket.close();
    socket = null;
  }
}