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
 * Busca dados prévios do usuário quando ele preenche Apelido + PIN
 */
export async function buscarPerfilExistente(apelido, pin) {
  const nickFormatado = String(apelido || "").trim().toUpperCase();
  const pinFormatado = String(pin || "").trim();
  if (nickFormatado.length < 3 || pinFormatado.length < 4) return null;

  try {
    const qApelido = query(
      collection(db, "usuarios"),
      where("apelido", "==", nickFormatado),
      limit(1)
    );
    const snap = await getDocs(qApelido);
    if (!snap.empty) {
      const dados = snap.docs[0].data();
      if (dados.pin === pinFormatado) {
   return {
          id: snap.docs[0].id,
          apelido: dados.apelido || nickFormatado,
          pin: dados.pin || pinFormatado,
          recorde: typeof dados.recorde === "number" ? dados.recorde : 0,
          ultimaPontuacao: typeof dados.ultimaPontuacao === "number" ? dados.ultimaPontuacao : (dados.recorde || 0),
          emojiId: dados.emojiId || "grinning_eyes",
          emojiSvg: dados.emojiSvg || ""
        };
      }
    }
  } catch (err) {
    console.warn("Falha na checagem em tempo real:", err);
  }
  return null;
}
/**
 * Busca perfil diretamente pelo UID do Firestore
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
 * Autentica o dono da conta ou cria um novo se o apelido for inédito.
 */
export async function autenticarEJogar(apelido, pin, emojiId, emojiSvg) {
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
  const paletaCores = svgTratado ? extrairCoresSvg(svgTratado) : [];

  // Se já existe usuário com esse apelido
  if (!snapshot.empty) {
    const docExistente = snapshot.docs[0];
    const dados = docExistente.data();

    if (dados.pin !== pinFormatado) {
      return {
        sucesso: false,
        mensagem: `O apelido "${nickFormatado}" já está em uso com outro PIN.`
      };
    }

    const refDoc = doc(db, "usuarios", docExistente.id);
    
    // Atualização com campos válidos (sem undefined e com serverTimestamp)
    if (svgTratado) {
      await setDoc(refDoc, {
        emojiId: idEmojiTratado,
        emojiSvg: svgTratado,
        paletaCores: paletaCores.length ? paletaCores : (dados.paletaCores || []),
        ultimoAcesso: serverTimestamp()
      }, { merge: true });
    }

    return {
      sucesso: true,
      id: docExistente.id,
      apelido: dados.apelido || nickFormatado,
      pin: dados.pin || pinFormatado,
      recorde: typeof dados.recorde === "number" ? dados.recorde : 0,
      emojiId: idEmojiTratado,
      emojiSvg: svgTratado || dados.emojiSvg || "",
      paletaCores: paletaCores.length ? paletaCores : (dados.paletaCores || []),
      mensagem: `Bem-vindo de volta, ${dados.apelido}!`
    };
  }

  // Novo Usuário: cria com id único e timestamps oficiais
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
    mensagem: `Perfil criado com sucesso!`
  };
}
