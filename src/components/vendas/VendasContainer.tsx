"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FiltrosBaixa, { type FiltrosState } from "@/components/baixa/FiltrosBaixa";
import VendasPorDataVenda from "./VendasPorDataVenda";
import BarraFecharCaixa from "./BarraFecharCaixa";
import AdicionarNumeroModal from "./AdicionarNumeroModal";
import BackToMenuButton from "@/components/ui/BackToMenuButton";
import Spinner from "@/components/ui/Spinner";
import { listarVendas, fecharVendas, adicionarNumeroVenda } from "@/app/actions/vendas.actions";
import { brDateToIso, isValidBrDate } from "@/lib/utils/date";
import { centavosToDisplay } from "@/lib/utils/currency";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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

  const nomeDebounced = useDebouncedValue(filtros.nome, 300);

  const carregarVendas = useCallback(async () => {
    setErro(null);

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
        tipoPagamento: filtros.tipoPagamento || undefined,
      },
      "vendas"
    );
    setCarregando(false);

    if (!resultado.ok || !resultado.data) {
      setErro(resultado.message ?? "Erro ao carregar vendas.");
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
  }, [filtros.dataInicioBr, filtros.dataFimBr, filtros.tipoPagamento, nomeDebounced]);

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
    if (!resultado.ok) {
      return { ok: false, message: resultado.message };
    }
    setVendaParaNumero(null);
    setSucesso(resultado.message ?? "Número adicionado com sucesso.");
    await carregarVendas();
    return { ok: true };
  }

  return (
    <div className="relative max-w-3xl mx-auto flex flex-col gap-4 pb-4">
      <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
        <BackToMenuButton />
        <h2 className="text-lg font-semibold pr-24">Vendas</h2>
        <p className="text-xs text-gray-500 mt-1">
          Consulte, complete o número da venda e feche o caixa. Só depois de fechada uma
          venda fica disponível para dar baixa.
        </p>
      </div>

      <FiltrosBaixa filtros={filtros} onChange={setFiltros} />

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
        />
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
    </div>
  );
}
