/**
 * Valores monetários SEMPRE trafegam/gravam como inteiro em centavos.
 * Isso evita problemas clássicos de ponto flutuante com dinheiro.
 */

export function centavosToDisplay(centavos: number): string {
  const reais = centavos / 100;
  return reais.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Converte string digitada (ex: "1.234,56", "123456" durante digitação mascarada)
 * para centavos inteiros. Usado junto do CurrencyInput, que já mascara
 * a digitação como se fosse um "cofrinho" (dígitos entram da direita).
 */
export function digitsToCentavos(rawDigits: string): number {
  const onlyDigits = rawDigits.replace(/\D/g, "");
  if (!onlyDigits) return 0;
  return parseInt(onlyDigits, 10);
}

export function centavosToMaskedInput(centavos: number): string {
  const reais = centavos / 100;
  return reais.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function isValidCentavos(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < 1_000_000_000_00;
}
