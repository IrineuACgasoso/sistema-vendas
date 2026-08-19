"use client";

import VendaLinha from "./VendaLinha";
import VendaLinhaHeader from "./VendaLinhaHeader";
import { isoDateToBr } from "@/lib/utils/date";
import type { OrdenarPor } from "./FiltrosBaixa";
import type { Venda } from "@/types";

interface VendasPorDataProps {
  vendas: Venda[];
  selecionadas: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  // Vendas já chegam ordenadas conforme escolhido nos filtros. Quando a
  // ordenação é por número, exibimos uma lista única (a data deixa de ser
  // o agrupador natural); quando é por data, mantemos o agrupamento visual.
  ordenarPor: OrdenarPor;
}

export default function VendasPorData({ vendas, selecionadas, onToggle, ordenarPor }: VendasPorDataProps) {
  if (vendas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <VendaLinhaHeader mostrarData={ordenarPor === "numero"} />
        <p className="text-center text-sm text-gray-500 py-8">
          Nenhuma venda encontrada com os filtros atuais.
        </p>
      </div>
    );
  }

  if (ordenarPor === "numero") {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <VendaLinhaHeader mostrarData />
        {vendas.map((venda) => (
          <VendaLinha
            key={venda.id}
            venda={venda}
            selecionada={selecionadas.has(venda.id)}
            onToggle={onToggle}
            mostrarData
          />
        ))}
      </section>
    );
  }

  // Agrupa mantendo a ordem já vinda (respeita a direção escolhida)
  const grupos = new Map<string, Venda[]>();
  for (const venda of vendas) {
    const lista = grupos.get(venda.data) ?? [];
    lista.push(venda);
    grupos.set(venda.data, lista);
  }

  return (
    <div className="flex flex-col gap-4">
      <VendaLinhaHeader />
      {Array.from(grupos.entries()).map(([dataIso, vendasDoDia]) => (
        <section
          key={dataIso}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto"
        >
          <header className="px-3 py-2 bg-gray-100 border-b border-gray-200 rounded-t-lg">
            <h3 className="text-sm font-semibold text-gray-700">{isoDateToBr(dataIso)}</h3>
          </header>
          <div>
            {vendasDoDia.map((venda) => (
              <VendaLinha
                key={venda.id}
                venda={venda}
                selecionada={selecionadas.has(venda.id)}
                onToggle={onToggle}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
