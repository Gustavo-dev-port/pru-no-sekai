// Regras do minijogo, sem React: fáceis de testar e de ajustar.
import { FEED_STAGES, INVASION_AT, INVASION_SLOTS, MAIN_SLOTS, type FeedStage, type PigeonSlot } from '../../data/feedGame'

export function stageIndexFor(grains: number): number {
  let index = 0
  FEED_STAGES.forEach((stage, i) => {
    if (grains >= stage.minGrains) index = i
  })
  return index
}

export function stageFor(grains: number): FeedStage {
  return FEED_STAGES[stageIndexFor(grains)]
}

export function isInvasion(grains: number): boolean {
  return grains >= INVASION_AT
}

/** Pombos no jardim agora (grupo principal + invasores, se for o caso). */
export function pigeonsFor(grains: number): PigeonSlot[] {
  const main = MAIN_SLOTS.slice(0, stageFor(grains).pigeons)
  return isInvasion(grains) ? [...MAIN_SLOTS, ...INVASION_SLOTS] : main
}

/**
 * O que mudou de importante entre dois valores do contador, para anunciar
 * (leitor de tela e balão de fala). `null` = nada para anunciar.
 */
export type FeedEvent = 'stage' | 'invasion' | null

export function eventBetween(before: number, after: number): FeedEvent {
  if (!isInvasion(before) && isInvasion(after)) return 'invasion'
  if (stageIndexFor(before) !== stageIndexFor(after)) return 'stage'
  return null
}
