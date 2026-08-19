"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FiltrosBaixa, { type FiltrosState } from "./FiltrosBaixa";
import VendasPorData from "./VendasPorData";
import BarraAcaoSelecionados from "./BarraAcaoSelecionados";
import ConfirmarSenhaModal from "./ConfirmarSenhaModal";
import BackToMenuButton from "@/components/ui/BackToMenuButton";
import Spinner from "@/components/ui/Spinner";
import { listarVendas, darBaixa } from "@/app/actions/vendas.actions";
import { confirmarSenhaAtual } from "@/app/actions/auth.actions";
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

export default function BaixaContainer() {
  const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_INICIAIS);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const nomeDebounced = useDebouncedValue(filtros.nome, 300);
  const { verificarSessao } = useSessaoExpirada();

  const carregarVendas = useCallback(async () => {
    setErro(null);

    // Só converte datas se estiverem completas e válidas; senão ignora o filtro
    const dataInicio =
      filtros.dataInicioBr && isValidBrDate(filtros.dataInicioBr)
        ? brDateToIso(filtros.dataInicioBr)
        : undefined;
    const dataFim =
      filtros.dataFimBr && isValidBrDate(filtros.dataFimBr)
        ? brDateToIso(filtros.dataFimBr)
        : undefined;

    setCarregando(true);
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
      "baixa"
    );
    setCarregando(false);

    if (verificarSessao(resultado)) return;

    if (!resultado.ok || !resultado.data) {
      setErro(resultado.message ?? "Erro ao carregar vendas.");
      return;
    }

    setVendas(resultado.data);
    // Remove seleções de vendas que não estão mais na lista filtrada
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

  function handleToggleVenda(id: string, checked: boolean) {
    setSelecionadas((prev) => {
      const novo = new Set(prev);
      if (checked) novo.add(id);
      else novo.delete(id);
      return novo;
    });
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

  function handleAbrirConfirmacao() {
    const confirmouPrimeiraEtapa = window.confirm(
      `Confirma dar baixa em ${selecionadas.size} venda(s), totalizando ${centavosToDisplay(
        totalSelecionadoCentavos
      )}?`
    );
    if (!confirmouPrimeiraEtapa) return;
    setModalAberto(true);
  }

  async function handleConfirmarComSenha(senha: string): Promise<{ ok: boolean; message?: string }> {
    // Fallback extra: reautentica antes de executar a baixa
    const autenticacao = await confirmarSenhaAtual(senha);
    if (!autenticacao.ok) {
      return { ok: false, message: autenticacao.message };
    }

    const resultado = await darBaixa(Array.from(selecionadas), senha);
    if (verificarSessao(resultado)) return { ok: true }; // já redirecionando; evita mostrar erro
    if (!resultado.ok) {
      return { ok: false, message: resultado.message };
    }

    setModalAberto(false);
    setSelecionadas(new Set());
    await carregarVendas();
    return { ok: true };
  }

  return (
    <div className="relative max-w-5xl mx-auto flex flex-col gap-3 pb-3">
      <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-3">
        <BackToMenuButton />
        <h2 className="text-xl font-semibold pr-24">Dar Baixa em Vendas</h2>
      </div>

      <FiltrosBaixa filtros={filtros} onChange={setFiltros} />

      {erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {erro}
        </p>
      )}

      {carregando ? (
        <div className="flex justify-center py-8">
          <Spinner size={32} />
        </div>
      ) : (
        <VendasPorData
          vendas={vendasOrdenadas}
          selecionadas={selecionadas}
          onToggle={handleToggleVenda}
          ordenarPor={filtros.ordenarPor}
        />
      )}

      <BarraAcaoSelecionados
        quantidade={selecionadas.size}
        totalCentavos={totalSelecionadoCentavos}
        onDarBaixa={handleAbrirConfirmacao}
      />

      <ConfirmarSenhaModal
        open={modalAberto}
        quantidadeSelecionados={selecionadas.size}
        totalFormatado={centavosToDisplay(totalSelecionadoCentavos)}
        onCancelar={() => setModalAberto(false)}
        onConfirmar={handleConfirmarComSenha}
      />
    </div>
  );
}