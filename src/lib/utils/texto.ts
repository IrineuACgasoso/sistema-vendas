/**
 * Capitaliza a primeira letra de cada palavra, sem alterar o restante do
 * texto já digitado (preserva maiúsculas internas, ex: siglas). Mesmo
 * comportamento do teclado do Android: só mexe na primeira letra de cada
 * palavra, deixando o resto livre pro usuário.
 */
export function capitalizarPalavras(valor: string): string {
  return valor.replace(/(^|\s)(\p{L})/gu, (_match, espaco: string, letra: string) => espaco + letra.toUpperCase());
}