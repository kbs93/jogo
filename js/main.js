import { bancoSvgEmojis, inicializarCatalogo, carregarMaisEmojis } from "./emoji.js";
import { renderizarEditorCores, obterSvgCustomizado } from "./editor.js";
  
  // Recupera dados salvos
    const recordeSalvo = localStorage.getItem("mathSnakeHighScore") || "0";
    const dificuldadeSalva = localStorage.getItem("mathSnakeDificuldade") || "facil";
    const operacaoSalva = localStorage.getItem("mathSnakeOperacao") || "soma";

    
    const elRecordeMenu = document.getElementById("recordeMenuTxt");
if (elRecordeMenu) elRecordeMenu.textContent = recordeSalvo;

const elRecordeModal = document.getElementById("recordeModalTxt");
if (elRecordeModal) elRecordeModal.textContent = recordeSalvo;

const elRankingPontos = document.getElementById("rankingPontosTxt");
if (elRankingPontos) elRankingPontos.textContent = `${recordeSalvo} pts`;

    // Sistema de Notificações Toast nativo
    function showToast(mensagem, tipo = 'info') {
      const container = document.getElementById('toastContainer');
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

    // Controle do Drawer Lateral
    const btnHamburguer = document.getElementById("btnHamburguer");
    const btnFechar = document.getElementById("btnFechar");
    const overlay = document.getElementById("overlay");
    const drawer = document.getElementById("drawer");

function abrirMenu() {
  drawer.classList.add("ativo");
}
    function fecharMenu() {
      drawer.classList.remove("ativo");
      overlay.classList.remove("ativo");
    }

    btnHamburguer.addEventListener("click", abrirMenu);
    btnFechar.addEventListener("click", fecharMenu);
    overlay.addEventListener("click", fecharMenu);

    // Sanfona de Operações
    const btnToggleModos = document.getElementById("btnToggleModos");
    const submenuModos = document.getElementById("submenuModos");
    const setaModos = document.getElementById("setaModos");
    const btnsOperacao = document.querySelectorAll(".btn-operacao");

    btnToggleModos.addEventListener("click", function() {
      const estaAberto = submenuModos.classList.toggle("aberto");
      btnToggleModos.classList.toggle("aberto", estaAberto);
      setaModos.style.transform = estaAberto ? "rotate(180deg)" : "rotate(0deg)";
    });

    // Seleção de Operação com persistência
    btnsOperacao.forEach(function(btn) {
      if (btn.dataset.modo === operacaoSalva) {
        btn.classList.add("ativo");
        if (!btn.querySelector(".badge-tag")) {
          btn.insertAdjacentHTML("beforeend", '<span class="badge-tag">Ativo</span>');
        }
      } else {
        btn.classList.remove("ativo");
        const tag = btn.querySelector(".badge-tag");
        if (tag) tag.remove();
      }

      btn.addEventListener("click", function() {
        btnsOperacao.forEach(function(b) {
          b.classList.remove("ativo");
          const tag = b.querySelector(".badge-tag");
          if (tag) tag.remove();
        });

        btn.classList.add("ativo");
        btn.insertAdjacentHTML("beforeend", '<span class="badge-tag">Ativo</span>');
        localStorage.setItem("mathSnakeOperacao", btn.dataset.modo);
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
    document.getElementById("btnAbrirRegras").addEventListener("click", () => abrirModal("modalRegras"));
    document.getElementById("btnAbrirDificuldade").addEventListener("click", () => abrirModal("modalDificuldade"));
    document.getElementById("btnAbrirRecordes").addEventListener("click", () => abrirModal("modalRecordes"));

    document.getElementById("btnDesafioDiario").addEventListener("click", () => {
      fecharMenu();
      showToast("Desafio Diário carregado: ganhe 2x de pontuação hoje!", "sucesso");
    });

    document.getElementById("btnTreinoCorporativo").addEventListener("click", () => {
      fecharMenu();
      showToast("Modo Agilidade Cognitiva configurado para métricas de foco.", "info");
    });

    document.getElementById("btnAbrirConfig").addEventListener("click", () => {
      fecharMenu();
      showToast("Painel de áudio e gráficos em breve.", "info");
    });

    // Lógica da Seleção de Dificuldade
    const cardsDificuldade = document.querySelectorAll(".card-dif");
    let nivelSelecionado = dificuldadeSalva;

    function atualizarBadgeDificuldade(nivel) {
      const badge = document.getElementById("badgeDificuldadeAtual");
      const rankingTxt = document.getElementById("rankingDificuldadeTxt");
      const mapaNomes = {
        facil: 'Fácil',
        medio: 'Médio',
        dificil: 'Difícil',
        frenesi: 'Frenesi'
      };
      const label = mapaNomes[nivel] || 'Fácil';
      if (badge) badge.textContent = label;
      if (rankingTxt) rankingTxt.textContent = `Nível: ${label}`;
    }

    cardsDificuldade.forEach(card => {
      if (card.dataset.nivel === dificuldadeSalva) {
        card.classList.add("ativo");
      } else {
        card.classList.remove("ativo");
      }

      card.addEventListener("click", () => {
        cardsDificuldade.forEach(c => c.classList.remove("ativo"));
        card.classList.add("ativo");
        nivelSelecionado = card.dataset.nivel;
      });
    });

    atualizarBadgeDificuldade(dificuldadeSalva);

    document.getElementById("btnSalvarDificuldade").addEventListener("click", () => {
      localStorage.setItem("mathSnakeDificuldade", nivelSelecionado);
      atualizarBadgeDificuldade(nivelSelecionado);
      fecharModal("modalDificuldade");
      showToast("Nível de desafio atualizado com sucesso!", "sucesso");
    });

    // Zerar Recorde
    document.getElementById("btnLimparRecordes").addEventListener("click", () => {
      localStorage.removeItem("mathSnakeHighScore");
      document.getElementById("recordeMenuTxt").textContent = "0";
      document.getElementById("recordeModalTxt").textContent = "0";
      document.getElementById("rankingPontosTxt").textContent = "0 pts";
      showToast("Seus recordes foram redefinidos.", "alerta");
    });


    // Eventos dos novos botões com ShowToast
    document.getElementById("btnBatalhaEquipes").addEventListener("click", () => {
      fecharMenu();
      showToast("Modo Versus Corporativo: crie salas de batalha rápida para o seu time!", "sucesso");
    });

    document.getElementById("btnOnboarding").addEventListener("click", () => {
      fecharMenu();
      showToast("Módulo Didático: aprenda raciocínio ágil passo a passo sem penalidades.", "info");
    });

    document.getElementById("btnModoPressao").addEventListener("click", () => {
      fecharMenu();
      showToast("Atenção: Modo Sob Pressão reduz o tempo de resposta pela metade!", "alerta");
    });

    document.getElementById("btnAnalyticsRH").addEventListener("click", () => {
      fecharMenu();
      showToast("Métricas da Empresa: precisão, tempo médio e histórico de raciocínio.", "info");
    });

    document.getElementById("btnMascotes").addEventListener("click", () => {
      fecharMenu();
      showToast("Seleção de Avatares: troque a reação visual do emoji durante o cálculo!", "sucesso");
    });



    // Sanitização em tempo real dos campos de entrada
    const inputApelido = document.getElementById("inputApelido");
    const inputPin = document.getElementById("inputPin");
    const btnIniciarJogo = document.getElementById("btnIniciarJogo");

    // Preenche com o último apelido usado no aparelho, se houver
    inputApelido.value = localStorage.getItem("totalX_lastNick") || "";
    inputPin.value = localStorage.getItem("totalX_lastPin") || "";

    inputApelido.addEventListener("input", function() {
      // Aceita apenas letras e números, convertendo para maiúsculo
      this.value = this.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    });

    inputPin.addEventListener("input", function() {
      // Aceita estritamente números
      this.value = this.value.replace(/\D/g, '');
    });

    // Ação ao clicar em Jogar
    btnIniciarJogo.addEventListener("click", function(e) {
      e.preventDefault();
      const nick = inputApelido.value.trim();
      const pin = inputPin.value.trim();

      if (nick.length < 3) {
        showToast("Digite um apelido com no mínimo 3 caracteres.", "alerta");
        inputApelido.focus();
        return;
      }

      if (pin.length < 4) {
        showToast("O PIN de segurança deve ter pelo menos 4 dígitos.", "alerta");
        inputPin.focus();
        return;
      }

      // Salva apenas temporariamente os dados digitados para persistir na sessão
      localStorage.setItem("totalX_lastNick", nick);
      localStorage.setItem("totalX_lastPin", pin);

      showToast(`Bem-vindo, ${nick}! Iniciando o desafio...`, "sucesso");
      
      setTimeout(() => {
        window.location.href = "ambiente.html";
      }, 700);
    });

    // Controle do Painel Lateral do Ranking (TOP 50)
  
    const painelRanking = document.getElementById("painelRanking");
    const btnFecharRanking = document.getElementById("btnFecharRanking");

 function abrirRanking() {
  fecharMenu();
  painelRanking.classList.add("ativo");
}
    function fecharRanking() {
      painelRanking.classList.remove("ativo");
      overlay.classList.remove("ativo");
    }

    if (btnAbrirLeaderboard) {
      btnAbrirLeaderboard.addEventListener("click", abrirRanking);
    }
    if (btnFecharRanking) {
      btnFecharRanking.addEventListener("click", fecharRanking);
    }

    // Fechar ao clicar no overlay de fundo escurecido
    overlay.addEventListener("click", () => {
      fecharMenu();
      fecharRanking();
    });
// ==========================================
    // Fluxo da Galeria e Editor de Cores do Avatar
    // ==========================================
    const btnTrocarEmoji = document.getElementById("btnTrocarEmoji");
    const painelSelecaoEmoji = document.getElementById("painelSelecaoEmoji");
    const btnFecharPainelEmoji = document.getElementById("btnFecharPainelEmoji");
    const gradeEmojis = document.getElementById("gradeEmojis");
    const emojiPreviewBox = document.getElementById("emojiPreviewBox");
    const inputBuscaEmoji = document.getElementById("inputBuscaEmoji");

    // Elementos do Editor
    const painelEditorCores = document.getElementById("painelEditorCores");
    const btnFecharEditor = document.getElementById("btnFecharEditor");
    const btnVoltarGaleria = document.getElementById("btnVoltarGaleria");
    const editorPreviewBox = document.getElementById("editorPreviewBox");
    const gradeCoresEditor = document.getElementById("gradeCoresEditor");
    const btnConfirmarAvatar = document.getElementById("btnConfirmarAvatar");

    let idEmojiSelecionado = localStorage.getItem("totalX_emojiId") || "grinning_eyes";
    let svgCustomizadoSalvo = localStorage.getItem("totalX_emojiSvgCustom") || "";

    function carregarEmojiPrincipal() {
      if (!emojiPreviewBox) return;
      if (svgCustomizadoSalvo) {
        emojiPreviewBox.innerHTML = svgCustomizadoSalvo;
      } else {
        emojiPreviewBox.innerHTML = bancoSvgEmojis[idEmojiSelecionado] || Object.values(bancoSvgEmojis)[0] || "";
      }
    }

    //carregarEmojiPrincipal();

    function abrirGaleria() {
      if (inputBuscaEmoji) inputBuscaEmoji.value = "";
      gradeEmojis.innerHTML = "";
      inicializarCatalogo("");
      carregarMaisEmojis(gradeEmojis, idEmojiSelecionado);
      painelSelecaoEmoji.classList.add("ativo");
      painelEditorCores.classList.remove("ativo");
    }

    if (btnTrocarEmoji) btnTrocarEmoji.addEventListener("click", abrirGaleria);
    if (btnFecharPainelEmoji) btnFecharPainelEmoji.addEventListener("click", () => painelSelecaoEmoji.classList.remove("ativo"));

    // Scroll infinito da galeria
    if (gradeEmojis) {
      gradeEmojis.addEventListener("scroll", () => {
        if (gradeEmojis.scrollTop + gradeEmojis.clientHeight >= gradeEmojis.scrollHeight - 40) {
          carregarMaisEmojis(gradeEmojis, idEmojiSelecionado);
        }
      });

      // Clique em um emoji: fecha a galeria e abre o editor de cores
      gradeEmojis.addEventListener("click", (e) => {
        const item = e.target.closest(".emoji-item");
        if (!item) return;

        idEmojiSelecionado = item.dataset.id;
        const svgBase = bancoSvgEmojis[idEmojiSelecionado];

        painelSelecaoEmoji.classList.remove("ativo");
        painelEditorCores.classList.add("ativo");

        // Abre o editor com as cores extraídas do SVG escolhido
        renderizarEditorCores(svgBase, gradeCoresEditor, editorPreviewBox, (svgAtualizado) => {
          // Callback a cada troca de cor: atualiza também a tela principal se desejar
          emojiPreviewBox.innerHTML = svgAtualizado;
        });
      });
    }

    // Busca na galeria
    if (inputBuscaEmoji) {
      inputBuscaEmoji.addEventListener("input", (e) => {
        gradeEmojis.innerHTML = "";
        inicializarCatalogo(e.target.value.trim());
        carregarMaisEmojis(gradeEmojis, idEmojiSelecionado);
      });
    }

    // Voltar do editor para a galeria
    if (btnVoltarGaleria) {
      btnVoltarGaleria.addEventListener("click", () => {
        painelEditorCores.classList.remove("ativo");
        painelSelecaoEmoji.classList.add("ativo");
      });
    }

    // Fechar o editor
    if (btnFecharEditor) {
      btnFecharEditor.addEventListener("click", () => {
        painelEditorCores.classList.remove("ativo");
        carregarEmojiPrincipal(); // Reverte caso não tenha confirmado
      });
    }

    // Confirmar e salvar a personalização
    if (btnConfirmarAvatar) {
      btnConfirmarAvatar.addEventListener("click", () => {
        const svgFinal = obterSvgCustomizado();
        svgCustomizadoSalvo = svgFinal;
        localStorage.setItem("totalX_emojiId", idEmojiSelecionado);
        localStorage.setItem("totalX_emojiSvgCustom", svgFinal);
        emojiPreviewBox.innerHTML = svgFinal;
        painelEditorCores.classList.remove("ativo");
        showToast("Avatar personalizado com sucesso!", "sucesso");
      });
    }