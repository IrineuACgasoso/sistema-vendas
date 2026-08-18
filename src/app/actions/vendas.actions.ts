"use server";

import { db, COLLECTIONS } from "@/lib/firebase/admin";
import { obterSessaoAtual } from "@/lib/auth/session";
import {
  novaVendaSchema,
  filtrosBaixaSchema,
  darBaixaSchema,
  fecharVendasSchema,
  adicionarNumeroVendaSchema,
} from "@/lib/validation/schemas";
import { verificarSenha } from "@/lib/auth/password";
import { brDateToIso } from "@/lib/utils/date";
import { salvarPessoaSeNova } from "./pessoas.actions";
import type {
  ActionResult,
  FiltrosBaixaInput,
  ModoListagemVendas,
  NovaVendaInput,
  Venda,
} from "@/types";
import type { Query, DocumentData } from "firebase-admin/firestore";

async function exigirSessao(): Promise<void> {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    throw new Error("Sessão inválida ou expirada.");
  }
}

/**
 * Garante que nenhuma outra venda já use o mesmo número (vendaConsig).
 * `ignorarVendaId` permite reaplicar a mesma checagem numa venda já existente
 * (ex: reenviar o mesmo número que ela já tinha) sem falso-positivo.
 */
async function existeVendaComMesmoNumero(
  vendaConsig: string,
  ignorarVendaId?: string
): Promise<boolean> {
  const numero = vendaConsig.trim();
  if (!numero) return false;

  const snapshot = await db
    .collection(COLLECTIONS.VENDAS)
    .where("vendaConsig", "==", numero)
    .limit(5)
    .get();

  return snapshot.docs.some((doc) => doc.id !== ignorarVendaId);
}

