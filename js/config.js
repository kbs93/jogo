export const CONFIG = {
  velocidade: 3.2,
  velocidadeDigitando: 0.8,
  taxaGiro: 0.12,
  raioSegmento: 18,
  distanciaEntreSegmentos: 13,
  totalSegmentosInicial: 5,
  tempoBase: 5,
  // === SEU CONTROLE MANUAL DE CONTAS ===
  totalAlvos: 5,                  // Quantidade exata de contas no mapa
  operacao: "misto",      // "multiplicacao", "soma", "subtracao" ou "divisao"
  distanciaMinimaEntreAlvos: 260, // Distância em pixels para nunca nascerem juntas
  cooldownColisaoMs: 800          // Tempo para evitar colisão dupla imediata
};

export const gameState = {
  pontos: 0,
  recorde: parseInt(localStorage.getItem("mathSnakeHighScore") || "0", 10),
  emJogo: true,
  anguloAtual: 0,
  entradaAtiva: false,
  bloqueioInput: false,
  tempoRestante: 5,
  timerInterval: null,
  alvoAtivo: null,
  segmentos: [],
  particulas: [],
  alvos: [],
  mouse: {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  },
  teclas: { w: false, a: false, s: false, d: false },
  outrosJogadores: {}
};