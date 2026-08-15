"use client";

import Checkbox from "@/components/ui/Checkbox";
import { centavosToDisplay } from "@/lib/utils/currency";
import type { Venda } from "@/types";

interface VendaLinhaProps {
  venda: Venda;
  selecionada: boolean;
  onToggle: (id: string, checked: boolean) => void;
}

const LABEL_TIPO: Record<Venda["tipoPagamento"], string> = {
  pix: "Pix",
  deposito: "Depósito",
  transferencia: "Transferência",
};

export default function VendaLinha({ venda, selecionada, onToggle }: VendaLinhaProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
      <Checkbox
        checked={selecionada}
        onChange={(checked) => onToggle(venda.id, checked)}
        ariaLabel={`Selecionar venda de ${venda.pagtNome}`}
      />

      {/* flex-wrap garante o fallback: se não couber na linha, quebra para a próxima */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 flex-1 min-w-0 text-sm">
        <span className="font-semibold text-gray-900 whitespace-nowrap">
          {centavosToDisplay(venda.valorCentavos)}
        </span>
        <span className="text-gray-700 truncate">{venda.pagtNome}</span>
        {venda.clienteNome && (
          <span className="text-gray-500 truncate">{venda.clienteNome}</span>
        )}
        <span className="text-xs text-gray-400 uppercase whitespace-nowrap ml-auto">
          {LABEL_TIPO[venda.tipoPagamento]}
        </span>
      </div>
    </div>
  );
}
