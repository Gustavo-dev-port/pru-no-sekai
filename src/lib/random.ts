/**
 * Sorteia um índice de `length` diferente de `previous`, para nunca
 * repetir o mesmo item duas vezes seguidas. Usado pelo pombo guardião
 * e, futuramente, pelo Oráculo dos Pombos.
 */
export function pickIndexAvoiding(length: number, previous: number | null, rng: () => number = Math.random): number {
  if (length <= 0) throw new Error('pickIndexAvoiding: lista vazia')
  if (length === 1) return 0
  if (previous === null || previous < 0 || previous >= length) {
    return Math.floor(rng() * length)
  }
  // Sorteia entre os outros length-1 índices e "pula" o anterior.
  const candidate = Math.floor(rng() * (length - 1))
  return candidate >= previous ? candidate + 1 : candidate
}
