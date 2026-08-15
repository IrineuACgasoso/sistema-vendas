import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Inicialização singleton do Firebase Admin.
 * Este arquivo NUNCA deve ser importado em código client-side.
 * Só deve ser usado dentro de Server Actions ou Route Handlers.
 */

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${name}. Verifique seu .env.local / configuração da Vercel.`
    );
  }
  return value;
}

function buildApp(): App {
  const projectId = getRequiredEnv("FIREBASE_PROJECT_ID");
  const clientEmail = getRequiredEnv("FIREBASE_CLIENT_EMAIL");
  // A chave privada vem com \n escapado no .env, precisa ser revertido
  const privateKey = getRequiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const app: App = getApps().length > 0 ? getApps()[0] : buildApp();

export const db: Firestore = getFirestore(app);

export const COLLECTIONS = {
  PESSOAS: "pessoas",
  VENDAS: "vendas",
} as const;
