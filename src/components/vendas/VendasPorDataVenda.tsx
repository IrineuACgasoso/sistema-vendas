"use client";

import VendaLinhaVenda from "./VendaLinhaVenda";
import VendaLinhaVendaHeader from "./VendaLinhaVendaHeader";
import { isoDateToBr } from "@/lib/utils/date";
import type { OrdenarPor } from "@/components/baixa/FiltrosBaixa";
import type { Venda } from "@/types";

interface VendasPorDataVendaProps {
  vendas: Venda[];
  selecionadas: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  onAdicionarNumero: (venda: Venda) => void;
  ordenarPor: OrdenarPor;
  modoEdicao?: boolean;
  idEmEdicao?: string | null;
  onIniciarEdicao?: (id: string) => void;
  onSalvarEdicao?: (
    id: string,
    dados: { pagtNome: string; vendaConsig: string; valorCentavos: number }
  ) => Promise<{ ok: boolean; message?: string }>;
  onCancelarEdicao?: () => void;
  modoExclusao?: boolean;
  selecionadasExclusao?: Set<string>;
  onToggleExclusao?: (id: string, checked: boolean) => void;
}

export default function VendasPorDataVenda({
  vendas,
  selecionadas,
  onToggle,
  onAdicionarNumero,
  ordenarPor,
  modoEdicao,
  idEmEdicao,
  onIniciarEdicao,
  onSalvarEdicao,
  onCancelarEdicao,
  modoExclusao,
  selecionadasExclusao,
  onToggleExclusao,
}: VendasPorDataVendaProps) {
  if (vendas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <VendaLinhaVendaHeader mostrarData={ordenarPor === "numero"} />
        <p className="text-center text-sm text-gray-500 py-8">
          Nenhuma venda encontrada com os filtros atuais.
        </p>
      </div>
    );
  }

  if (ordenarPor === "numero") {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <VendaLinhaVendaHeader mostrarData />
        {vendas.map((venda) => (
          <VendaLinhaVenda
            key={venda.id}
            venda={venda}
            selecionada={selecionadas.has(venda.id)}
            onToggle={onToggle}
            onAdicionarNumero={onAdicionarNumero}
            mostrarData
            modoEdicao={modoEdicao}
            emEdicao={idEmEdicao === venda.id}
            onIniciarEdicao={onIniciarEdicao}
            onSalvarEdicao={onSalvarEdicao}
            onCancelarEdicao={onCancelarEdicao}
            modoExclusao={modoExclusao}
            selecionadaExclusao={selecionadasExclusao?.has(venda.id)}
            onToggleExclusao={onToggleExclusao}
          />
        ))}
      </section>
    );
  }

  const grupos = new Map<string, Venda[]>();
  for (const venda of vendas) {
    const lista = grupos.get(venda.data) ?? [];
    lista.push(venda);
    grupos.set(venda.data, lista);
  }

  return (
    <div className="flex flex-col gap-3">
      <VendaLinhaVendaHeader />
      {Array.from(grupos.entries()).map(([dataIso, vendasDoDia]) => (
        <section
          key={dataIso}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto"
        >
          <header className="px-4 py-1.5 bg-gray-100 border-b border-gray-200 rounded-t-lg">
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
                modoEdicao={modoEdicao}
                emEdicao={idEmEdicao === venda.id}
                onIniciarEdicao={onIniciarEdicao}
                onSalvarEdicao={onSalvarEdicao}
                onCancelarEdicao={onCancelarEdicao}
                modoExclusao={modoExclusao}
                selecionadaExclusao={selecionadasExclusao?.has(venda.id)}
                onToggleExclusao={onToggleExclusao}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}