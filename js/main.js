import { bancoSvgEmojis, inicializarCatalogo, carregarMaisEmojis } from "./emoji.js";
import { renderizarEditorCores, obterSvgCustomizado } from "./editor.js";
import { autenticarEJogar, buscarPerfilExistente, buscarPerfilPorId } from "./authService.js";

// Estado em memória (Zero localStorage)
let usuarioAtivo = null; // Guarda os dados do usuário autenticado na sessão
let recordeSalvo = 0;
let dificuldadeSalva = "facil";
let operacaoSalva = "soma";
let idEmojiSelecionado = "grinning_eyes";
let svgCustomizadoSalvo = "";

// Elementos da Interface
const blocoLoginPadrao = document.getElementById("blocoLoginPadrao");
const blocoPerfilLogado = document.getElementById("blocoPerfilLogado");
const perfilCardApelidoTxt = document.getElementById("perfilCardApelidoTxt");
const perfilCardEmojiBox = document.getElementById("perfilCardEmojiBox");
const perfilStatMaiorTxt = document.getElementById("perfilStatMaiorTxt");
const perfilStatModoTxt = document.getElementById("perfilStatModoTxt");
const perfilStatPontosTxt = document.getElementById("perfilStatPontosTxt");
const btnPerfilZerarRecorde = document.getElementById("btnPerfilZerarRecorde");
const btnPerfilSair = document.getElementById("btnPerfilSair");
const btnPerfilJogar = document.getElementById("btnPerfilJogar");

const elRecordeMenu = document.getElementById("recordeMenuTxt");
const elRecordeModal = document.getElementById("recordeModalTxt");
const elRankingPontos = document.getElementById("rankingPontosTxt");

function atualizarRecordeVisual(pontos) {
  recordeSalvo = pontos;
  if (elRecordeMenu) elRecordeMenu.textContent = pontos;
  if (elRecordeModal) elRecordeModal.textContent = pontos;
  if (elRankingPontos) elRankingPontos.textContent = `${pontos} pts`;
  if (perfilStatMaiorTxt) perfilStatMaiorTxt.textContent = pontos;
  if (perfilStatPontosTxt) perfilStatPontosTxt.textContent = `${pontos} pts`;
}
atualizarRecordeVisual(0);

