import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 3000 });
const jogadores = new Map();
let alvos = [];

const TOTAL_MAX_ALVOS = 6;
const DISTANCIA_MINIMA_ENTRE_CONTAS = 220;

// Gera uma conta única garantindo distância das outras já existentes
function gerarConta() {
  const n1 = Math.floor(Math.random() * 8) + 2;
  const n2 = Math.floor(Math.random() * 8) + 2;

  let novaPos = { x: 0, y: 0 };
  let tentativas = 0;
  let posicaoValida = false;

  while (!posicaoValida && tentativas < 30) {
    tentativas++;
    const ang = Math.random() * Math.PI * 2;
    const dist = 300 + Math.random() * 850;
    novaPos.x = Math.round(Math.cos(ang) * dist);
    novaPos.y = Math.round(Math.sin(ang) * dist);

    // Evita criar conta em cima ou colada em qualquer conta existente
    const muitoPerto = alvos.some(
      (a) => Math.hypot(a.x - novaPos.x, a.y - novaPos.y) < DISTANCIA_MINIMA_ENTRE_CONTAS
    );

    if (!muitoPerto) {
      posicaoValida = true;
    }
  }

  return {
    id: Math.random().toString(36).substring(2, 9),
    x: novaPos.x,
    y: novaPos.y,
    num1: n1,
    num2: n2,
    resultado: n1 * n2,
    texto: `${n1}x${n2}`
  };
}

// Inicializa exatamente a quantidade controlada de contas
while (alvos.length < TOTAL_MAX_ALVOS) {
  alvos.push(gerarConta());
}

wss.on("connection", (ws) => {
  let jogadorId = null;

  ws.on("message", (msgBruta) => {
    try {
      const pacote = JSON.parse(msgBruta);

      if (pacote.tipo === "entrar") {
        jogadorId = pacote.id;
        jogadores.set(jogadorId, {
          id: jogadorId,
          apelido: pacote.apelido,
          cor: pacote.cor,
          emojiSvg: pacote.emojiSvg,
          x: pacote.x || 0,
          y: pacote.y || 0,
          angulo: pacote.angulo || 0,
          tamanho: pacote.tamanho || 5
        });

        // Envia as contas atuais para quem acabou de entrar
        ws.send(JSON.stringify({ tipo: "alvos", alvos }));
        return;
      }

      if (pacote.tipo === "mover" && jogadorId) {
        const j = jogadores.get(jogadorId);
        if (j) {
          j.x = pacote.x;
          j.y = pacote.y;
          j.angulo = pacote.angulo;
          j.tamanho = pacote.tamanho;
        }
        return;
      }

      // Quando qualquer jogador resolve ou consome uma conta
      if (pacote.tipo === "consumirAlvo") {
        // Remove a conta consumida
        alvos = alvos.filter((a) => a.id !== pacote.id);

        // Repõe apenas até o limite fixo, sem acumular ou multiplicar
        while (alvos.length < TOTAL_MAX_ALVOS) {
          alvos.push(gerarConta());
        }

        const msgAlvos = JSON.stringify({ tipo: "alvos", alvos });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(msgAlvos);
          }
        });
      }
    } catch (e) {}
  });

  ws.on("close", () => {
    if (jogadorId) {
      jogadores.delete(jogadorId);
      const msgSaida = JSON.stringify({ tipo: "remover", id: jogadorId });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msgSaida);
        }
      });
    }
  });
});

// Transmissão contínua a 30 FPS da arena
setInterval(() => {
  if (jogadores.size === 0) return;

  const dadosArena = JSON.stringify({
    tipo: "arena",
    jogadores: Array.from(jogadores.values())
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(dadosArena);
    }
  });
}, 33);

console.log("Servidor WebSocket do jogo rodando na porta 3000!");