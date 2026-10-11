import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 3000 });
const jogadores = new Map();
let alvos = [];

// Gera uma conta única compartilhada
function gerarConta() {
  const n1 = Math.floor(Math.random() * 8) + 2;
  const n2 = Math.floor(Math.random() * 8) + 2;
  const ang = Math.random() * Math.PI * 2;
  const dist = 250 + Math.random() * 900;

  return {
    id: Math.random().toString(36).substring(2, 9),
    x: Math.round(Math.cos(ang) * dist),
    y: Math.round(Math.sin(ang) * dist),
    num1: n1,
    num2: n2,
    resultado: n1 * n2,
    texto: `${n1}x${n2}`
  };
}

// Inicializa 6 contas na arena compartilhada
for (let i = 0; i < 6; i++) {
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
        alvos = alvos.filter((a) => a.id !== pacote.id);
        alvos.push(gerarConta());

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