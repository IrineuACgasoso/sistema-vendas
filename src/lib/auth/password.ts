import bcrypt from "bcryptjs";

/**
 * A senha do usuário único do sistema NUNCA é armazenada em texto puro,
 * nem mesmo no .env. Armazenamos o HASH (AUTH_PASSWORD_HASH) e comparamos aqui.
 *
 * Para gerar o hash, rode: npm run gerar-hash-senha -- "suaSenhaAqui"
 */

export async function verificarSenha(
  senhaDigitada: string,
  hashArmazenado: string
  
): Promise<boolean> {
  if (!senhaDigitada || !hashArmazenado) return false;
  try {
    return await bcrypt.compare(senhaDigitada, hashArmazenado);
  } catch {
    // Nunca deixar um erro de comparação virar "acesso liberado"
    return false;
  }
}

export async function gerarHashSenha(senhaPura: string): Promise<string> {
  const SALT_ROUNDS = 12;
  return bcrypt.hash(senhaPura, SALT_ROUNDS);
}