// Sistema de Notificações Toast nativo
function showToast(mensagem, tipo = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast-item toast-${tipo}`;

  let icone = 'bi-info-circle-fill';
  if (tipo === 'sucesso') icone = 'bi-check-circle-fill';
  if (tipo === 'alerta') icone = 'bi-exclamation-triangle-fill';

  toast.innerHTML = `
    <i class="bi ${icone} toast-icone"></i>
    <div class="toast-conteudo">${mensagem}</div>
    <button class="toast-fechar">&times;</button>
  `;

  container.appendChild(toast);

  const fechar = () => {
    toast.classList.add('saindo');
    setTimeout(() => toast.remove(), 250);
  };

  toast.querySelector('.toast-fechar').addEventListener('click', fechar);
  setTimeout(fechar, 3200);
}

// Alternância de Telas (Login vs Perfil Logado)
// Alternância de Telas (Login vs Perfil Logado)
// Alternância de Telas (Login vs Perfil Logado)
function exibirPerfil(perfil, pontosUltimaPartida = null) {
  usuarioAtivo = perfil;
  if (blocoLoginPadrao) blocoLoginPadrao.style.display = "none";
  if (blocoPerfilLogado) blocoPerfilLogado.style.display = "flex";

  if (perfilCardApelidoTxt) perfilCardApelidoTxt.textContent = perfil.apelido;
  if (perfilCardEmojiBox) perfilCardEmojiBox.innerHTML = perfil.emojiSvg || bancoSvgEmojis[perfil.emojiId] || "";

  const recordeBanco = typeof perfil.recorde === "number" ? perfil.recorde : 0;
  const pontosPartida = pontosUltimaPartida !== null ? Number(pontosUltimaPartida) : recordeBanco;
  
  // A Maior Pontuação Pessoal é sempre o ápice (o maior entre o banco e o que acabou de fazer)
  const maiorPontuacao = Math.max(recordeBanco, pontosPartida);
  usuarioAtivo.recorde = maiorPontuacao;

  // 1. Caixa Esquerda: MAIOR PONTUAÇÃO PESSOAL
  if (perfilStatMaiorTxt) perfilStatMaiorTxt.textContent = maiorPontuacao;
  if (elRecordeMenu) elRecordeMenu.textContent = maiorPontuacao;
  if (elRecordeModal) elRecordeModal.textContent = maiorPontuacao;
  if (elRankingPontos) elRankingPontos.textContent = `${maiorPontuacao} pts`;

  // 2. Caixa Direita: Recorde Atual da Rodada
  if (perfilStatPontosTxt) perfilStatPontosTxt.textContent = `${pontosPartida} pts`;

  const mapaNomes = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil', frenesi: 'Frenesi' };
  if (perfilStatModoTxt) perfilStatModoTxt.textContent = `Nível: ${mapaNomes[dificuldadeSalva] || 'Fácil'}`;
}

function deslogarEVoltarInicio() {
  usuarioAtivo = null;
  svgCustomizadoSalvo = "";
  idEmojiSelecionado = "grinning_eyes";
  
  const elNick = document.getElementById("inputApelido");
  const elPin = document.getElementById("inputPin");
  const elBox = document.getElementById("emojiPreviewBox");
  const elBtn = document.getElementById("btnIniciarJogo");
  const elPerfil = document.getElementById("blocoPerfilLogado");
  const elLogin = document.getElementById("blocoLoginPadrao");

  if (elNick) elNick.value = "";
  if (elPin) elPin.value = "";
  if (elBox) elBox.innerHTML = '<img src="./img/logo5.png" alt="Apresentação" class="img-apresentacao">';
  if (elPerfil) elPerfil.style.display = "none";
  if (elLogin) elLogin.style.display = "flex";
if (elBtn) {
    elBtn.disabled = false;
    elBtn.textContent = "Jogar";
  }
  const elBtnPerfil = document.getElementById("btnPerfilJogar");
  if (elBtnPerfil) {
    elBtnPerfil.disabled = false;
    elBtnPerfil.textContent = "Jogar";
  }
}

// Reset ao carregar ou voltar pelo histórico
// Checa se o usuário retornou do jogo com seu UID na URL
// Checa se o usuário retornou do jogo com seu UID na URL
// Checa se o usuário retornou do jogo com seu UID na URL
async function verificarSessaoInicial() {
  const params = new URLSearchParams(window.location.search);
  const uidUrl = params.get("uid");
  const ptsUrl = params.get("pts");

  if (uidUrl) {
    if (blocoLoginPadrao) blocoLoginPadrao.style.display = "none";
    
    const perfil = await buscarPerfilPorId(uidUrl);
    if (perfil) {
      exibirPerfil(perfil, ptsUrl);
      return;
    }
  }

  // Garante a URL totalmente limpa se não houver perfil
  if (window.location.search) {
    window.history.replaceState(null, "", window.location.origin + window.location.pathname);
  }
  deslogarEVoltarInicio();
}

verificarSessaoInicial();

window.addEventListener("pageshow", () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("uid")) {
    verificarSessaoInicial();
  }
});


if (btnPerfilSair) {
  btnPerfilSair.addEventListener("click", () => {
    deslogarEVoltarInicio();
    
    // Remove todos os parâmetros da URL de forma canônica e definitiva na pilha de navegação
    const urlLimpa = window.location.origin + window.location.pathname;
    window.history.replaceState(null, "", urlLimpa);
    
    showToast("Você saiu da conta.", "info");
  });
}

if (btnPerfilZerarRecorde) {
  btnPerfilZerarRecorde.addEventListener("click", async () => {
    if (!usuarioAtivo || !usuarioAtivo.id) return;
    usuarioAtivo.recorde = 0;
    atualizarRecordeVisual(0);
    
    // Zera também no Firestore de forma persistente
    try {
      const { doc, updateDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const { db } = await import("./firebaseConfig.js");
      await updateDoc(doc(db, "usuarios", usuarioAtivo.id), {
        recorde: 0,
        ultimoAcesso: serverTimestamp()
      });
      showToast("Recordes zerados com sucesso!", "sucesso");
    } catch (e) {
      showToast("Recorde zerado da sessão.", "alerta");
    }
  });
}

// Controle do Drawer Lateral
const btnHamburguer = document.getElementById("btnHamburguer");
const btnFechar = document.getElementById("btnFechar");
const overlay = document.getElementById("overlay");
const drawer = document.getElementById("drawer");

function abrirMenu() {
  if (drawer) drawer.classList.add("ativo");
  if (overlay) overlay.classList.add("ativo");
}
function fecharMenu() {
  if (drawer) drawer.classList.remove("ativo");
  if (overlay) overlay.classList.remove("ativo");
}

if (btnHamburguer) btnHamburguer.addEventListener("click", abrirMenu);
if (btnFechar) btnFechar.addEventListener("click", fecharMenu);
if (overlay) overlay.addEventListener("click", fecharMenu);

// Sanfona de Operações
const btnToggleModos = document.getElementById("btnToggleModos");
const submenuModos = document.getElementById("submenuModos");
const setaModos = document.getElementById("setaModos");
const btnsOperacao = document.querySelectorAll(".btn-operacao");

if (btnToggleModos && submenuModos) {
  btnToggleModos.addEventListener("click", function() {
    const estaAberto = submenuModos.classList.toggle("aberto");
    btnToggleModos.classList.toggle("aberto", estaAberto);
    if (setaModos) setaModos.style.transform = estaAberto ? "rotate(180deg)" : "rotate(0deg)";
  });
}

btnsOperacao.forEach(function(btn) {
  btn.addEventListener("click", function() {
    btnsOperacao.forEach(function(b) {
      b.classList.remove("ativo");
      const tag = b.querySelector(".badge-tag");
      if (tag) tag.remove();
    });

    btn.classList.add("ativo");
    btn.insertAdjacentHTML("beforeend", '<span class="badge-tag">Ativo</span>');
    operacaoSalva = btn.dataset.modo;
    showToast(`Operação alterada para: ${btn.querySelector('span').textContent}`, 'sucesso');
  });
});

// Gerenciador de Modais
function abrirModal(id) {
  fecharMenu();
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("ativo");
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("ativo");
}

document.querySelectorAll("[data-fechar]").forEach(btn => {
  btn.addEventListener("click", () => fecharModal(btn.dataset.fechar));
});

document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.classList.remove("ativo");
  });
});

// Eventos dos botões do Menu Lateral
const bindClick = (id, fn) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", fn);
};

bindClick("btnAbrirRegras", () => abrirModal("modalRegras"));
bindClick("btnAbrirDificuldade", () => abrirModal("modalDificuldade"));

// Tabela de Recordes no Menu: Se já tiver usuário identificado, vai para o bloco de rascunho
bindClick("btnAbrirRecordes", () => {
  fecharMenu();
  if (usuarioAtivo) {
    exibirPerfil(usuarioAtivo);
  } else {
    abrirModal("modalRecordes");
  }
});

bindClick("btnDesafioDiario", () => { fecharMenu(); showToast("Desafio Diário carregado!", "sucesso"); });
bindClick("btnTreinoCorporativo", () => { fecharMenu(); showToast("Modo Agilidade Cognitiva ativado.", "info"); });
bindClick("btnAbrirConfig", () => { fecharMenu(); showToast("Configurações em breve.", "info"); });
bindClick("btnBatalhaEquipes", () => { fecharMenu(); showToast("Modo Versus Corporativo em breve!", "sucesso"); });
bindClick("btnOnboarding", () => { fecharMenu(); showToast("Treino Didático carregado.", "info"); });
bindClick("btnModoPressao", () => { fecharMenu(); showToast("Atenção: Modo Sob Pressão ativo!", "alerta"); });
bindClick("btnAnalyticsRH", () => { fecharMenu(); showToast("Métricas de raciocínio ativadas.", "info"); });
bindClick("btnMascotes", () => { fecharMenu(); showToast("Escolha seu avatar clicando na logo!", "sucesso"); });

// Lógica de Dificuldade
const cardsDificuldade = document.querySelectorAll(".card-dif");
let nivelSelecionado = dificuldadeSalva;

function atualizarBadgeDificuldade(nivel) {
  const badge = document.getElementById("badgeDificuldadeAtual");
  const rankingTxt = document.getElementById("rankingDificuldadeTxt");
  const mapaNomes = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil', frenesi: 'Frenesi' };
  const label = mapaNomes[nivel] || 'Fácil';
  if (badge) badge.textContent = label;
  if (rankingTxt) rankingTxt.textContent = `Nível: ${label}`;
  if (perfilStatModoTxt) perfilStatModoTxt.textContent = `Nível: ${label}`;
}

cardsDificuldade.forEach(card => {
  card.addEventListener("click", () => {
    cardsDificuldade.forEach(c => c.classList.remove("ativo"));
    card.classList.add("ativo");
    nivelSelecionado = card.dataset.nivel;
  });
});

bindClick("btnSalvarDificuldade", () => {
  dificuldadeSalva = nivelSelecionado;
  atualizarBadgeDificuldade(nivelSelecionado);
  fecharModal("modalDificuldade");
  showToast("Nível de desafio atualizado!", "sucesso");
});

bindClick("btnLimparRecordes", () => {
  atualizarRecordeVisual(0);
  showToast("Recorde redefinido para esta sessão.", "alerta");
});

// Sanitização e Leitura Dinâmica do Jogador
const inputApelido = document.getElementById("inputApelido");
const inputPin = document.getElementById("inputPin");
const btnIniciarJogo = document.getElementById("btnIniciarJogo");
const emojiPreviewBox = document.getElementById("emojiPreviewBox");



inputApelido.addEventListener("input", function() {
  this.value = this.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  checarPerfilDinamico();
});

inputPin.addEventListener("input", function() {
  if (this.value.length > 8) {
    this.value = this.value.slice(0, 8);
  }
  checarPerfilDinamico();
});


let debounceTimer = null;
function checarPerfilDinamico() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const nick = inputApelido.value.trim();
    const pin = inputPin.value.trim();
    if (nick.length >= 3 && pin.length >= 4) {
      const perfil = await buscarPerfilExistente(nick, pin);
      if (perfil) {
        // Anexa o UID à URL sem recarregar a página
        const novaUrl = `${window.location.origin}${window.location.pathname}?uid=${encodeURIComponent(perfil.id)}`;
        window.history.replaceState({ uid: perfil.id }, "", novaUrl);

        exibirPerfil(perfil);
        showToast(`Bem-vindo de volta, ${perfil.apelido}!`, "sucesso");
      }
    }
  }, 400);
}

// Iniciar Jogo (Tanto da tela inicial quanto do card logado)
// Iniciar Jogo com sanitização defensiva contra undefined
async function iniciarPartida(nick, pin, btnAlvo) {
  const nickSeguro = String(nick || "").trim();
  const pinSeguro = String(pin || "").trim();

  if (nickSeguro.length < 3) {
    showToast("Digite um apelido com no mínimo 3 caracteres.", "alerta");
    if (inputApelido) inputApelido.focus();
    return;
  }

  if (pinSeguro.length < 4) {
    showToast("O PIN de segurança deve ter pelo menos 4 caracteres.", "alerta");
    if (inputPin) inputPin.focus();
    return;
  }

  btnAlvo.disabled = true;
  btnAlvo.textContent = "Carregando...";

  try {
    const emojiIdAtual = (usuarioAtivo && usuarioAtivo.emojiId) || idEmojiSelecionado || "grinning_eyes";
    const svgAtual = svgCustomizadoSalvo || (usuarioAtivo && usuarioAtivo.emojiSvg) || bancoSvgEmojis[emojiIdAtual] || "";

    const resposta = await autenticarEJogar(nickSeguro, pinSeguro, emojiIdAtual, svgAtual);

    if (!resposta.sucesso) {
      showToast(resposta.mensagem, "alerta");
      btnAlvo.disabled = false;
      btnAlvo.textContent = "Jogar";
      return;
    }

    showToast(resposta.mensagem, "sucesso");

    setTimeout(() => {
      window.location.href = `ambiente.html?uid=${encodeURIComponent(resposta.id)}`;
    }, 450);
  } catch (erro) {
    console.error("Erro na autenticação:", erro);
    showToast("Erro: " + (erro.message || "Tente novamente"), "alerta");
    btnAlvo.disabled = false;
    btnAlvo.textContent = "Jogar";
  }
}

if (btnPerfilJogar) {
  btnPerfilJogar.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!usuarioAtivo || !usuarioAtivo.id) return;

    btnPerfilJogar.disabled = true;
    btnPerfilJogar.textContent = "Entrando...";

    try {
      // Se o usuário personalizou um novo avatar enquanto estava no card, salva no banco
      if (svgCustomizadoSalvo && svgCustomizadoSalvo !== usuarioAtivo.emojiSvg) {
        await autenticarEJogar(
          usuarioAtivo.apelido, 
          usuarioAtivo.pin, 
          idEmojiSelecionado || usuarioAtivo.emojiId, 
          svgCustomizadoSalvo
        );
      }

      // Redireciona imediatamente para o ambiente do jogo
      window.location.href = `ambiente.html?uid=${encodeURIComponent(usuarioAtivo.id)}`;
    } catch (err) {
      console.warn("Aviso ao sincronizar avatar:", err);
      // Mesmo com aviso de rede, entra no jogo com o ID que já está validado
      window.location.href = `ambiente.html?uid=${encodeURIComponent(usuarioAtivo.id)}`;
    }
  });
}

btnIniciarJogo.addEventListener("click", (e) => {
  e.preventDefault();
  iniciarPartida(inputApelido.value.trim(), inputPin.value.trim(), btnIniciarJogo);
});



// Ranking Lateral TOP 50
const painelRanking = document.getElementById("painelRanking");
const btnFecharRanking = document.getElementById("btnFecharRanking");
const btnAbrirLeaderboard = document.getElementById("btnAbrirLeaderboard");

function abrirRanking() {
  fecharMenu();
  if (painelRanking) painelRanking.classList.add("ativo");
  if (overlay) overlay.classList.add("ativo");
}
function fecharRanking() {
  if (painelRanking) painelRanking.classList.remove("ativo");
  if (overlay) overlay.classList.remove("ativo");
}

if (btnAbrirLeaderboard) btnAbrirLeaderboard.addEventListener("click", abrirRanking);
if (btnFecharRanking) btnFecharRanking.addEventListener("click", fecharRanking);

// Galeria de Emojis e Editor
const btnTrocarEmoji = document.getElementById("btnTrocarEmoji");
const btnTrocarEmojiLogado = document.getElementById("btnTrocarEmojiLogado");
const painelSelecaoEmoji = document.getElementById("painelSelecaoEmoji");
const btnFecharPainelEmoji = document.getElementById("btnFecharPainelEmoji");
const gradeEmojis = document.getElementById("gradeEmojis");
const inputBuscaEmoji = document.getElementById("inputBuscaEmoji");

const painelEditorCores = document.getElementById("painelEditorCores");
const btnFecharEditor = document.getElementById("btnFecharEditor");
const btnVoltarGaleria = document.getElementById("btnVoltarGaleria");
const editorPreviewBox = document.getElementById("editorPreviewBox");
const gradeCoresEditor = document.getElementById("gradeCoresEditor");
const btnConfirmarAvatar = document.getElementById("btnConfirmarAvatar");

function abrirGaleria() {
  if (inputBuscaEmoji) inputBuscaEmoji.value = "";
  if (gradeEmojis) {
    gradeEmojis.innerHTML = "";
    inicializarCatalogo("");
    carregarMaisEmojis(gradeEmojis, idEmojiSelecionado);
  }
  if (painelSelecaoEmoji) painelSelecaoEmoji.classList.add("ativo");
  if (painelEditorCores) painelEditorCores.classList.remove("ativo");
}

if (btnTrocarEmoji) btnTrocarEmoji.addEventListener("click", abrirGaleria);
if (btnTrocarEmojiLogado) btnTrocarEmojiLogado.addEventListener("click", abrirGaleria);
if (btnFecharPainelEmoji) btnFecharPainelEmoji.addEventListener("click", () => painelSelecaoEmoji.classList.remove("ativo"));

if (gradeEmojis) {
  gradeEmojis.addEventListener("scroll", () => {
    if (gradeEmojis.scrollTop + gradeEmojis.clientHeight >= gradeEmojis.scrollHeight - 40) {
      carregarMaisEmojis(gradeEmojis, idEmojiSelecionado);
    }
  });

  gradeEmojis.addEventListener("click", (e) => {
    const item = e.target.closest(".emoji-item");
    if (!item) return;

    idEmojiSelecionado = item.dataset.id;
    const svgBase = bancoSvgEmojis[idEmojiSelecionado];

    painelSelecaoEmoji.classList.remove("ativo");
    painelEditorCores.classList.add("ativo");

    renderizarEditorCores(svgBase, gradeCoresEditor, editorPreviewBox, (svgAtualizado) => {
      if (emojiPreviewBox) emojiPreviewBox.innerHTML = svgAtualizado;
      if (perfilCardEmojiBox) perfilCardEmojiBox.innerHTML = svgAtualizado;
    });
  });
}

if (inputBuscaEmoji) {
  inputBuscaEmoji.addEventListener("input", (e) => {
    gradeEmojis.innerHTML = "";
    inicializarCatalogo(e.target.value.trim());
    carregarMaisEmojis(gradeEmojis, idEmojiSelecionado);
  });
}

if (btnVoltarGaleria) {
  btnVoltarGaleria.addEventListener("click", () => {
    painelEditorCores.classList.remove("ativo");
    painelSelecaoEmoji.classList.add("ativo");
  });
}

if (btnFecharEditor) {
  btnFecharEditor.addEventListener("click", () => {
    painelEditorCores.classList.remove("ativo");
  });
}

if (btnConfirmarAvatar) {
  btnConfirmarAvatar.addEventListener("click", () => {
    const svgFinal = obterSvgCustomizado();
    svgCustomizadoSalvo = svgFinal;
    if (emojiPreviewBox) emojiPreviewBox.innerHTML = svgFinal;
    if (perfilCardEmojiBox) perfilCardEmojiBox.innerHTML = svgFinal;
    if (usuarioAtivo) usuarioAtivo.emojiSvg = svgFinal;
    painelEditorCores.classList.remove("ativo");
    showToast("Avatar personalizado!", "sucesso");
  });
}