export async function criarVenda(input: NovaVendaInput): Promise<ActionResult<{ id: string }>> {
  try {
    await exigirSessao();

    const parsed = novaVendaSchema.safeParse({
      tipoPagamento: input.tipoPagamento,
      promissoria: input.promissoria ?? false,
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

    if (dados.vendaConsig && dados.vendaConsig.trim()) {
      if (await existeVendaComMesmoNumero(dados.vendaConsig)) {
        return {
          ok: false,
          message: `Já existe uma venda com o número "${dados.vendaConsig.trim()}".`,
        };
      }
    }

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
      promissoria: dados.promissoria,
      pagtNome: dados.pagtNome.trim(),
      pagtNomeId: pagtResultado.data.id,
      clienteNome: clienteNomeFinal,
      clienteNomeId: clienteId,
      data: dataIso,
      vendaConsig: dados.vendaConsig?.trim() || null,
      valorCentavos: dados.valorCentavos,
      fechada: false,
      fechadaEm: null,
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

export async function listarVendas(
  filtros: FiltrosBaixaInput,
  modo: ModoListagemVendas = "vendas"
): Promise<ActionResult<Venda[]>> {
  try {
    await exigirSessao();

    const parsed = filtrosBaixaSchema.safeParse(filtros);
    if (!parsed.success) {
      return { ok: false, message: "Filtros inválidos." };
    }
    const f = parsed.data;

    let query: Query<DocumentData> = db.collection(COLLECTIONS.VENDAS);

    // Regra de negócio central: a tela de Baixa só pode enxergar vendas que já
    // foram fechadas (ou seja, que já têm número de venda confirmado). Uma vez
    // que uma venda recebe baixa, o documento é apagado do banco (ver darBaixa),
    // então não é mais necessário filtrar por "baixada". A tela de Vendas
    // enxerga tudo — abertas e fechadas — pois é ali que isso é resolvido.
    if (modo === "baixa") {
      query = query.where("fechada", "==", true);
    }

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
        promissoria: data.promissoria ?? false,
        pagtNome: data.pagtNome,
        pagtNomeId: data.pagtNomeId ?? null,
        clienteNome: data.clienteNome ?? null,
        clienteNomeId: data.clienteNomeId ?? null,
        data: data.data,
        vendaConsig: data.vendaConsig ?? null,
        valorCentavos: data.valorCentavos,
        fechada: data.fechada ?? false,
        fechadaEm: data.fechadaEm ?? null,
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

    // Dar baixa remove a venda definitivamente do banco: não há necessidade de
    // manter histórico de vendas já baixadas neste sistema.
    const batch = db.batch();

    for (const id of parsed.data.vendaIds) {
      const ref = db.collection(COLLECTIONS.VENDAS).doc(id);
      batch.delete(ref);
    }

    await batch.commit();

    return { ok: true, message: `${parsed.data.vendaIds.length} venda(s) baixada(s) e removida(s) com sucesso.` };
  } catch (error) {
    console.error("Erro ao dar baixa:", error);
    return { ok: false, message: "Não foi possível concluir a baixa." };
  }
}

/**
 * "Fechar Caixa": marca as vendas selecionadas como fechada = true.
 * Só a partir daí elas passam a aparecer na tela de Baixa.
 * Exige que cada venda selecionada já tenha vendaConsig (número da venda)
 * preenchido — o client já deve impedir a seleção de vendas sem número,
 * mas a validação aqui é a que garante a regra de verdade.
 */
export async function fecharVendas(vendaIds: string[]): Promise<ActionResult> {
  try {
    await exigirSessao();

    const parsed = fecharVendasSchema.safeParse({ vendaIds });
    if (!parsed.success) {
      const primeiroErro = parsed.error.issues[0]?.message ?? "Dados inválidos.";
      return { ok: false, message: primeiroErro };
    }

    const refs = parsed.data.vendaIds.map((id) => db.collection(COLLECTIONS.VENDAS).doc(id));
    const snapshots = await db.getAll(...refs);

    for (const snap of snapshots) {
      if (!snap.exists) {
        return { ok: false, message: "Uma das vendas selecionadas não existe mais." };
      }
      const data = snap.data()!;
      if (!data.vendaConsig || !String(data.vendaConsig).trim()) {
        return {
          ok: false,
          message: `A venda de ${data.pagtNome} ainda não tem número de venda. Adicione o número antes de fechar.`,
        };
      }
      if (data.fechada === true) {
        return { ok: false, message: `A venda de ${data.pagtNome} já está fechada.` };
      }
    }

    const LIMITE_LOTE = 400;
    if (parsed.data.vendaIds.length > LIMITE_LOTE) {
      return { ok: false, message: `Selecione no máximo ${LIMITE_LOTE} vendas por vez.` };
    }

    const batch = db.batch();
    const agora = new Date().toISOString();
    for (const ref of refs) {
      batch.update(ref, { fechada: true, fechadaEm: agora });
    }
    await batch.commit();

    return {
      ok: true,
      message: `${parsed.data.vendaIds.length} venda(s) fechada(s) com sucesso. Já estão disponíveis para Baixa.`,
    };
  } catch (error) {
    console.error("Erro ao fechar vendas:", error);
    return { ok: false, message: "Não foi possível fechar as vendas selecionadas." };
  }
}

/**
 * Preenche o número da venda (vendaConsig) quando ele é descoberto depois
 * do cadastro original. Só permitido enquanto a venda ainda não foi fechada.
 */
export async function adicionarNumeroVenda(
  vendaId: string,
  vendaConsig: string
): Promise<ActionResult> {
  try {
    await exigirSessao();

    const parsed = adicionarNumeroVendaSchema.safeParse({ vendaId, vendaConsig });
    if (!parsed.success) {
      const primeiroErro = parsed.error.issues[0]?.message ?? "Dados inválidos.";
      return { ok: false, message: primeiroErro };
    }

    const ref = db.collection(COLLECTIONS.VENDAS).doc(parsed.data.vendaId);
    const snap = await ref.get();
    if (!snap.exists) {
      return { ok: false, message: "Venda não encontrada." };
    }
    const data = snap.data()!;
    if (data.fechada === true) {
      return { ok: false, message: "Esta venda já está fechada e não pode ser alterada." };
    }

    if (await existeVendaComMesmoNumero(parsed.data.vendaConsig, parsed.data.vendaId)) {
      return {
        ok: false,
        message: `Já existe uma venda com o número "${parsed.data.vendaConsig}".`,
      };
    }

    await ref.update({ vendaConsig: parsed.data.vendaConsig });

    return { ok: true, message: "Número da venda adicionado com sucesso." };
  } catch (error) {
    console.error("Erro ao adicionar número da venda:", error);
    return { ok: false, message: "Não foi possível adicionar o número da venda." };
  }
}