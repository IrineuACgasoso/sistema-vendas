"use client";

import { useState } from "react";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import CurrencyInput from "@/components/ui/CurrencyInput";
import { centavosToDisplay } from "@/lib/utils/currency";
import { isoDateToBr } from "@/lib/utils/date";
import { classeFormaPagamento, labelFormaPagamento } from "@/lib/utils/formaPagamento";
import type { Venda } from "@/types";

interface VendaLinhaVendaProps {
  venda: Venda;
  selecionada: boolean;
  onToggle: (id: string, checked: boolean) => void;
  onAdicionarNumero: (venda: Venda) => void;
  mostrarData?: boolean;
  // Modo "editar": clicar na linha abre edição inline (nome, valor, número)
  modoEdicao?: boolean;
  emEdicao?: boolean;
  onIniciarEdicao?: (id: string) => void;
  onSalvarEdicao?: (
    id: string,
    dados: { pagtNome: string; vendaConsig: string; valorCentavos: number }
  ) => Promise<{ ok: boolean; message?: string }>;
  onCancelarEdicao?: () => void;
  // Modo "excluir": checkbox passa a servir pra seleção de exclusão, não de fechar caixa
  modoExclusao?: boolean;
  selecionadaExclusao?: boolean;
  onToggleExclusao?: (id: string, checked: boolean) => void;
}

/**
 * Template de colunas compartilhado entre header e linhas — garante que
 * tudo alinhe verticalmente independente do conteúdo de cada célula.
 * Precisa ser idêntico ao usado em VendaLinhaVendaHeader.
 */
export function gridTemplateVendas(mostrarData: boolean): string {
  const colunas = [
    "2rem", // checkbox
    "6rem", // valor
    "minmax(7rem, 1fr)", // pagante
    "minmax(7rem, 1fr)", // cliente
    "9.5rem", // número (ou botão "Adicionar número")
  ];
  if (mostrarData) colunas.push("5.5rem"); // data
  colunas.push("11.5rem"); // forma de pagamento
  colunas.push("6rem"); // status
  return colunas.join(" ");
}

const STATUS_CLASSES: Record<"aberta" | "fechada", string> = {
  aberta: "text-amber-700 bg-amber-50 border-amber-200",
  fechada: "text-emerald-700 bg-emerald-50 border border-emerald-200",
};

