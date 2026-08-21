//src/lib/utils/formaPagamento.ts
import type { TipoPagamento } from "@/types";

const LABEL_TIPO: Record<TipoPagamento, string> = {
  pix: "Pix",
  deposito: "Depósito",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
};

// Cada forma de pagamento tem uma cor própria, para reconhecimento rápido
// visual (item pedido: "cores respectivas para pix, depósito e transf").
const COR_TIPO: Record<TipoPagamento, string> = {
  pix: "bg-violet-50 text-violet-700 border-violet-200",
  deposito: "bg-sky-50 text-sky-700 border-sky-200",
  transferencia: "bg-emerald-50 text-emerald-700 border-emerald-2000",
  dinheiro: "bg-gray-100 text-gray-700 border-gray-300",
  cartao: "bg-orange-50 text-orange-700 border-orange-200",
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

/**
 * Classes Tailwind para o badge da forma de pagamento. A cor de fundo segue
 * o tipoPagamento; quando é promissória, um anel âmbar é sobreposto como
 * destaque adicional (a promissória continua sendo, antes de tudo, um Pix,
 * Depósito ou Transferência — a cor base não muda, só ganha um reforço).
 */
export function classeFormaPagamento(tipoPagamento: TipoPagamento, promissoria: boolean): string {
  const base = COR_TIPO[tipoPagamento];
  return promissoria ? `${base} ring-2 ring-amber-400 ring-offset-1` : base;
}