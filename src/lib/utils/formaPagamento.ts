import type { TipoPagamento } from "@/types";

const LABEL_TIPO: Record<TipoPagamento, string> = {
  pix: "Pix",
  deposito: "Depósito",
  transferencia: "Transferência",
};

/**
 * Rotula a forma de pagamento de uma venda. Quando é promissória, o rótulo
 * vira "Promissória (Pix)", "Promissória (Depósito)" etc. — "Promissória" é
 * uma condição independente do tipo de pagamento, então precisa aparecer
 * combinada, nunca no lugar dele.
 */
export function labelFormaPagamento(tipoPagamento: TipoPagamento, promissoria: boolean): string {
  const base = LABEL_TIPO[tipoPagamento];
  return promissoria ? `Promissória (${base})` : base;
}