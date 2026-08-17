"use client";

import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import { centavosToDisplay } from "@/lib/utils/currency";
import type { Venda } from "@/types";

interface VendaLinhaVendaProps {
  venda: Venda;
  selecionada: boolean;
  onToggle: (id: string, checked: boolean) => void;
  onAdicionarNumero: (venda: Venda) => void;
}

const LABEL_TIPO: Record<Venda["tipoPagamento"], string> = {
  pix: "Pix",
  deposito: "Depósito",
  transferencia: "Transferência",
};

export default function VendaLinhaVenda({
  venda,
  selecionada,
  onToggle,
  onAdicionarNumero,
}: VendaLinhaVendaProps) {
  const temNumero = !!venda.vendaConsig;

  return (
    <div className="flex items-center gap-3 py-2 px-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
      {temNumero && !venda.fechada ? (
        <Checkbox
          checked={selecionada}
          onChange={(checked) => onToggle(venda.id, checked)}
          ariaLabel={`Selecionar venda de ${venda.pagtNome}`}
        />
      ) : (
        // Vendas sem número, ou já fechadas, não podem ser selecionadas pra fechar caixa
        <div className="w-5 h-5 flex-shrink-0" />
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 flex-1 min-w-0 text-sm">
        <span className="font-semibold text-gray-900 whitespace-nowrap">
          {centavosToDisplay(venda.valorCentavos)}
        </span>
        <span className="text-gray-700 truncate">{venda.pagtNome}</span>
        {venda.clienteNome && (
          <span className="text-gray-500 truncate">{venda.clienteNome}</span>
        )}
        <span className="text-xs text-gray-400 uppercase whitespace-nowrap">
          {LABEL_TIPO[venda.tipoPagamento]}
        </span>

        {temNumero ? (
          <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded whitespace-nowrap">
            Nº {venda.vendaConsig}
          </span>
        ) : (
          <Button
            variant="secondary"
            className="text-xs px-2 py-1"
            onClick={() => onAdicionarNumero(venda)}
          >
            Adicionar número de venda
          </Button>
        )}

        {venda.baixada ? (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded whitespace-nowrap">
            Baixada
          </span>
        ) : venda.fechada ? (
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded whitespace-nowrap">
            Fechada
          </span>
        ) : (
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded whitespace-nowrap ml-auto">
            Aberta
          </span>
        )}
      </div>
    </div>
  );
}
