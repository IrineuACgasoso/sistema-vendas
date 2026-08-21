//src/components/cadastro/TipoPagamentoRadio.tsx
"use client";

import RadioOption from "@/components/ui/RadioOption";
import type { TipoPagamento } from "@/types";

interface TipoPagamentoRadioProps {
  value: TipoPagamento;
  onChange: (value: TipoPagamento) => void;
}

const OPCOES: { value: TipoPagamento; label: string }[] = [
  { value: "pix", label: "PIX" },
  { value: "deposito", label: "DEPÓSITO" },
  { value: "transferencia", label: "TRANSFERÊNCIA" },
];

const OPCOES_LINHA2: { value: TipoPagamento; label: string }[] = [
  { value: "dinheiro", label: "DINHEIRO" },
  { value: "cartao", label: "CARTÃO" },
];

export default function TipoPagamentoRadio({ value, onChange }: TipoPagamentoRadioProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-6 justify-center">
        {OPCOES.map((opcao) => (
          <RadioOption
            key={opcao.value}
            label={opcao.label}
            name="tipoPagamento"
            value={opcao.value}
            checked={value === opcao.value}
            onChange={(v) => onChange(v as TipoPagamento)}
          />
        ))}
      </div>
      <div className="flex gap-6 justify-center">
        {OPCOES_LINHA2.map((opcao) => (
          <RadioOption
            key={opcao.value}
            label={opcao.label}
            name="tipoPagamento"
            value={opcao.value}
            checked={value === opcao.value}
            onChange={(v) => onChange(v as TipoPagamento)}
          />
        ))}
      </div>
    </div>
  );
}