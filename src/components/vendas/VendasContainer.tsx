"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FiltrosBaixa, { type FiltrosState } from "@/components/baixa/FiltrosBaixa";
import ConfirmarSenhaModal from "@/components/baixa/ConfirmarSenhaModal";
import VendasPorDataVenda from "./VendasPorDataVenda";
import BarraFecharCaixa from "./BarraFecharCaixa";
import AdicionarNumeroModal from "./AdicionarNumeroModal";
import BackToMenuButton from "@/components/ui/BackToMenuButton";
import Spinner from "@/components/ui/Spinner";
import {
  listarVendas,
  fecharVendas,
  adicionarNumeroVenda,
  atualizarVenda,
  excluirVendas,
} from "@/app/actions/vendas.actions";
import { brDateToIso, isValidBrDate } from "@/lib/utils/date";
import { centavosToDisplay } from "@/lib/utils/currency";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSessaoExpirada } from "@/hooks/useSessaoExpirada";
import { ordenarVendas } from "@/lib/utils/ordenarVendas";
import type { Venda } from "@/types";

const FILTROS_INICIAIS: FiltrosState = {
  dataInicioBr: "",
  dataFimBr: "",
  nome: "",
  tipoPagamento: "",
  ordenarPor: "data",
  ordenarDirecao: "asc",
};

