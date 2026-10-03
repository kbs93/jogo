import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCFuvleJ2RUcuABvINmzb9HtWf_a13lvAA",
  authDomain: "jogo1-8e630.firebaseapp.com",
  projectId: "jogo1-8e630",
  storageBucket: "jogo1-8e630.firebasestorage.app",
  messagingSenderId: "831994468997",
  appId: "1:831994468997:web:5b4e9f9a92b0556512e7ec",
  measurementId: "G-X9E197ESMM"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Grava a configuração do jogador no Firestore
export async function salvarConfigJogador(modo) {
  try {
    await setDoc(doc(db, "configuracoes", "jogadorAtual"), {
      modoEscolhido: modo,
      atualizadoEm: new Date()
    });
  } catch (erro) {
    console.error("Erro ao salvar configuração:", erro);
  }
}

// Obtém a configuração ativa do jogador
export async function carregarConfigJogador() {
  try {
    const snap = await getDoc(doc(db, "configuracoes", "jogadorAtual"));
    if (snap.exists()) {
      return snap.data().modoEscolhido || "multiplicacao";
    }
  } catch (erro) {
    console.error("Erro ao carregar configuração:", erro);
  }
  return "multiplicacao";
}