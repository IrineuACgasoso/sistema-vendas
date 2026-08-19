"use client";

import { gridTemplateVendas } from "./VendaLinhaVenda";

interface VendaLinhaVendaHeaderProps {
  mostrarData?: boolean;
}

export default function VendaLinhaVendaHeader({ mostrarData }: VendaLinhaVendaHeaderProps) {
  return (
    <div
      className="grid items-center gap-x-3 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 border border-gray-200 bg-gray-50 rounded-lg shadow-sm"
      style={{ gridTemplateColumns: gridTemplateVendas(!!mostrarData) }}
    >
      <span />
      <span>Valor</span>
      <span>Pagante</span>
      <span>Cliente</span>
      <span className="text-center">Nº</span>
      {mostrarData && <span>Data</span>}
      <span className="text-center">Forma</span>
      <span className="text-center">Status</span>
    </div>
  );
}