/**
 * Firestore não tem "contains"/"ILIKE" nativo. A técnica padrão para
 * autocomplete por prefixo é: normalizar o texto (lowercase, sem acento)
 * e fazer uma range query: where(campo >= termo) && where(campo <= termo + '\uf8ff')
 */

export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim();
}

export function prefixRangeEnd(prefix: string): string {
  return `${prefix}\uf8ff`;
}
