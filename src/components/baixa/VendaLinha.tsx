"use client";

import Checkbox from "@/components/ui/Checkbox";
import { centavosToDisplay } from "@/lib/utils/currency";
import { isoDateToBr } from "@/lib/utils/date";
import { labelFormaPagamento } from "@/lib/utils/formaPagamento";
import type { Venda } from "@/types";

interface VendaLinhaProps {
  venda: Venda;
  selecionada: boolean;
  onToggle: (id: string, checked: boolean) => void;
  // Quando a lista não está agrupada por data (ordenação por número),
  // mostramos a data na própria linha.
  mostrarData?: boolean;
}

export default function VendaLinha({ venda, selecionada, onToggle, mostrarData }: VendaLinhaProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
      <Checkbox
        checked={selecionada}
        onChange={(checked) => onToggle(venda.id, checked)}
        ariaLabel={`Selecionar venda de ${venda.pagtNome}`}
      />

      {/* flex-wrap garante o fallback: se não couber na linha, quebra para a próxima */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 flex-1 min-w-0 text-sm">
        {venda.vendaConsig && (
          <span className="text-base font-bold font-mono  text-red-600 bg-gray-100 border px-2.5 py-1 uppercase whitespace-nowrap">
            Nº {venda.vendaConsig}
          </span>
        )}
        <span className="font-bold text-gray-950 whitespace-nowrap">
          {centavosToDisplay(venda.valorCentavos)}
        </span>
        <span className="font-semibold text-gray-700 truncate">{venda.pagtNome}</span>
        {venda.clienteNome && (
          <span className="font-semibold text-gray-700 truncate">{venda.clienteNome}</span>
        )}
        {mostrarData && (
          <span className="text-xs text-gray-400 whitespace-nowrap">{isoDateToBr(venda.data)}</span>
        )}
        <span className="text-xs text-gray-950 bg-purple-300 border border-purple-950 px-2.5 py-1 uppercase whitespace-nowrap ml-auto">
          {labelFormaPagamento(venda.tipoPagamento, venda.promissoria)}
        </span>
      </div>
    </div>
  );
}