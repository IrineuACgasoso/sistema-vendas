/**
 * Uso: npx tsx scripts/limpar-dados-teste.ts
 *
 * Apaga TODOS os documentos das coleções "pessoas" e "vendas" no Firestore.
 * Destinado a limpar dados de teste antes de colocar o sistema em uso real.
 *
 * ⚠️ IRREVERSÍVEL. Não existe confirmação além da que este script já pede
 * no terminal. Rode local (nunca em produção/CI automatizado) e revise
 * o projectId impresso antes de confirmar.
 *
 * Requer as mesmas variáveis de ambiente usadas por src/lib/firebase/admin.ts
 * (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY),
 * disponíveis no seu .env.local.
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createInterface } from "node:readline/promises";
import { config } from "dotenv";

config({ path: ".env.local" });

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Variável de ambiente obrigatória ausente: ${name}`);
    process.exit(1);
  }
  return value;
}

const projectId = getRequiredEnv("FIREBASE_PROJECT_ID");
const clientEmail = getRequiredEnv("FIREBASE_CLIENT_EMAIL");
const privateKey = getRequiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

const app =
  getApps().length > 0 ? getApps()[0] : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);

const COLECOES = ["pessoas", "vendas"] as const;

async function apagarColecao(nome: string): Promise<number> {
  let apagados = 0;
  // Apaga em lotes de 400 (abaixo do limite de 500 do Firestore por batch)
  // até a coleção esvaziar.
  for (;;) {
    const snapshot = await db.collection(nome).limit(400).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    apagados += snapshot.size;
    process.stdout.write(`  ${nome}: ${apagados} apagado(s)...\r`);
  }
  return apagados;
}

async function main() {
  console.log(`Projeto Firebase: ${projectId}`);
  console.log(`Coleções que serão TOTALMENTE apagadas: ${COLECOES.join(", ")}\n`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const resposta = await rl.question(
    'Digite "apagar tudo" para confirmar (qualquer outra coisa cancela): '
  );
  rl.close();

  if (resposta.trim().toLowerCase() !== "apagar tudo") {
    console.log("Cancelado. Nenhum dado foi apagado.");
    process.exit(0);
  }

  for (const nome of COLECOES) {
    const total = await apagarColecao(nome);
    console.log(`\n✔ ${nome}: ${total} documento(s) apagado(s).`);
  }

  console.log("\nConcluído.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Erro ao limpar dados:", error);
  process.exit(1);
});
