"use client";

import Checkbox from "@/components/ui/Checkbox";
import { centavosToDisplay } from "@/lib/utils/currency";
import { isoDateToBr } from "@/lib/utils/date";
import { classeFormaPagamento, labelFormaPagamento } from "@/lib/utils/formaPagamento";
import type { Venda } from "@/types";

interface VendaLinhaProps {
  venda: Venda;
  selecionada: boolean;
  onToggle: (id: string, checked: boolean) => void;
  // Quando a lista não está agrupada por data (ordenação por número),
  // mostramos a data na própria linha.
  mostrarData?: boolean;
}

/**
 * Template de colunas compartilhado entre header e linhas — garante que
 * tudo alinhe verticalmente independente do conteúdo de cada célula.
 * Precisa ser idêntico ao usado em VendaLinhaHeader.
 */
export function gridTemplateBaixa(mostrarData: boolean): string {
  const colunas = [
    "2rem", // checkbox
    "6.5rem", // número
    "6.5rem", // valor
    "minmax(8rem, 1fr)", // pagante
    "minmax(8rem, 1fr)", // cliente
  ];
  if (mostrarData) colunas.push("6rem"); // data
  colunas.push("12.5rem"); // forma de pagamento
  return colunas.join(" ");
}

export default function VendaLinha({ venda, selecionada, onToggle, mostrarData }: VendaLinhaProps) {
  return (
    <div
      className="grid items-center gap-x-3 py-2.5 px-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors text-sm"
      style={{ gridTemplateColumns: gridTemplateBaixa(!!mostrarData) }}
    >
      <Checkbox
        checked={selecionada}
        onChange={(checked) => onToggle(venda.id, checked)}
        ariaLabel={`Selecionar venda de ${venda.pagtNome}`}
      />

      {venda.vendaConsig ? (
        <span className="text-base font-bold font-mono text-red-700 bg-gray-200 border border-gray-400 px-2 py-1 rounded text-center whitespace-nowrap">
          {venda.vendaConsig}
        </span>
      ) : (
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
    </div>
  );
}