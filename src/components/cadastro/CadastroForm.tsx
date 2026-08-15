"use client";

import { useState, useTransition } from "react";
import TipoPagamentoRadio from "./TipoPagamentoRadio";
import NomeAutocomplete from "./NomeAutocomplete";
import DateInput from "@/components/ui/DateInput";
import TextInput from "@/components/ui/TextInput";
import CurrencyInput from "@/components/ui/CurrencyInput";
import Button from "@/components/ui/Button";
import BackToMenuButton from "@/components/ui/BackToMenuButton";
import { useEnterFlow } from "@/hooks/useEnterFlow";
import { criarVenda } from "@/app/actions/vendas.actions";
import { isValidBrDate, todayBr } from "@/lib/utils/date";
import type { TipoPagamento } from "@/types";

const CAMPOS_ORDEM = ["pagtNome", "cliente", "data", "vendaConsig", "valor"];

const ESTADO_INICIAL = {
  tipoPagamento: "pix" as TipoPagamento,
  pagtNome: "",
  clienteNome: "",
  data: todayBr(),
  vendaConsig: "",
  valorCentavos: 0,
};

export default function CadastroForm() {
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const flow = useEnterFlow(CAMPOS_ORDEM);

  function resetarParaNovaVenda() {
    // Mantém tipoPagamento e data (comportamento comum: continuar registrando no mesmo dia)
    setForm((prev) => ({
      ...ESTADO_INICIAL,
      tipoPagamento: prev.tipoPagamento,
      data: prev.data,
    }));
    setTimeout(() => flow.focarCampo("pagtNome"), 0);
  }

  function handleSalvar() {
    setErro(null);
    setSucesso(null);

    if (!form.pagtNome.trim()) {
      setErro("Informe o pagante.");
      flow.focarCampo("pagtNome");
      return;
    }
    if (!isValidBrDate(form.data)) {
      setErro("Data inválida. Use dd/mm/aaaa.");
      flow.focarCampo("data");
      return;
    }
    if (form.valorCentavos <= 0) {
      setErro("Informe um valor maior que zero.");
      flow.focarCampo("valor");
      return;
    }

    startTransition(async () => {
      const resultado = await criarVenda({
        tipoPagamento: form.tipoPagamento,
        pagtNome: form.pagtNome,
        clienteNome: form.clienteNome || undefined,
        data: form.data,
        vendaConsig: form.vendaConsig || undefined,
        valorCentavos: form.valorCentavos,
      });

      if (!resultado.ok) {
        setErro(resultado.message ?? "Erro ao salvar a venda.");
        return;
      }

      setSucesso("Venda registrada com sucesso!");
      resetarParaNovaVenda();
    });
  }

  flow.onComplete(handleSalvar);

  return (
    <div className="relative bg-white rounded-lg shadow-md p-8 w-full max-w-md">
      <BackToMenuButton />

      <h2 className="text-lg font-semibold mb-6 text-center">Cadastro de Venda</h2>

      <div className="flex flex-col gap-4">
        <TipoPagamentoRadio
          value={form.tipoPagamento}
          onChange={(v) => setForm((prev) => ({ ...prev, tipoPagamento: v }))}
        />

        <NomeAutocomplete
          ref={flow.registerRef("pagtNome") as React.Ref<HTMLInputElement>}
          label="Pagt. Nome"
          value={form.pagtNome}
          onChange={(v) => setForm((prev) => ({ ...prev, pagtNome: v }))}
          onKeyDown={flow.handleKeyDown("pagtNome")}
          required
          placeholder="Nome de quem pagou"
        />

        <NomeAutocomplete
          ref={flow.registerRef("cliente") as React.Ref<HTMLInputElement>}
          label="Nome do Cliente (opcional)"
          value={form.clienteNome}
          onChange={(v) => setForm((prev) => ({ ...prev, clienteNome: v }))}
          onKeyDown={flow.handleKeyDown("cliente")}
          placeholder="Opcional"
        />

        <div className="grid grid-cols-2 gap-3">
          <DateInput
            ref={flow.registerRef("data") as React.Ref<HTMLInputElement>}
            label="Data"
            value={form.data}
            onChange={(v) => setForm((prev) => ({ ...prev, data: v }))}
            onKeyDown={flow.handleKeyDown("data")}
          />
          <TextInput
            ref={flow.registerRef("vendaConsig") as React.Ref<HTMLInputElement>}
            label="Venda/Consig (opcional)"
            value={form.vendaConsig}
            onChange={(e) => setForm((prev) => ({ ...prev, vendaConsig: e.target.value }))}
            onKeyDown={flow.handleKeyDown("vendaConsig")}
          />
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <CurrencyInput
              ref={flow.registerRef("valor") as React.Ref<HTMLInputElement>}
              label="Valor"
              valueCentavos={form.valorCentavos}
              onChangeCentavos={(c) => setForm((prev) => ({ ...prev, valorCentavos: c }))}
              onKeyDown={flow.handleKeyDown("valor")}
            />
          </div>
          <Button onClick={handleSalvar} loading={isPending}>
            Salvar
          </Button>
        </div>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {erro}
          </p>
        )}
        {sucesso && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
            {sucesso}
          </p>
        )}
      </div>
    </div>
  );
}
