import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 3000 });
const jogadores = new Map();
let alvos = []; // Apenas armazena as contas enviadas pelo math.js do frontend

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

        // Envia as contas ativas para quem acabou de entrar
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

      // O frontend (math.js) criou uma nova conta: o server apenas replica para todos
      if (pacote.tipo === "adicionarAlvo" && pacote.alvo) {
        alvos.push(pacote.alvo);
        const msgAlvos = JSON.stringify({ tipo: "alvos", alvos });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(msgAlvos);
          }
        });
        return;
      }

      // O jogador acertou a conta: o server apenas remove e avisa todos
      if (pacote.tipo === "consumirAlvo") {
        alvos = alvos.filter((a) => a.id !== pacote.id);
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