"use server";

import { db, COLLECTIONS } from "@/lib/firebase/admin";
import { obterSessaoAtual } from "@/lib/auth/session";
import { novaVendaSchema, filtrosBaixaSchema, darBaixaSchema } from "@/lib/validation/schemas";
import { verificarSenha } from "@/lib/auth/password";
import { brDateToIso } from "@/lib/utils/date";
import { salvarPessoaSeNova } from "./pessoas.actions";
import type { ActionResult, FiltrosBaixaInput, NovaVendaInput, Venda } from "@/types";
import type { Query, DocumentData } from "firebase-admin/firestore";

async function exigirSessao(): Promise<void> {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    throw new Error("Sessão inválida ou expirada.");
  }
}

export async function criarVenda(input: NovaVendaInput): Promise<ActionResult<{ id: string }>> {
  try {
    await exigirSessao();

    const parsed = novaVendaSchema.safeParse({
      tipoPagamento: input.tipoPagamento,
      pagtNome: input.pagtNome,
      clienteNome: input.clienteNome ?? "",
      data: input.data,
      vendaConsig: input.vendaConsig ?? "",
      valorCentavos: input.valorCentavos,
    });

    if (!parsed.success) {
      const primeiroErro = parsed.error.issues[0]?.message ?? "Dados inválidos.";
      return { ok: false, message: primeiroErro };
    }

    const dados = parsed.data;
    const dataIso = brDateToIso(dados.data);

    // Salva/recupera pagante (obrigatório)
    const pagtResultado = await salvarPessoaSeNova(dados.pagtNome);
    if (!pagtResultado.ok || !pagtResultado.data) {
      return { ok: false, message: "Falha ao registrar o pagante." };
    }

    // Cliente é opcional
    let clienteId: string | null = null;
    let clienteNomeFinal: string | null = null;
    if (dados.clienteNome && dados.clienteNome.trim()) {
      const clienteResultado = await salvarPessoaSeNova(dados.clienteNome);
      if (clienteResultado.ok && clienteResultado.data) {
        clienteId = clienteResultado.data.id;
        clienteNomeFinal = dados.clienteNome.trim();
      }
    }

    const novoDoc = await db.collection(COLLECTIONS.VENDAS).add({
      tipoPagamento: dados.tipoPagamento,
      pagtNome: dados.pagtNome.trim(),
      pagtNomeId: pagtResultado.data.id,
      clienteNome: clienteNomeFinal,
      clienteNomeId: clienteId,
      data: dataIso,
      vendaConsig: dados.vendaConsig?.trim() || null,
      valorCentavos: dados.valorCentavos,
      baixada: false,
      baixadaEm: null,
      criadoEm: new Date().toISOString(),
    });

    return { ok: true, data: { id: novoDoc.id } };
  } catch (error) {
    console.error("Erro ao criar venda:", error);
    return { ok: false, message: "Não foi possível salvar a venda." };
  }
}

export async function listarVendas(filtros: FiltrosBaixaInput): Promise<ActionResult<Venda[]>> {
  try {
    await exigirSessao();

    const parsed = filtrosBaixaSchema.safeParse(filtros);
    if (!parsed.success) {
      return { ok: false, message: "Filtros inválidos." };
    }
    const f = parsed.data;

    // Só mostra vendas não baixadas na tela de Baixa
    let query: Query<DocumentData> = db
      .collection(COLLECTIONS.VENDAS)
      .where("baixada", "==", false);

    if (f.dataInicio) {
      query = query.where("data", ">=", f.dataInicio);
    }
    if (f.dataFim) {
      query = query.where("data", "<=", f.dataFim);
    }
    if (f.tipoPagamento) {
      query = query.where("tipoPagamento", "==", f.tipoPagamento);
    }

    query = query.orderBy("data", "asc").orderBy("criadoEm", "asc").limit(500);

    const snapshot = await query.get();

    let vendas: Venda[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        tipoPagamento: data.tipoPagamento,
        pagtNome: data.pagtNome,
        pagtNomeId: data.pagtNomeId ?? null,
        clienteNome: data.clienteNome ?? null,
        clienteNomeId: data.clienteNomeId ?? null,
        data: data.data,
        vendaConsig: data.vendaConsig ?? null,
        valorCentavos: data.valorCentavos,
        baixada: data.baixada,
        baixadaEm: data.baixadaEm ?? null,
        criadoEm: data.criadoEm,
      };
    });

    // Filtro de nome é feito em memória (case-insensitive, parcial),
    // pois combinar range de nome + range de data no Firestore exigiria
    // índice composto que não cobre "contains" — trade-off aceitável
    // para o volume esperado deste sistema.
    if (f.nome) {
      const termoNormalizado = f.nome.toLowerCase().trim();
      vendas = vendas.filter(
        (v) =>
          v.pagtNome.toLowerCase().includes(termoNormalizado) ||
          (v.clienteNome?.toLowerCase().includes(termoNormalizado) ?? false)
      );
    }

    return { ok: true, data: vendas };
  } catch (error) {
    console.error("Erro ao listar vendas:", error);
    return { ok: false, message: "Não foi possível carregar as vendas." };
  }
}

export async function darBaixa(
  vendaIds: string[],
  senhaConfirmacao: string
): Promise<ActionResult> {
  try {
    await exigirSessao();

    const parsed = darBaixaSchema.safeParse({ vendaIds, senhaConfirmacao });
    if (!parsed.success) {
      const primeiroErro = parsed.error.issues[0]?.message ?? "Dados inválidos.";
      return { ok: false, message: primeiroErro };
    }

    // Reautenticação obrigatória antes de qualquer baixa (fallback contra erro humano)
    const hashEsperado = process.env.AUTH_PASSWORD_HASH;
    if (!hashEsperado) {
      console.error("AUTH_PASSWORD_HASH não configurado.");
      return { ok: false, message: "Erro interno de configuração." };
    }
    const senhaCorreta = await verificarSenha(parsed.data.senhaConfirmacao, hashEsperado);
    if (!senhaCorreta) {
      return { ok: false, message: "Senha incorreta. Baixa cancelada." };
    }

    const LIMITE_LOTE = 400; // margem de segurança abaixo do limite de 500 do Firestore
    if (parsed.data.vendaIds.length > LIMITE_LOTE) {
      return {
        ok: false,
        message: `Selecione no máximo ${LIMITE_LOTE} vendas por vez.`,
      };
    }

    const batch = db.batch();
    const agora = new Date().toISOString();

    for (const id of parsed.data.vendaIds) {
      const ref = db.collection(COLLECTIONS.VENDAS).doc(id);
      batch.update(ref, { baixada: true, baixadaEm: agora });
    }

    await batch.commit();

    return { ok: true, message: `${parsed.data.vendaIds.length} venda(s) baixada(s) com sucesso.` };
  } catch (error) {
    console.error("Erro ao dar baixa:", error);
    return { ok: false, message: "Não foi possível concluir a baixa." };
  }
}
