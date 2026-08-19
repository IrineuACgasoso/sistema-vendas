"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";

interface ConfirmarSenhaModalProps {
  open: boolean;
  quantidadeSelecionados: number;
  totalFormatado: string;
  onCancelar: () => void;
  onConfirmar: (senha: string) => Promise<{ ok: boolean; message?: string }>;
  titulo?: string;
  mensagem?: React.ReactNode;
  confirmarLabel?: string;
}

export default function ConfirmarSenhaModal({
  open,
  quantidadeSelecionados,
  totalFormatado,
  onCancelar,
  onConfirmar,
  titulo = "Confirmar baixa",
  mensagem,
  confirmarLabel = "Confirmar baixa",
}: ConfirmarSenhaModalProps) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFechar() {
    setSenha("");
    setErro(null);
    onCancelar();
  }

  function handleConfirmar() {
    if (!senha) {
      setErro("Informe a senha para confirmar.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      const resultado = await onConfirmar(senha);
      if (!resultado.ok) {
        setErro(resultado.message ?? "Falha ao confirmar.");
        return;
      }
      setSenha("");
    });
  }

  return (
    <Modal open={open} onClose={handleFechar} title={titulo}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-700">
          {mensagem ?? (
            <>
              Você está prestes a dar baixa em{" "}
              <strong>{quantidadeSelecionados} venda(s)</strong>, totalizando{" "}
              <strong>{totalFormatado}</strong>. Esta ação não pode ser desfeita.
            </>
          )}
        </p>

        <TextInput
          label="Confirme sua senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
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
          <Button variant="danger" onClick={handleConfirmar} loading={isPending}>
            {confirmarLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}