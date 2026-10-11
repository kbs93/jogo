import { gameState } from "./config.js";
import { consumirAlvoNoServidor } from "./multiplayer.js";

export function criarContaAleatoria() {
  // Retorna nulo localmente pois as contas são geridas pelo servidor WebSocket
  return null;
}

export function popularAlvosIniciais() {
  // Mantém array preparado; os alvos chegam sincronizados via socket
  gameState.alvos = gameState.alvos || [];
}

export function removerAlvoSincronizado(alvoId) {
  consumirAlvoNoServidor(alvoId);
}