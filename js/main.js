import { bancoSvgEmojis, inicializarCatalogo, carregarMaisEmojis } from "./emoji.js";
import { renderizarEditorCores, obterSvgCustomizado } from "./editor.js";
import { cadastrarNovoJogador, buscarPerfilExistente, buscarPerfilPorId } from "./authService.js";

// Estado em memória (Zero localStorage)
let usuarioAtivo = null;
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
const btnEntrarJogo = document.getElementById("btnEntrarJogo");
const btnIniciarJogo = document.getElementById("btnIniciarJogo");
const inputApelido = document.getElementById("inputApelido");
const inputPin = document.getElementById("inputPin");
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

// Notificações Toast
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

// Exibir Tela de Perfil Intermediária
function exibirPerfil(perfil, pontosUltimaPartida = null) {
  usuarioAtivo = perfil;
  if (blocoLoginPadrao) blocoLoginPadrao.style.display = "none";
  if (blocoPerfilLogado) blocoPerfilLogado.style.display = "flex";

  if (perfilCardApelidoTxt) perfilCardApelidoTxt.textContent = perfil.apelido;
  if (perfilCardEmojiBox) perfilCardEmojiBox.innerHTML = perfil.emojiSvg || bancoSvgEmojis[perfil.emojiId] || "";

  const recordeBanco = typeof perfil.recorde === "number" ? perfil.recorde : 0;
  const pontosPartida = pontosUltimaPartida !== null ? Number(pontosUltimaPartida) : recordeBanco;
  
  const maiorPontuacao = Math.max(recordeBanco, pontosPartida);
  usuarioAtivo.recorde = maiorPontuacao;

  if (perfilStatMaiorTxt) perfilStatMaiorTxt.textContent = maiorPontuacao;
  if (elRecordeMenu) elRecordeMenu.textContent = maiorPontuacao;
  if (elRecordeModal) elRecordeModal.textContent = maiorPontuacao;
  if (elRankingPontos) elRankingPontos.textContent = `${maiorPontuacao} pts`;
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
  if (btnPerfilJogar) {
    btnPerfilJogar.disabled = false;
    btnPerfilJogar.textContent = "Jogar";
  }
}

async function verificarSessaoInicial() {
  const params = new URLSearchParams(window.location.search);
  const uidUrl = params.get("uid");
  const ptsUrl = params.get("pts");

  if (uidUrl) {
    const perfil = await buscarPerfilPorId(uidUrl);
    window.history.replaceState(null, "", window.location.origin + window.location.pathname);
    
    if (perfil) {
      exibirPerfil(perfil, ptsUrl);
      return;
    }
  }

  deslogarEVoltarInicio();
}

verificarSessaoInicial();

window.addEventListener("pageshow", (e) => {
  if (e.persisted || !usuarioAtivo) {
    deslogarEVoltarInicio();
  }
});

window.addEventListener("popstate", () => {
  if (!usuarioAtivo) {
    deslogarEVoltarInicio();
  }
});

if (btnPerfilSair) {
  btnPerfilSair.addEventListener("click", () => {
    deslogarEVoltarInicio();
    const urlLimpa = window.location.origin + window.location.pathname;
    window.history.replaceState(null, "", urlLimpa);
    window.location.replace(urlLimpa);
    showToast("Você saiu da conta.", "info");
  });
}

