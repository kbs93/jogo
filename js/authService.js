import { db } from "./firebaseConfig.js";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  limit 
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
 * Autentica o dono da conta ou cria um novo se o apelido for inédito.
 * Bloqueia se o apelido já existir com outro PIN.
 */
export async function autenticarEJogar(apelido, pin, emojiId, emojiSvg) {
  const nickFormatado = apelido.trim().toUpperCase();
  const pinFormatado = String(pin).trim();
  const colecaoUsuarios = collection(db, "usuarios");

  // 1. Busca pelo apelido para verificar se já existe registro
const qApelido = query(
    colecaoUsuarios,
    where("apelido", "==", nickFormatado),
    limit(1)
  );

  // Timeout de segurança de 6 segundos para não travar o botão se o Firebase não responder
  const buscarComTimeout = Promise.race([
    getDocs(qApelido),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Tempo limite de resposta do banco")), 6000))
  ]);

  const snapshot = await buscarComTimeout;
  const paletaCores = emojiSvg ? extrairCoresSvg(emojiSvg) : [];

  // 2. Se o apelido já existe no banco
  if (!snapshot.empty) {
    const docExistente = snapshot.docs[0];
    const dados = docExistente.data();

    // Se o PIN for diferente, barra o acesso para não permitir nomes duplicados
    if (dados.pin !== pinFormatado) {
      return {
        sucesso: false,
        mensagem: `O apelido "${nickFormatado}" já está em uso. Por favor, escolha outro nome.`
      };
    }

    // Se o PIN estiver correto, é o dono: atualiza dados se houve nova personalização
    const refDoc = doc(db, "usuarios", docExistente.id);
    if (emojiSvg) {
      await setDoc(refDoc, {
        emojiId: emojiId || dados.emojiId,
        emojiSvg: emojiSvg,
        paletaCores: paletaCores.length ? paletaCores : (dados.paletaCores || []),
        ultimoAcesso: new Date()
      }, { merge: true });
    }

    return {
      sucesso: true,
      id: docExistente.id,
      apelido: dados.apelido,
      recorde: dados.recorde || 0,
      emojiId: dados.emojiId,
      emojiSvg: emojiSvg || dados.emojiSvg || "",
      paletaCores: paletaCores.length ? paletaCores : (dados.paletaCores || []),
      mensagem: `Bem-vindo de volta, ${dados.apelido}!`
    };
  }

  // 3. Apelido livre: cria novo usuário com ID único
  const novoId = `${nickFormatado}_${gerarSufixoId(5)}`;
  const refNovoDoc = doc(db, "usuarios", novoId);

  const novoPerfil = {
    id: novoId,
    apelido: nickFormatado,
    pin: pinFormatado,
    recorde: 0,
    emojiId: emojiId || "emoji_1",
    emojiSvg: emojiSvg || "",
    paletaCores: paletaCores,
    criadoEm: new Date(),
    ultimoAcesso: new Date()
  };

  await setDoc(refNovoDoc, novoPerfil);

  return {
    sucesso: true,
    id: novoId,
    apelido: novoPerfil.apelido,
    recorde: 0,
    emojiId: novoPerfil.emojiId,
    emojiSvg: novoPerfil.emojiSvg,
    paletaCores: novoPerfil.paletaCores,
    mensagem: `Perfil criado com sucesso!`
  };
}