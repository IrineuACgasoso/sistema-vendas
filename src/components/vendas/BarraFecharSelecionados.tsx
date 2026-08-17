"use client";

import { centavosToDisplay } from "@/lib/utils/currency";
import Button from "@/components/ui/Button";

interface BarraFecharSelecionadosProps {
  quantidade: number;
  totalCentavos: number;
  onFechar: () => void;
}

export default function BarraFecharSelecionados({
  quantidade,
  totalCentavos,
  onFechar,
}: BarraFecharSelecionadosProps) {
  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
      <div className="text-sm text-gray-700">
        <span className="font-semibold uppercase tracking-wide">Total selecionados: </span>
        <span className="font-bold text-gray-900">{centavosToDisplay(totalCentavos)}</span>
      </div>

      {quantidade > 0 && (
        <Button onClick={onFechar} variant="primary">
          Fechar {quantidade} {quantidade === 1 ? "Venda" : "Vendas"}
        </Button>
      )}
    </div>
  );
}
