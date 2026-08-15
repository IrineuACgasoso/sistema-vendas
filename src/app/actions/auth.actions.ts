"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/validation/schemas";
import { verificarSenha } from "@/lib/auth/password";
import {
  criarSessionToken,
  definirCookieSessao,
  removerCookieSessao,
} from "@/lib/auth/session";
import {
  verificarRateLimit,
  registrarTentativaFalha,
  limparTentativas,
} from "@/lib/auth/rateLimit";
import type { ActionResult } from "@/types";

export async function login(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    usuario: formData.get("usuario"),
    senha: formData.get("senha"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Preencha usuário e senha corretamente." };
  }

  const { usuario, senha } = parsed.data;

  // Chave de rate limit combina usuário para não travar globalmente por 1 IP
  const chaveRateLimit = `login:${usuario.toLowerCase()}`;
  const rateLimit = verificarRateLimit(chaveRateLimit);
  if (!rateLimit.permitido) {
    return { ok: false, message: rateLimit.motivoBloqueio };
  }

  const usuarioEsperado = process.env.AUTH_USER;
  const hashEsperado = process.env.AUTH_PASSWORD_HASH;

  if (!usuarioEsperado || !hashEsperado) {
    // Erro de configuração do servidor, não vaza detalhe pro cliente
    console.error("AUTH_USER ou AUTH_PASSWORD_HASH não configurados no ambiente.");
    return { ok: false, message: "Erro interno de configuração. Contate o administrador." };
  }

  // Comparação do usuário não precisa ser timing-safe (não é segredo),
  // mas a senha sim -> feita via bcrypt.compare em verificarSenha()
  const usuarioCorreto = usuario === usuarioEsperado;
  const senhaCorreta = await verificarSenha(senha, hashEsperado);

  if (!usuarioCorreto || !senhaCorreta) {
    registrarTentativaFalha(chaveRateLimit);
    return { ok: false, message: "Usuário ou senha incorretos." };
  }

  limparTentativas(chaveRateLimit);

  const token = await criarSessionToken(usuario);
  await definirCookieSessao(token);

  redirect("/menu");
}

export async function logout(): Promise<void> {
  await removerCookieSessao();
  redirect("/login");
}

/**
 * Usado no fluxo de "Dar Baixa" para reautenticar sem derrubar a sessão.
 * Não cria novo cookie, só confirma que a senha digitada é a correta.
 */
export async function confirmarSenhaAtual(senha: string): Promise<ActionResult> {
  if (!senha) {
    return { ok: false, message: "Informe a senha." };
  }

  const hashEsperado = process.env.AUTH_PASSWORD_HASH;
  if (!hashEsperado) {
    console.error("AUTH_PASSWORD_HASH não configurado.");
    return { ok: false, message: "Erro interno de configuração." };
  }

  const correta = await verificarSenha(senha, hashEsperado);
  if (!correta) {
    return { ok: false, message: "Senha incorreta." };
  }

  return { ok: true };
}
