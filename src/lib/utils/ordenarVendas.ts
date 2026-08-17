import type { OrdenarDirecao, OrdenarPor } from "@/components/baixa/FiltrosBaixa";
import type { Venda } from "@/types";

/**
 * Compara números de venda (vendaConsig) de forma "natural": trata o texto
 * como número quando possível (ex: "9" < "10"), e joga vendas sem número
 * sempre para o final, independente da direção escolhida.
 */
function compararPorNumero(a: Venda, b: Venda): number {
  const numA = a.vendaConsig?.trim() || null;
  const numB = b.vendaConsig?.trim() || null;

  if (numA === null && numB === null) return 0;
  if (numA === null) return 1;
  if (numB === null) return -1;

  return numA.localeCompare(numB, "pt-BR", { numeric: true, sensitivity: "base" });
}

function compararPorData(a: Venda, b: Venda): number {
  if (a.data !== b.data) return a.data < b.data ? -1 : 1;
  // Critério de desempate estável, igual ao usado no servidor
  return a.criadoEm < b.criadoEm ? -1 : a.criadoEm > b.criadoEm ? 1 : 0;
}

export function ordenarVendas(
  vendas: Venda[],
  ordenarPor: OrdenarPor,
  direcao: OrdenarDirecao
): Venda[] {
  const comparador = ordenarPor === "numero" ? compararPorNumero : compararPorData;
  const ordenado = [...vendas].sort(comparador);
  return direcao === "desc" ? ordenado.reverse() : ordenado;
}
