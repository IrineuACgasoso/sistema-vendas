"use client";

import { useState, useTransition } from "react";
import { login } from "@/app/actions/auth.actions";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";

export default function LoginForm() {
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const resultado = await login(formData);
      // Se login() teve sucesso ele redireciona internamente (redirect() lança).
      // Se chegou aqui é porque falhou.
      if (resultado && !resultado.ok) {
        setErro(resultado.message ?? "Falha ao entrar.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
      <TextInput label="Usuário" name="usuario" type="text" autoComplete="username" required />
      <TextInput
        label="Senha"
        name="senha"
        type="password"
        autoComplete="current-password"
        required
      />
      {erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {erro}
        </p>
      )}
      <Button type="submit" loading={isPending} className="w-full">
        Entrar
      </Button>
    </form>
  );
}