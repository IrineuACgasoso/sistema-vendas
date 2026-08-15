import { redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth/session";

export default async function HomePage() {
  const sessao = await obterSessaoAtual();
  redirect(sessao ? "/menu" : "/login");
}
