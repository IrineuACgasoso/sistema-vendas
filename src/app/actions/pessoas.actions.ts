"use server";

import { db, COLLECTIONS } from "@/lib/firebase/admin";
import { exigirSessao, SessaoExpiradaError } from "@/lib/auth/exigirSessao";
import { normalizeForSearch, prefixRangeEnd } from "@/lib/utils/firestoreQueries";
import type { ActionResult, Pessoa } from "@/types";

const MAX_RESULTADOS_AUTOCOMPLETE = 8;

function tratarSessaoExpirada(error: unknown): ActionResult<never> | null {
  if (error instanceof SessaoExpiradaError) {
    return { ok: false, code: "SESSAO_EXPIRADA", message: error.message };
  }
  return null;
}

/**
 * Busca pessoas cujo nome normalizado comece com o prefixo digitado.
 * Usado no autocomplete de "Pagt. Nome" e "Cliente".
 */
export async function buscarPessoasPorPrefixo(
  prefixo: string
): Promise<ActionResult<Pessoa[]>> {
  try {
    await exigirSessao();

    const termo = normalizeForSearch(prefixo);
    if (!termo) {
      return { ok: true, data: [] };
    }

    const snapshot = await db
      .collection(COLLECTIONS.PESSOAS)
      .where("nomeBusca", ">=", termo)
      .where("nomeBusca", "<=", prefixRangeEnd(termo))
      .limit(MAX_RESULTADOS_AUTOCOMPLETE)
      .get();

    const pessoas: Pessoa[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        nome: data.nome,
        nomeBusca: data.nomeBusca,
        criadoEm: data.criadoEm,
      };
    });

    return { ok: true, data: pessoas };
  } catch (error) {
    const sessaoExpirada = tratarSessaoExpirada(error);
    if (sessaoExpirada) return sessaoExpirada;

    console.error("Erro ao buscar pessoas:", error);
    return { ok: false, message: "Não foi possível buscar nomes agora." };
  }
}

/**
 * Salva a pessoa se ainda não existir (comparando nomeBusca normalizado).
 * Retorna o id da pessoa (existente ou recém-criada).
 * Coleção compartilhada entre pagantes e clientes, conforme especificado.
 */
export async function salvarPessoaSeNova(nomeBruto: string): Promise<ActionResult<{ id: string }>> {
  try {
    await exigirSessao();

    const nome = nomeBruto.trim();
    if (!nome) {
      return { ok: false, message: "Nome vazio." };
    }
    if (nome.length > 200) {
      return { ok: false, message: "Nome muito longo." };
    }

    const nomeBusca = normalizeForSearch(nome);

    const existente = await db
      .collection(COLLECTIONS.PESSOAS)
      .where("nomeBusca", "==", nomeBusca)
      .limit(1)
      .get();

    if (!existente.empty) {
      return { ok: true, data: { id: existente.docs[0].id } };
    }

    const novoDoc = await db.collection(COLLECTIONS.PESSOAS).add({
      nome,
      nomeBusca,
      criadoEm: new Date().toISOString(),
    });

    return { ok: true, data: { id: novoDoc.id } };
  } catch (error) {
    const sessaoExpirada = tratarSessaoExpirada(error);
    if (sessaoExpirada) return sessaoExpirada;

    console.error("Erro ao salvar pessoa:", error);
    return { ok: false, message: "Não foi possível salvar o nome." };
  }
}