export default function VendasContainer() {
  const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_INICIAIS);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [vendaParaNumero, setVendaParaNumero] = useState<Venda | null>(null);

  // Modo "editar": clicar num ícone ativa o modo; clicar numa linha edita ela.
  const [modoEdicao, setModoEdicao] = useState(false);
  const [idEmEdicao, setIdEmEdicao] = useState<string | null>(null);

  // Modo "excluir": ativa checkboxes de seleção pra exclusão definitiva.
  const [modoExclusao, setModoExclusao] = useState(false);
  const [selecionadasExclusao, setSelecionadasExclusao] = useState<Set<string>>(new Set());
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);

  const nomeDebounced = useDebouncedValue(filtros.nome, 300);
  const { verificarSessao } = useSessaoExpirada();

  const carregarVendas = useCallback(async (opts?: { silencioso?: boolean }) => {
    setErro(null);

    const dataInicio =
      filtros.dataInicioBr && isValidBrDate(filtros.dataInicioBr)
        ? brDateToIso(filtros.dataInicioBr)
        : undefined;
    const dataFim =
      filtros.dataFimBr && isValidBrDate(filtros.dataFimBr)
        ? brDateToIso(filtros.dataFimBr)
        : undefined;

    if (!opts?.silencioso) setCarregando(true);
    const resultado = await listarVendas(
      {
        dataInicio,
        dataFim,
        nome: nomeDebounced || undefined,
        tipoPagamento:
          filtros.tipoPagamento === "" || filtros.tipoPagamento === "promissoria"
            ? undefined
            : filtros.tipoPagamento,
        promissoria: filtros.tipoPagamento === "promissoria" ? true : undefined,
      },
      "vendas"
    );
    if (!opts?.silencioso) setCarregando(false);

    if (verificarSessao(resultado)) return;

    if (!resultado.ok || !resultado.data) {
      const msg = resultado.message ?? "Erro ao carregar vendas.";
      // Se a cota do Firestore estourou, não faz sentido continuar batendo
      // no banco de 30 em 30s — desliga o polling até a próxima ação manual.
      if (/quota|resource_exhausted/i.test(msg)) {
        pollingAtivoRef.current = false;
      }
      if (!opts?.silencioso) setErro(msg);
      return;
    }

    setVendas(resultado.data);
    setSelecionadas((prev) => {
      const idsAtuais = new Set(resultado.data!.map((v) => v.id));
      const novo = new Set<string>();
      prev.forEach((id) => {
        if (idsAtuais.has(id)) novo.add(id);
      });
      return novo;
    });
  }, [
    filtros.dataInicioBr,
    filtros.dataFimBr,
    filtros.tipoPagamento,
    nomeDebounced,
    verificarSessao,
  ]);

  useEffect(() => {
    carregarVendas();
  }, [carregarVendas]);

  // Sincronização automática: se outra aba/pop-up cadastrar uma venda,
  // essa tela pega a mudança sozinha, sem precisar de F5. Só faz polling
  // silencioso (sem o spinner de carregamento) e evita rodar enquanto o
  // usuário está editando/selecionando algo, pra não atrapalhar.
  //
  // Intervalo de 30s (não 5s): cada poll é uma leitura no Firestore por
  // aba aberta — 5s em 5s estourava a cota gratuita rápido demais. Se
  // mesmo assim vier erro de cota (RESOURCE_EXHAUSTED), o polling para
  // sozinho em vez de continuar martelando o banco.
  const pollingAtivoRef = useRef(true);
  useEffect(() => {
    const intervalo = setInterval(() => {
      if (!pollingAtivoRef.current || modoEdicao || modoExclusao || document.hidden) return;
      carregarVendas({ silencioso: true });
    }, 120000);
    return () => clearInterval(intervalo);
  }, [carregarVendas, modoEdicao, modoExclusao]);

  function handleToggleVenda(id: string, checked: boolean) {
    setSelecionadas((prev) => {
      const novo = new Set(prev);
      if (checked) novo.add(id);
      else novo.delete(id);
      return novo;
    });
  }

  // Vendas que podem ser fechadas: têm número (ou são promissória) e ainda
  // não estão fechadas — mesma regra usada pra liberar o checkbox de cada linha.
  const idsFechaveis = useMemo(
    () => vendas.filter((v) => (!!v.vendaConsig || v.promissoria) && !v.fechada).map((v) => v.id),
    [vendas]
  );
  const todasFechaveisSelecionadas =
    idsFechaveis.length > 0 && idsFechaveis.every((id) => selecionadas.has(id));

  function handleToggleSelecionarTodas() {
    setSelecionadas(todasFechaveisSelecionadas ? new Set() : new Set(idsFechaveis));
  }

  const totalSelecionadoCentavos = useMemo(() => {
    return vendas
      .filter((v) => selecionadas.has(v.id))
      .reduce((soma, v) => soma + v.valorCentavos, 0);
  }, [vendas, selecionadas]);

  const vendasOrdenadas = useMemo(
    () => ordenarVendas(vendas, filtros.ordenarPor, filtros.ordenarDirecao),
    [vendas, filtros.ordenarPor, filtros.ordenarDirecao]
  );

  async function handleFecharCaixa() {
    const confirmou = window.confirm(
      `Confirma fechar ${selecionadas.size} venda(s), totalizando ${centavosToDisplay(
        totalSelecionadoCentavos
      )}? Elas passarão a ficar disponíveis para Baixa.`
    );
    if (!confirmou) return;

    setErro(null);
    setSucesso(null);
    const resultado = await fecharVendas(Array.from(selecionadas));
    if (verificarSessao(resultado)) return;
    if (!resultado.ok) {
      setErro(resultado.message ?? "Erro ao fechar vendas.");
      return;
    }
    setSucesso(resultado.message ?? "Vendas fechadas com sucesso.");
    setSelecionadas(new Set());
    await carregarVendas();
  }

  async function handleConfirmarNumero(
    numero: string
  ): Promise<{ ok: boolean; message?: string }> {
    if (!vendaParaNumero) return { ok: false, message: "Venda inválida." };
    const resultado = await adicionarNumeroVenda(vendaParaNumero.id, numero);
    if (verificarSessao(resultado)) return { ok: true };
    if (!resultado.ok) {
      return { ok: false, message: resultado.message };
    }
    setVendaParaNumero(null);
    setSucesso(resultado.message ?? "Número adicionado com sucesso.");
    // Atualiza só essa venda em memória — não recarrega a lista inteira,
    // evitando o "piscar"/refresh completo da tela.
    setVendas((prev) =>
      prev.map((v) => (v.id === vendaParaNumero.id ? { ...v, vendaConsig: numero } : v))
    );
    return { ok: true };
  }

  function toggleModoEdicao() {
    setModoEdicao((prev) => !prev);
    setIdEmEdicao(null);
    if (!modoEdicao) {
      setModoExclusao(false);
      setSelecionadasExclusao(new Set());
    }
  }

  function toggleModoExclusao() {
    setModoExclusao((prev) => !prev);
    setSelecionadasExclusao(new Set());
    if (!modoExclusao) {
      setModoEdicao(false);
      setIdEmEdicao(null);
    }
  }

  function handleToggleExclusao(id: string, checked: boolean) {
    setSelecionadasExclusao((prev) => {
      const novo = new Set(prev);
      if (checked) novo.add(id);
      else novo.delete(id);
      return novo;
    });
  }

  async function handleSalvarEdicao(
    id: string,
    dados: { pagtNome: string; vendaConsig: string; valorCentavos: number }
  ): Promise<{ ok: boolean; message?: string }> {
    const resultado = await atualizarVenda(id, dados);
    if (verificarSessao(resultado)) return { ok: true };
    if (!resultado.ok) {
      return { ok: false, message: resultado.message };
    }
    setSucesso(resultado.message ?? "Venda atualizada com sucesso.");
    setVendas((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              pagtNome: dados.pagtNome,
              vendaConsig: dados.vendaConsig || null,
              valorCentavos: dados.valorCentavos,
            }
          : v
      )
    );
    setIdEmEdicao(null);
    return { ok: true };
  }

  async function handleConfirmarExclusao(
    senha: string
  ): Promise<{ ok: boolean; message?: string }> {
    const ids = Array.from(selecionadasExclusao);
    const resultado = await excluirVendas(ids, senha);
    if (verificarSessao(resultado)) return { ok: true };
    if (!resultado.ok) {
      return { ok: false, message: resultado.message };
    }
    setSucesso(resultado.message ?? "Vendas excluídas com sucesso.");
    setVendas((prev) => prev.filter((v) => !selecionadasExclusao.has(v.id)));
    setSelecionadasExclusao(new Set());
    setModalExclusaoAberto(false);
    setModoExclusao(false);
    return { ok: true };
  }

  const totalSelecionadoExclusaoCentavos = useMemo(() => {
    return vendas
      .filter((v) => selecionadasExclusao.has(v.id))
      .reduce((soma, v) => soma + v.valorCentavos, 0);
  }, [vendas, selecionadasExclusao]);

  return (
    <div className="relative max-w-5xl mx-auto flex flex-col gap-3 pb-3">
      <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-3">
        <BackToMenuButton />
        <h2 className="text-xl font-semibold pr-44">Vendas</h2>
        <div className="absolute right-28 top-1/2 -translate-y-1/2 flex gap-2">
          <button
            type="button"
            onClick={toggleModoEdicao}
            title={modoEdicao ? "Sair do modo de edição" : "Editar vendas"}
            aria-label="Editar vendas"
            className={`p-2 rounded-md border transition-colors ${
              modoEdicao
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" strokeLinecap="round" />
              <path
                d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={toggleModoExclusao}
            title={modoExclusao ? "Sair do modo de exclusão" : "Excluir vendas"}
            aria-label="Excluir vendas"
            className={`p-2 rounded-md border transition-colors ${
              modoExclusao
                ? "bg-red-600 border-red-600 text-white"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" strokeLinecap="round" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M19 6l-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {modoEdicao && (
        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
          Modo de edição ativo: clique numa venda aberta para editar nome, valor e número.
        </p>
      )}
      {modoExclusao && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          Modo de exclusão ativo: selecione as vendas e confirme com sua senha. Isso apaga os
          lançamentos — não é o mesmo que dar baixa.
        </p>
      )}

      <FiltrosBaixa filtros={filtros} onChange={setFiltros} />

      {!modoEdicao && !modoExclusao && idsFechaveis.length > 0 && (
        <button
          type="button"
          onClick={handleToggleSelecionarTodas}
          className="self-start text-xs font-medium text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md px-3 py-1.5 transition-colors"
        >
          {todasFechaveisSelecionadas
            ? "Desmarcar todas"
            : `Selecionar todas (${idsFechaveis.length})`}
        </button>
      )}

      {erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {erro}
        </p>
      )}
      {sucesso && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          {sucesso}
        </p>
      )}

      {carregando ? (
        <div className="flex justify-center py-8">
          <Spinner size={32} />
        </div>
      ) : (
        <VendasPorDataVenda
          vendas={vendasOrdenadas}
          selecionadas={selecionadas}
          onToggle={handleToggleVenda}
          onAdicionarNumero={(venda) => setVendaParaNumero(venda)}
          ordenarPor={filtros.ordenarPor}
          modoEdicao={modoEdicao}
          idEmEdicao={idEmEdicao}
          onIniciarEdicao={setIdEmEdicao}
          onSalvarEdicao={handleSalvarEdicao}
          onCancelarEdicao={() => setIdEmEdicao(null)}
          modoExclusao={modoExclusao}
          selecionadasExclusao={selecionadasExclusao}
          onToggleExclusao={handleToggleExclusao}
        />
      )}

      {modoExclusao && (
        <div className="sticky bottom-0 bg-white border border-red-200 rounded-lg shadow-md px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-700">
            <strong>{selecionadasExclusao.size}</strong> venda(s) selecionada(s) para excluir —{" "}
            {centavosToDisplay(totalSelecionadoExclusaoCentavos)}
          </span>
          <button
            type="button"
            disabled={selecionadasExclusao.size === 0}
            onClick={() => setModalExclusaoAberto(true)}
            className="px-4 py-2 rounded-md font-medium text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Excluir selecionadas
          </button>
        </div>
      )}

      <BarraFecharCaixa
        quantidade={selecionadas.size}
        totalCentavos={totalSelecionadoCentavos}
        onFecharCaixa={handleFecharCaixa}
      />

      <AdicionarNumeroModal
        open={!!vendaParaNumero}
        nomePagante={vendaParaNumero?.pagtNome ?? ""}
        onCancelar={() => setVendaParaNumero(null)}
        onConfirmar={handleConfirmarNumero}
      />

      <ConfirmarSenhaModal
        open={modalExclusaoAberto}
        quantidadeSelecionados={selecionadasExclusao.size}
        totalFormatado={centavosToDisplay(totalSelecionadoExclusaoCentavos)}
        onCancelar={() => setModalExclusaoAberto(false)}
        onConfirmar={handleConfirmarExclusao}
        titulo="Confirmar exclusão"
        confirmarLabel="Excluir definitivamente"
        mensagem={
          <>
            Você está prestes a <strong>excluir permanentemente</strong>{" "}
            <strong>{selecionadasExclusao.size} venda(s)</strong>, totalizando{" "}
            <strong>{centavosToDisplay(totalSelecionadoExclusaoCentavos)}</strong>. Isso NÃO é
            dar baixa — os lançamentos serão apagados e não poderão ser recuperados.
          </>
        }
      />
    </div>
  );
}