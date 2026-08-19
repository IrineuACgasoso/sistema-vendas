"use client";

import { gridTemplateBaixa } from "./VendaLinha";

interface VendaLinhaHeaderProps {
  mostrarData?: boolean;
}

export default function VendaLinhaHeader({ mostrarData }: VendaLinhaHeaderProps) {
  return (
    <div
      className="grid items-center gap-x-3 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 border border-gray-200 bg-gray-50 rounded-lg shadow-sm"
      style={{ gridTemplateColumns: gridTemplateBaixa(!!mostrarData) }}
    >
      <span />
      <span className="text-center">Nº</span>
      <span>Valor</span>
      <span>Pagante</span>
      <span>Cliente</span>
      {mostrarData && <span>Data</span>}
      <span className="text-center">Forma</span>
    </div>
  );
}