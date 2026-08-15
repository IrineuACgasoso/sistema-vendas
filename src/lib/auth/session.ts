import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionPayload } from "@/types";

export const SESSION_COOKIE_NAME = "sv_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 horas

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET ausente ou fraco (mínimo 32 caracteres). Gere um valor aleatório forte."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function criarSessionToken(usuario: string): Promise<string> {
  const payload: SessionPayload = {
    usuario,
    loginEm: Date.now(),
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verificarSessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.usuario !== "string") return null;
    return payload as unknown as SessionPayload;
  } catch {
    // Token expirado, adulterado ou inválido: nunca lançar, sempre negar acesso
    return null;
  }
}

/**
 * Deve ser chamado dentro de uma Server Action ou Route Handler.
 */
export async function definirCookieSessao(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function removerCookieSessao(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function obterSessaoAtual(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verificarSessionToken(token);
}
