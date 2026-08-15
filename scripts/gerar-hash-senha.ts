/**
 * Uso: npx tsx scripts/gerar-hash-senha.ts "minhaSenhaForte123"
 * Copie o resultado para AUTH_PASSWORD_HASH no .env.local / Vercel.
 */
import bcrypt from "bcryptjs";

const senha = process.argv[2];

if (!senha) {
  console.error("Uso: npx tsx scripts/gerar-hash-senha.ts \"suaSenha\"");
  process.exit(1);
}

if (senha.length < 8) {
  console.error("A senha deve ter pelo menos 8 caracteres.");
  process.exit(1);
}

bcrypt.hash(senha, 12).then((hash) => {
  console.log("\nAdicione esta linha ao seu .env.local e às env vars da Vercel:\n");
  console.log(`AUTH_PASSWORD_HASH=${hash}\n`);
});
