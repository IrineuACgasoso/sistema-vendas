"use client";

import { useState } from "react";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { centavosToDisplay } from "@/lib/utils/currency";
import type { Venda } from "@/types";

interface VendaLinhaVendasProps {
  venda: Venda;
  selecionada: boolean;
  onToggle: (id: string, checked: boolean) => void;
  onAdicionarNumero: (vendaId: string, numero: string) => Promise<{ ok: boolean; message?: string }>;
}

const LABEL_TIPO: Record<Venda["tipoPagamento"], string> = {
  pix: "Pix",
  deposito: "Depósito",
  transferencia: "Transferência",
};

export default function VendaLinhaVendas({
  venda,
  selecionada,
  onToggle,
  onAdicionarNumero,
}: VendaLinhaVendasProps) {
  const [editando, setEditando] = useState(false);
  const [numero, setNumero] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const temNumero = Boolean(venda.vendaConsig && venda.vendaConsig.trim());

  async function handleSalvarNumero() {
    if (!numero.trim()) {
      setErro("Informe o número da venda.");
      return;
    }
    setSalvando(true);
    setErro(null);
    const resultado = await onAdicionarNumero(venda.id, numero.trim());
    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.message ?? "Erro ao salvar.");
      return;
    }
    setEditando(false);
    setNumero("");
  }

  return (
    <div className="flex flex-col gap-2 py-2 px-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
      <div className="flex items-center gap-3">
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
          {temNumero ? (
            <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 whitespace-nowrap">
              Nº {venda.vendaConsig}
            </span>
          ) : (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 whitespace-nowrap">
              Sem número
            </span>
          )}
          <span className="text-xs text-gray-400 uppercase whitespace-nowrap ml-auto">
            {LABEL_TIPO[venda.tipoPagamento]}
          </span>
        </div>

        {!temNumero && !editando && (
          <Button variant="secondary" onClick={() => setEditando(true)} className="whitespace-nowrap">
            Adicionar número de venda
          </Button>
        )}
      </div>

      {editando && (
        <div className="flex items-end gap-2 pl-8">
          <div className="w-40">
            <TextInput
              label="Número da venda"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSalvarNumero();
                }
              }}
              autoFocus
            />
          </div>
          <Button onClick={handleSalvarNumero} loading={salvando}>
            Salvar
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setEditando(false);
              setNumero("");
              setErro(null);
            }}
          >
            Cancelar
          </Button>
        </div>
      )}

      {erro && <p className="text-xs text-red-600 pl-8">{erro}</p>}
    </div>
  );
}
