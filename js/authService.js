import { db } from "./firebaseConfig.js";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  limit,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { extrairCoresSvg } from "./editor.js";

function gerarSufixoId(tamanho = 5) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let resultado = "";
  for (let i = 0; i < tamanho; i++) {
    resultado += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return resultado;
}

/**
 * Autentica usuário existente para abrir a tela de perfil.
 */
export async function buscarPerfilExistente(apelido, pin) {
  const nickFormatado = String(apelido || "").trim().toUpperCase();
  const pinFormatado = String(pin || "").trim();

  if (nickFormatado.length < 3) {
    return { sucesso: false, mensagem: "Digite um apelido com no mínimo 3 letras." };
  }
  if (pinFormatado.length < 4) {
    return { sucesso: false, mensagem: "Digite um PIN com pelo menos 4 dígitos." };
  }

  try {
    const qApelido = query(
      collection(db, "usuarios"),
      where("apelido", "==", nickFormatado),
      limit(1)
    );

    const snap = await getDocs(qApelido);

    if (snap.empty) {
      return { 
        sucesso: false, 
        mensagem: "Perfil não encontrado. Clique em 'Jogar' para criar sua conta." 
      };
    }

    const docUser = snap.docs[0];
    const dados = docUser.data();

    if (dados.pin !== pinFormatado) {
      return { 
        sucesso: false, 
        mensagem: "Senha incorreto para este nome." 
      };
    }

    return {
      sucesso: true,
      perfil: {
        id: docUser.id,
        apelido: dados.apelido || nickFormatado,
        pin: dados.pin || pinFormatado,
        recorde: typeof dados.recorde === "number" ? dados.recorde : 0,
        ultimaPontuacao: typeof dados.ultimaPontuacao === "number" ? dados.ultimaPontuacao : (dados.recorde || 0),
        emojiId: dados.emojiId || "grinning_eyes",
        emojiSvg: dados.emojiSvg || ""
      }
    };
  } catch (err) {
    console.error("Falha ao buscar perfil:", err);
    return { sucesso: false, mensagem: "Erro de conexão ao buscar perfil." };
  }
}

/**
 * Busca perfil diretamente pelo UID do Firestore (retorno de partida).
 */
export async function buscarPerfilPorId(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, "usuarios", uid));
    if (snap.exists()) {
      const dados = snap.data();
      return {
        id: snap.id,
        apelido: dados.apelido || "",
        pin: dados.pin || "",
        recorde: typeof dados.recorde === "number" ? dados.recorde : 0,
        emojiId: dados.emojiId || "grinning_eyes",
        emojiSvg: dados.emojiSvg || ""
      };
    }
  } catch (err) {
    console.warn("Falha ao buscar perfil por ID:", err);
  }
  return null;
}

/**
 * Criação exclusiva de novo cadastro. Se o apelido já existir, bloqueia.
 */
export async function cadastrarNovoJogador(apelido, pin, emojiId, emojiSvg) {
  const nickFormatado = String(apelido || "").trim().toUpperCase();
  const pinFormatado = String(pin || "").trim();
  const idEmojiTratado = String(emojiId || "grinning_eyes");
  const svgTratado = String(emojiSvg || "");
  const colecaoUsuarios = collection(db, "usuarios");

  const qApelido = query(
    colecaoUsuarios,
    where("apelido", "==", nickFormatado),
    limit(1)
  );

  const buscarComTimeout = Promise.race([
    getDocs(qApelido),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Tempo limite de resposta do banco")), 6000))
  ]);

  const snapshot = await buscarComTimeout;

  // Bloqueio se já existir conta com este apelido
  if (!snapshot.empty) {
    return {
      sucesso: false,
      mensagem: `O apelido "${nickFormatado}" já está cadastrado. Clique em "Entrar".`
    };
  }

  const paletaCores = svgTratado ? extrairCoresSvg(svgTratado) : [];
  const novoId = `${nickFormatado}_${gerarSufixoId(5)}`;
  const refNovoDoc = doc(db, "usuarios", novoId);

  const novoPerfil = {
    id: novoId,
    apelido: nickFormatado,
    pin: pinFormatado,
    recorde: 0,
    emojiId: idEmojiTratado,
    emojiSvg: svgTratado,
    paletaCores: paletaCores,
    criadoEm: serverTimestamp(),
    ultimoAcesso: serverTimestamp()
  };

  await setDoc(refNovoDoc, novoPerfil);

  return {
    sucesso: true,
    id: novoId,
    apelido: novoPerfil.apelido,
    pin: novoPerfil.pin,
    recorde: 0,
    emojiId: novoPerfil.emojiId,
    emojiSvg: novoPerfil.emojiSvg,
    paletaCores: novoPerfil.paletaCores,
    mensagem: "Perfil criado com sucesso!"
  };
}