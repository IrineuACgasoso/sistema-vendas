/**
 * Utilitários de data. O sistema trabalha internamente com formato ISO (yyyy-mm-dd)
 * mas exibe/recebe sempre dd/mm/aaaa na UI.
 */

const DATE_BR_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const DATE_ISO_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidBrDate(value: string): boolean {
  const match = DATE_BR_REGEX.exec(value);
  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > 2200) return false;

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;

  return true;
}

export function brDateToIso(value: string): string {
  if (!isValidBrDate(value)) {
    throw new Error(`Data inválida: "${value}". Esperado formato dd/mm/aaaa.`);
  }
  const [, day, month, year] = DATE_BR_REGEX.exec(value)!;
  return `${year}-${month}-${day}`;
}

export function isoDateToBr(value: string): string {
  const match = DATE_ISO_REGEX.exec(value);
  if (!match) {
    throw new Error(`Data ISO inválida: "${value}". Esperado formato yyyy-mm-dd.`);
  }
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/**
 * Aplica máscara dd/mm/aaaa progressivamente enquanto o usuário digita.
 * Aceita apenas dígitos, insere as barras automaticamente.
 */
export function applyBrDateMask(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function todayBr(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}
