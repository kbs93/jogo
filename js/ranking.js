import { db } from "./firebaseConfig.js";
import { bancoSvgEmojis } from "./emoji.js";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const listaRankingContainer = document.getElementById("listaRankingTop50");
const painelRanking = document.getElementById("painelRanking");
const btnAbrirLeaderboard = document.getElementById("btnAbrirLeaderboard");
const btnFecharRanking = document.getElementById("btnFecharRanking");
const overlay = document.getElementById("overlay");

function abrirPainel() {
  if (painelRanking) painelRanking.classList.add("ativo");
  if (overlay) overlay.classList.add("ativo");
}

function fecharPainel() {
  if (painelRanking) painelRanking.classList.remove("ativo");
  if (overlay) overlay.classList.remove("ativo");
}

if (btnAbrirLeaderboard) btnAbrirLeaderboard.addEventListener("click", abrirPainel);
if (btnFecharRanking) btnFecharRanking.addEventListener("click", fecharPainel);

function sanitizarTexto(txt) {
  const div = document.createElement("div");
  div.textContent = txt;
  return div.innerHTML;
}

/**
 * Escuta em tempo real o TOP 50 do Firestore e desenha com miniatura do avatar
 */
export function inicializarRankingRealtime() {
  if (!listaRankingContainer) return;

  const q = query(
    collection(db, "usuarios"),
    orderBy("recorde", "desc"),
    limit(50)
  );

  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      listaRankingContainer.innerHTML = `
        <div style="text-align: center; color: #556a80; font-size: 12px; padding: 20px 0;">
          Nenhum recorde registrado ainda.
        </div>
      `;
      return;
    }

    const fragmento = document.createDocumentFragment();
    let posicao = 1;

    snapshot.forEach((docSnap) => {
      const dados = docSnap.data();
      const nick = sanitizarTexto(dados.apelido || "PLAYER");
      const recorde = typeof dados.recorde === "number" ? dados.recorde : 0;
      const emojiId = dados.emojiId || "pessoas_1";
      const svgMiniatura = dados.emojiSvg || bancoSvgEmojis[emojiId] || "";

      let classePosicao = "pos-padrao";
      if (posicao === 1) classePosicao = "pos-ouro";
      else if (posicao === 2) classePosicao = "pos-prata";
      else if (posicao === 3) classePosicao = "pos-bronze";

      const itemCard = document.createElement("div");
      itemCard.className = `ranking-row-item ${posicao <= 3 ? "destaque-topo" : ""}`;

      itemCard.innerHTML = `
        <div class="ranking-badge-col ${classePosicao}">#${posicao}</div>
        <div class="ranking-avatar-mini" title="${nick}">
          ${svgMiniatura}
        </div>
        <div class="ranking-user-info">
          <span class="ranking-user-nick">${nick}</span>
          <span class="ranking-user-meta">Recorde</span>
        </div>
        <div class="ranking-user-score">${recorde} <small>pts</small></div>
      `;

      fragmento.appendChild(itemCard);
      posicao++;
    });

    listaRankingContainer.innerHTML = "";
    listaRankingContainer.appendChild(fragmento);
  }, (erro) => {
    console.error("Erro ao sincronizar TOP 50:", erro);
    listaRankingContainer.innerHTML = `
      <div style="text-align: center; color: #ff3366; font-size: 11.5px; padding: 15px 0;">
        Falha ao sincronizar placar.
      </div>
    `;
  });
}

// Inicia a sincronização automática
inicializarRankingRealtime();