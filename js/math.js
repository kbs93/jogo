import { CONFIG, gameState } from "./config.js";
import { consumirAlvoNoServidor, enviarNovaContaAoServidor } from "./multiplayer.js";

// Função geradora controlada por você
export function criarContaAleatoria() {
  const modo = CONFIG.operacao || "misto";
  let tipo = modo;

  if (tipo === "misto") {
    const tipos = ["soma", "subtracao", "multiplicacao", "divisao", "porcentagem"];
    tipo = tipos[Math.floor(Math.random() * tipos.length)];
  }

  let texto = "";
  let resultado = 0;

  if (tipo === "soma") {
    const n1 = Math.floor(Math.random() * 40) + 5;
    const n2 = Math.floor(Math.random() * 40) + 5;
    texto = `${n1}+${n2}`;
    resultado = n1 + n2;
  } else if (tipo === "subtracao") {
    const a = Math.floor(Math.random() * 40) + 10;
    const b = Math.floor(Math.random() * 30) + 2;
    const maior = Math.max(a, b);
    const menor = Math.min(a, b);
    texto = `${maior}-${menor}`;
    resultado = maior - menor;
  } else if (tipo === "divisao") {
    const divisor = Math.floor(Math.random() * 8) + 2;
    const quociente = Math.floor(Math.random() * 9) + 2;
    const dividendo = divisor * quociente; // Garante resultado 100% inteiro
    texto = `${dividendo}÷${divisor}`;
    resultado = quociente;
  } else if (tipo === "porcentagem") {
    const percentuais = [10, 20, 25, 50];
    const pct = percentuais[Math.floor(Math.random() * percentuais.length)];
    const bases = [20, 40, 50, 60, 80, 100, 200];
    const base = bases[Math.floor(Math.random() * bases.length)];
    texto = `${pct}% de ${base}`;
    resultado = Math.round((pct / 100) * base);
  } else {
    // Multiplicação padrão
    const n1 = Math.floor(Math.random() * 8) + 2;
    const n2 = Math.floor(Math.random() * 8) + 2;
    texto = `${n1}x${n2}`;
    resultado = n1 * n2;
  }

  // Sorteia posição mantendo distância mínima
  const ang = Math.random() * Math.PI * 2;
  const dist = 300 + Math.random() * 850;

  return {
    id: Math.random().toString(36).substring(2, 9),
    x: Math.round(Math.cos(ang) * dist),
    y: Math.round(Math.sin(ang) * dist),
    texto: texto,
    resultado: resultado
  };
}

export function popularAlvosIniciais() {
  gameState.alvos = gameState.alvos || [];
  const limite = CONFIG.totalAlvos || 5;

  while (gameState.alvos.length < limite) {
    const nova = criarContaAleatoria();
    gameState.alvos.push(nova);
    enviarNovaContaAoServidor(nova);
  }
}

export function removerAlvoSincronizado(alvoId) {
  consumirAlvoNoServidor(alvoId);
  // Gera uma nova conta controlada pelo seu math.js para repor imediatamente
  const reposicao = criarContaAleatoria();
  gameState.alvos.push(reposicao);
  enviarNovaContaAoServidor(reposicao);
}