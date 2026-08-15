"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTransition } from "react";
import Button from "@/components/ui/Button";
import RadioOption from "@/components/ui/RadioOption";
import { logout } from "@/app/actions/auth.actions";

type Opcao = "cadastro" | "baixa";

export default function MenuSelector() {
  const router = useRouter();
  const [opcao, setOpcao] = useState<Opcao>("cadastro");
  const [isPending, startTransition] = useTransition();

  function handleOk() {
    router.push(`/${opcao}`);
  }

  function handleLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-center">O que deseja fazer?</h2>

      <div className="flex flex-col gap-3">
        <RadioOption
          label="Cadastrar"
          name="opcao-menu"
          value="cadastro"
          checked={opcao === "cadastro"}
          onChange={(v) => setOpcao(v as Opcao)}
        />
        <RadioOption
          label="Baixa"
          name="opcao-menu"
          value="baixa"
          checked={opcao === "baixa"}
          onChange={(v) => setOpcao(v as Opcao)}
        />
      </div>

      <Button onClick={handleOk} className="w-full">
        OK
      </Button>

      <button
        onClick={handleLogout}
        disabled={isPending}
        className="text-xs text-gray-500 hover:text-gray-700 underline text-center disabled:opacity-50"
      >
        Sair
      </button>
    </div>
  );
}