if (btnPerfilZerarRecorde) {
  btnPerfilZerarRecorde.addEventListener("click", async () => {
    if (!usuarioAtivo || !usuarioAtivo.id) return;
    usuarioAtivo.recorde = 0;
    atualizarRecordeVisual(0);
    
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

// Drawer Lateral
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

// Modais
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

const bindClick = (id, fn) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", fn);
};

bindClick("btnAbrirRegras", () => abrirModal("modalRegras"));
bindClick("btnAbrirDificuldade", () => abrirModal("modalDificuldade"));

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

// Dificuldade
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

// Sanitização de entradas
if (inputApelido) {
  inputApelido.addEventListener("input", function() {
    this.value = this.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  });
}

if (inputPin) {
  inputPin.addEventListener("input", function() {
    if (this.value.length > 8) {
      this.value = this.value.slice(0, 8);
    }
  });
}

// ==========================================
// 1. BOTÃO "JOGAR" DA TELA INICIAL (NOVO CADASTRO)
// ==========================================
btnIniciarJogo.addEventListener("click", async (e) => {
  e.preventDefault();

  const nickSeguro = String(inputApelido.value || "").trim();
  const pinSeguro = String(inputPin.value || "").trim();

  if (nickSeguro.length < 3) {
    showToast("Digite um apelido com no mínimo 3 caracteres.", "alerta");
    inputApelido.focus();
    return;
  }

  if (pinSeguro.length < 4) {
    showToast("O PIN de segurança deve ter pelo menos 4 caracteres.", "alerta");
    inputPin.focus();
    return;
  }

  btnIniciarJogo.disabled = true;
  btnIniciarJogo.textContent = "Criando...";

  try {
    const emojiIdAtual = idEmojiSelecionado || "grinning_eyes";
    const svgAtual = svgCustomizadoSalvo || bancoSvgEmojis[emojiIdAtual] || "";

    const resposta = await cadastrarNovoJogador(nickSeguro, pinSeguro, emojiIdAtual, svgAtual);

    if (!resposta.sucesso) {
      showToast(resposta.mensagem, "alerta");
      btnIniciarJogo.disabled = false;
      btnIniciarJogo.textContent = "Jogar";
      return;
    }

    showToast(resposta.mensagem, "sucesso");
    setTimeout(() => {
      window.location.replace(`ambiente.html?uid=${encodeURIComponent(resposta.id)}`);
    }, 450);
  } catch (erro) {
    console.error("Erro no cadastro:", erro);
    showToast("Erro: " + (erro.message || "Tente novamente"), "alerta");
    btnIniciarJogo.disabled = false;
    btnIniciarJogo.textContent = "Jogar";
  }
});

// ==========================================
// 2. BOTÃO "ENTRAR" DA TELA INICIAL (USUÁRIO EXISTENTE)
// ==========================================
if (btnEntrarJogo) {
  btnEntrarJogo.addEventListener("click", async (e) => {
    e.preventDefault();

    const nick = inputApelido.value.trim();
    const pin = inputPin.value.trim();

    if (nick.length < 3) {
      showToast("Digite seu apelido com no mínimo 3 caracteres.", "alerta");
      inputApelido.focus();
      return;
    }

    if (pin.length < 4) {
      showToast("Digite o PIN com pelo menos 4 dígitos.", "alerta");
      inputPin.focus();
      return;
    }

    btnEntrarJogo.disabled = true;
    btnEntrarJogo.textContent = "Buscando...";

    try {
      const res = await buscarPerfilExistente(nick, pin);

      if (res.sucesso && res.perfil) {
        window.history.replaceState(null, "", window.location.origin + window.location.pathname);
        exibirPerfil(res.perfil);
        showToast(`Bem-vindo de volta, ${res.perfil.apelido}!`, "sucesso");
      } else {
        showToast(res.mensagem, "alerta");
      }
    } catch (err) {
      console.error("Erro ao autenticar:", err);
      showToast("Falha na conexão ao buscar perfil.", "alerta");
    } finally {
      btnEntrarJogo.disabled = false;
      btnEntrarJogo.textContent = "Entrar";
    }
  });
}

// ==========================================
// 3. BOTÃO "JOGAR" DENTRO DA TELA DO PERFIL
// ==========================================
if (btnPerfilJogar) {
  btnPerfilJogar.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!usuarioAtivo || !usuarioAtivo.id) return;

    btnPerfilJogar.disabled = true;
    btnPerfilJogar.textContent = "Entrando...";

    try {
      if (svgCustomizadoSalvo && svgCustomizadoSalvo !== usuarioAtivo.emojiSvg) {
        const { doc, updateDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const { db } = await import("./firebaseConfig.js");
        await updateDoc(doc(db, "usuarios", usuarioAtivo.id), {
          emojiId: idEmojiSelecionado || usuarioAtivo.emojiId,
          emojiSvg: svgCustomizadoSalvo,
          ultimoAcesso: serverTimestamp()
        });
      }

      window.location.replace(`ambiente.html?uid=${encodeURIComponent(usuarioAtivo.id)}`);
    } catch (err) {
      console.warn("Aviso ao sincronizar avatar:", err);
      window.location.replace(`ambiente.html?uid=${encodeURIComponent(usuarioAtivo.id)}`);
    }
  });
}

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
      const elPreview = document.getElementById("emojiPreviewBox");
      if (elPreview) elPreview.innerHTML = svgAtualizado;
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
    const elPreview = document.getElementById("emojiPreviewBox");
    if (elPreview) elPreview.innerHTML = svgFinal;
    if (perfilCardEmojiBox) perfilCardEmojiBox.innerHTML = svgFinal;
    if (usuarioAtivo) usuarioAtivo.emojiSvg = svgFinal;
    painelEditorCores.classList.remove("ativo");
    showToast("Avatar personalizado!", "sucesso");
  });
}