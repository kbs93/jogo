export const CONFIG = {
  velocidade: 3.2,
  velocidadeDigitando: 0.8,
  taxaGiro: 0.12,
  raioSegmento: 18,
  distanciaEntreSegmentos: 16,
  totalSegmentosInicial: 6,
  tempoBase: 5
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
  teclas: { w: false, a: false, s: false, d: false } // <-- Adicione esta linha
};