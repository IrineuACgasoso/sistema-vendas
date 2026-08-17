"use client";

import VendaLinhaVenda from "./VendaLinhaVenda";
import { isoDateToBr } from "@/lib/utils/date";
import type { Venda } from "@/types";

interface VendasPorDataVendaProps {
  vendas: Venda[];
  selecionadas: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  onAdicionarNumero: (venda: Venda) => void;
}

export default function VendasPorDataVenda({
  vendas,
  selecionadas,
  onToggle,
  onAdicionarNumero,
}: VendasPorDataVendaProps) {
  if (vendas.length === 0) {
    return (
      <p className="text-center text-sm text-gray-500 py-8">
        Nenhuma venda encontrada com os filtros atuais.
      </p>
    );
  }

  const grupos = new Map<string, Venda[]>();
  for (const venda of vendas) {
    const lista = grupos.get(venda.data) ?? [];
    lista.push(venda);
    grupos.set(venda.data, lista);
  }

  return (
    <div className="flex flex-col gap-4">
      {Array.from(grupos.entries()).map(([dataIso, vendasDoDia]) => (
        <section key={dataIso} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <header className="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <h3 className="text-sm font-semibold text-gray-700">{isoDateToBr(dataIso)}</h3>
          </header>
          <div>
            {vendasDoDia.map((venda) => (
              <VendaLinhaVenda
                key={venda.id}
                venda={venda}
                selecionada={selecionadas.has(venda.id)}
                onToggle={onToggle}
                onAdicionarNumero={onAdicionarNumero}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
