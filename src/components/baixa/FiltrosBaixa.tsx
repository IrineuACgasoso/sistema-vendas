"use client";

import DateInput from "@/components/ui/DateInput";
import TextInput from "@/components/ui/TextInput";
import { useEnterFlow } from "@/hooks/useEnterFlow";
import type { TipoPagamento } from "@/types";

export interface FiltrosState {
  dataInicioBr: string;
  dataFimBr: string;
  nome: string;
  tipoPagamento: TipoPagamento | "";
}

interface FiltrosBaixaProps {
  filtros: FiltrosState;
  onChange: (filtros: FiltrosState) => void;
}

const CAMPOS_ORDEM = ["dataInicio", "dataFim", "nome", "tipo"];

export default function FiltrosBaixa({ filtros, onChange }: FiltrosBaixaProps) {
  // Mesma estratégia de avanço por Enter usada no Cadastro
  const flow = useEnterFlow(CAMPOS_ORDEM);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
      <DateInput
        ref={flow.registerRef("dataInicio") as React.Ref<HTMLInputElement>}
        label="Data início"
        value={filtros.dataInicioBr}
        onChange={(v) => onChange({ ...filtros, dataInicioBr: v })}
        onKeyDown={flow.handleKeyDown("dataInicio")}
      />
      <DateInput
        ref={flow.registerRef("dataFim") as React.Ref<HTMLInputElement>}
        label="Data fim"
        value={filtros.dataFimBr}
        onChange={(v) => onChange({ ...filtros, dataFimBr: v })}
        onKeyDown={flow.handleKeyDown("dataFim")}
      />
      <div className="flex-1 min-w-[180px]">
        <TextInput
          ref={flow.registerRef("nome") as React.Ref<HTMLInputElement>}
          label="Nome"
          value={filtros.nome}
          onChange={(e) => onChange({ ...filtros, nome: e.target.value })}
          onKeyDown={flow.handleKeyDown("nome")}
          placeholder="Pagante ou cliente"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Tipo
        </label>
        <select
          ref={flow.registerRef("tipo") as React.Ref<HTMLSelectElement>}
          value={filtros.tipoPagamento}
          onChange={(e) =>
            onChange({ ...filtros, tipoPagamento: e.target.value as TipoPagamento | "" })
          }
          onKeyDown={flow.handleKeyDown("tipo")}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos</option>
          <option value="pix">Pix</option>
          <option value="deposito">Depósito</option>
          <option value="transferencia">Transferência</option>
        </select>
      </div>
    </div>
  );
}
