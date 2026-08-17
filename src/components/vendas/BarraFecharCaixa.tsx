"use client";

import { centavosToDisplay } from "@/lib/utils/currency";
import Button from "@/components/ui/Button";

interface BarraFecharCaixaProps {
  quantidade: number;
  totalCentavos: number;
  onFecharCaixa: () => void;
}

export default function BarraFecharCaixa({
  quantidade,
  totalCentavos,
  onFecharCaixa,
}: BarraFecharCaixaProps) {
  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
      <div className="text-sm text-gray-700">
        <span className="font-semibold uppercase tracking-wide">Total selecionados: </span>
        <span className="font-bold text-gray-900">{centavosToDisplay(totalCentavos)}</span>
      </div>

      {quantidade > 0 && (
        <Button onClick={onFecharCaixa} variant="primary">
          Fechar {quantidade} {quantidade === 1 ? "Venda" : "Vendas"}
        </Button>
      )}
    </div>
  );
}
