import { gameState } from "./config.js";

export function criarContaAleatoria() {
  const n1 = Math.floor(Math.random() * 8) + 2;
  const n2 = Math.floor(Math.random() * 8) + 2;
  const cabeca = gameState.segmentos[0] || { x: 0, y: 0 };
  const distSpawn = 320 + Math.random() * 300;
  const angSpawn = gameState.anguloAtual + (Math.random() - 0.5) * 2.8;

  return {
    id: Math.random(),
    x: cabeca.x + Math.cos(angSpawn) * distSpawn,
    y: cabeca.y + Math.sin(angSpawn) * distSpawn,
    num1: n1,
    num2: n2,
    resultado: n1 * n2,
    texto: `${n1}x${n2}`
  };
}

export function popularAlvosIniciais() {
  gameState.alvos.length = 0;
  for (let i = 0; i < 3; i++) {
    gameState.alvos.push(criarContaAleatoria());
  }
}