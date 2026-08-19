"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { ActionResult } from "@/types";

/**
 * Toda tela que chama Server Actions autenticadas deve rodar o resultado por
 * `verificarSessao`. Se a sessão tiver expirado (usuário ficou com a página
 * aberta além das 8h de validade do cookie, por exemplo), a Server Action
 * devolve `code: "SESSAO_EXPIRADA"` em vez de um erro genérico — esse hook
 * intercepta esse caso e manda o usuário direto para /login, em vez de
 * deixá-lo preso numa tela travada com uma mensagem de erro.
 *
 * Retorna `true` se tratou o redirecionamento (o chamador não deve seguir
 * com seu próprio tratamento de erro nesse caso) e `false` caso contrário.
 */
export function useSessaoExpirada() {
  const router = useRouter();

  const verificarSessao = useCallback(
    (resultado: ActionResult<unknown>): boolean => {
      if (resultado.code === "SESSAO_EXPIRADA") {
        router.push("/login");
        return true;
      }
      return false;
    },
    [router]
  );

  return { verificarSessao };
}
