// Regras de descoberta das cartas, sem React: fáceis de testar.
import {
  FINAL_LETTER_ID,
  LETTER_UNLOCK_RULES,
  LOVE_LETTERS,
  type LetterRarity,
  type LoveLetter,
} from '../../data/loveLetters'
import type { Progress } from '../../lib/progress'

const byId = new Map(LOVE_LETTERS.map((l) => [l.id, l]))

export function letterById(id: number): LoveLetter {
  const letter = byId.get(id)
  if (!letter) throw new Error(`Carta desconhecida: ${id}`)
  return letter
}

function openedOf(progress: Progress, rarity: LetterRarity): number {
  return progress.opened.filter((id) => byId.get(id)?.rarity === rarity).length
}

/** Quanto falta para uma condição: { atual, meta }. */
export function conditionProgress(condition: string, progress: Progress, unlockedSoFar: number) {
  const count = (current: number, target: number) => ({ current: Math.min(current, target), target })
  switch (condition) {
    case 'disponivel-no-primeiro-acesso':
      return count(1, 1)
    case 'abrir-1-carta':
      return count(progress.opened.length, 1)
    case 'abrir-2-cartas':
      return count(progress.opened.length, 2)
    case 'abrir-5-cartas':
      return count(progress.opened.length, 5)
    case 'abrir-7-cartas':
      return count(progress.opened.length, 7)
    case 'clicar-em-pombo-3-vezes':
      return count(progress.pokes, 3)
    case 'abrir-3-cartas-comuns':
      return count(openedOf(progress, 'comum'), 3)
    case 'abrir-2-cartas-raras':
      return count(openedOf(progress, 'rara'), 2)
    case 'visitar-modulo-oraculo':
      return count(progress.visited.includes('oraculo') ? 1 : 0, 1)
    case 'desbloquear-9-cartas':
      return count(unlockedSoFar, 9)
    default:
      throw new Error(`Condição desconhecida: ${condition}`)
  }
}

/**
 * Cartas desbloqueadas agora. A carta final depende das outras, então é
 * avaliada por último, contando só as outras 9.
 */
export function unlockedIds(progress: Progress): number[] {
  const unlocked = new Set<number>()
  for (const rule of LETTER_UNLOCK_RULES) {
    if (rule.letterId === FINAL_LETTER_ID) continue
    const { current, target } = conditionProgress(rule.condition, progress, 0)
    if (current >= target) unlocked.add(rule.letterId)
  }
  const finalRule = LETTER_UNLOCK_RULES.find((r) => r.letterId === FINAL_LETTER_ID)
  if (finalRule) {
    const { current, target } = conditionProgress(finalRule.condition, progress, unlocked.size)
    if (current >= target) unlocked.add(FINAL_LETTER_ID)
  }
  // cartas já abertas continuam disponíveis mesmo que as regras mudem no futuro
  progress.opened.forEach((id) => byId.has(id) && unlocked.add(id))
  return LOVE_LETTERS.map((l) => l.id).filter((id) => unlocked.has(id))
}

export function ruleFor(letterId: number) {
  const rule = LETTER_UNLOCK_RULES.find((r) => r.letterId === letterId)
  if (!rule) throw new Error(`Carta sem regra de desbloqueio: ${letterId}`)
  return rule
}

/** Desbloqueadas que ainda não apareceram no álbum: o carteiro vai entregar. */
export function newlyUnlocked(progress: Progress): number[] {
  return unlockedIds(progress).filter((id) => !progress.seen.includes(id))
}