export default function VendaLinhaVenda({
  venda,
  selecionada,
  onToggle,
  onAdicionarNumero,
  mostrarData,
  modoEdicao,
  emEdicao,
  onIniciarEdicao,
  onSalvarEdicao,
  onCancelarEdicao,
  modoExclusao,
  selecionadaExclusao,
  onToggleExclusao,
}: VendaLinhaVendaProps) {
  const temNumero = !!venda.vendaConsig;
  const podeSelecionar = (temNumero || venda.promissoria) && !venda.fechada;
  const status: "aberta" | "fechada" = venda.fechada ? "fechada" : "aberta";

  const [nomeEdit, setNomeEdit] = useState(venda.pagtNome);
  const [numeroEdit, setNumeroEdit] = useState(venda.vendaConsig ?? "");
  const [valorEdit, setValorEdit] = useState(venda.valorCentavos);
  const [erroEdit, setErroEdit] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function iniciarEdicao() {
    if (!modoEdicao || emEdicao || venda.fechada) return;
    setNomeEdit(venda.pagtNome);
    setNumeroEdit(venda.vendaConsig ?? "");
    setValorEdit(venda.valorCentavos);
    setErroEdit(null);
    onIniciarEdicao?.(venda.id);
  }

  async function salvar() {
    if (!nomeEdit.trim()) {
      setErroEdit("Informe o nome.");
      return;
    }
    if (valorEdit <= 0) {
      setErroEdit("Informe um valor maior que zero.");
      return;
    }
    setErroEdit(null);
    setSalvando(true);
    const resultado = await onSalvarEdicao?.(venda.id, {
      pagtNome: nomeEdit.trim(),
      vendaConsig: numeroEdit.trim(),
      valorCentavos: valorEdit,
    });
    setSalvando(false);
    if (resultado && !resultado.ok) {
      setErroEdit(resultado.message ?? "Falha ao salvar.");
    }
  }

  if (emEdicao) {
    return (
      <div className="flex flex-col gap-2 py-2 px-4 border-b border-gray-100 last:border-b-0 bg-blue-50/40 text-sm">
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-28">
            <CurrencyInput
              label="Valor"
              valueCentavos={valorEdit}
              onChangeCentavos={setValorEdit}
              autoFocus
            />
          </div>
          <div className="flex-1 min-w-[8rem]">
            <TextInput
              label="Pagante"
              value={nomeEdit}
              onChange={(e) => setNomeEdit(e.target.value)}
            />
          </div>
          <div className="w-32">
            <TextInput
              label="Nº venda"
              value={numeroEdit}
              onChange={(e) => setNumeroEdit(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <Button variant="primary" onClick={salvar} loading={salvando} className="mb-[1px]">
            Salvar
          </Button>
          <Button
            variant="secondary"
            onClick={() => onCancelarEdicao?.()}
            disabled={salvando}
            className="mb-[1px]"
          >
            Cancelar
          </Button>
        </div>
        {erroEdit && <p className="text-xs text-red-600">{erroEdit}</p>}
      </div>
    );
  }

  return (
    <div
      className={`grid items-center gap-x-3 py-1.5 px-4 border-b border-gray-100 last:border-b-0 transition-colors text-sm ${
        modoEdicao && !venda.fechada ? "cursor-pointer hover:bg-blue-50" : "hover:bg-gray-50"
      }`}
      style={{ gridTemplateColumns: gridTemplateVendas(!!mostrarData) }}
      onClick={iniciarEdicao}
    >
      {modoExclusao ? (
        <span onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={!!selecionadaExclusao}
            onChange={(checked) => onToggleExclusao?.(venda.id, checked)}
            ariaLabel={`Selecionar venda de ${venda.pagtNome} para excluir`}
          />
        </span>
      ) : podeSelecionar ? (
        <span onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selecionada}
            onChange={(checked) => onToggle(venda.id, checked)}
            ariaLabel={`Selecionar venda de ${venda.pagtNome}`}
          />
        </span>
      ) : (
        // Vendas sem número (exceto promissórias), ou já fechadas, não podem ser selecionadas pra fechar caixa
        <span />
      )}

      <span className="font-bold text-gray-950 whitespace-nowrap tabular-nums">
        {centavosToDisplay(venda.valorCentavos)}
      </span>

      <span className="font-semibold text-gray-700 truncate" title={venda.pagtNome}>
        {venda.pagtNome}
      </span>

      <span className="font-semibold text-gray-600 truncate" title={venda.clienteNome ?? undefined}>
        {venda.clienteNome ?? ""}
      </span>

      {temNumero ? (
        <span className="text-base font-bold font-mono text-red-600 bg-gray-100 border px-2.5 py-1 rounded text-center whitespace-nowrap">
          {venda.vendaConsig}
        </span>
      ) : (
        <Button
          variant="secondary"
          className="text-xs px-2 py-1 whitespace-nowrap"
          onClick={(e) => {
            e.stopPropagation();
            onAdicionarNumero(venda);
          }}
        >
          Adicionar número
        </Button>
      )}

      {mostrarData && (
        <span className="text-xs text-gray-400 whitespace-nowrap">{isoDateToBr(venda.data)}</span>
      )}

      <span
        className={`text-xs font-medium uppercase whitespace-nowrap px-2 py-1 rounded border text-center ${classeFormaPagamento(
          venda.tipoPagamento,
          venda.promissoria
        )}`}
      >
        {labelFormaPagamento(venda.tipoPagamento, venda.promissoria)}
      </span>

      <span
        className={`text-xs font-semibold px-2 py-1 rounded border text-center whitespace-nowrap ${STATUS_CLASSES[status]}`}
      >
        {status === "fechada" ? "Fechada" : "Aberta"}
      </span>
    </div>
  );
}