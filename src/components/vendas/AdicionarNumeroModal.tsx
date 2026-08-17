"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";

interface AdicionarNumeroModalProps {
  open: boolean;
  nomePagante: string;
  onCancelar: () => void;
  onConfirmar: (numero: string) => Promise<{ ok: boolean; message?: string }>;
}

export default function AdicionarNumeroModal({
  open,
  nomePagante,
  onCancelar,
  onConfirmar,
}: AdicionarNumeroModalProps) {
  const [numero, setNumero] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFechar() {
    setNumero("");
    setErro(null);
    onCancelar();
  }

  function handleConfirmar() {
    if (!numero.trim()) {
      setErro("Informe o número da venda.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      const resultado = await onConfirmar(numero.trim());
      if (!resultado.ok) {
        setErro(resultado.message ?? "Falha ao salvar.");
        return;
      }
      setNumero("");
    });
  }

  return (
    <Modal open={open} onClose={handleFechar} title="Adicionar número da venda">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-700">
          Venda de <strong>{nomePagante}</strong>. Informe o número da venda para poder
          fechá-la.
        </p>

        <TextInput
          label="Número da venda"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirmar();
          }}
          autoFocus
        />

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleFechar} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirmar} loading={isPending}>
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
