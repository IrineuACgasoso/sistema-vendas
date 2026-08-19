import { obterSessaoAtual } from "@/lib/auth/session";

export class SessaoExpiradaError extends Error {
  constructor() {
    super("Sua sessão expirou. Faça login novamente.");
    this.name = "SessaoExpiradaError";
  }
}

/**
 * Usado no início de toda Server Action que exige usuário logado.
 * Lança SessaoExpiradaError (em vez de Error genérico) para que o catch de
 * cada action consiga diferenciar "sessão expirou" de qualquer outra falha
 * e devolver um ActionResult com code: "SESSAO_EXPIRADA" — é esse code que
 * o cliente usa para redirecionar automaticamente para /login.
 */
export async function exigirSessao(): Promise<void> {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    throw new SessaoExpiradaError();
  }
}
