// Regras do minijogo, sem React: fáceis de testar e de ajustar.
import {
  FEED_STAGES,
  FRONT_ROW_Y,
  INVASION_AT,
  INVASION_SLOTS,
  MAIN_SLOTS,
  type FeedStage,
  type PigeonSlot,
} from '../../data/feedGame'

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

/**
 * Escolhe qual pombo vai bicar o próximo grão:
 * 1. na invasão, só pombos da fileira da frente (bem visíveis);
 * 2. de preferência um que não esteja bicando agora, para cada grão
 *    ter a sua bicada visível;
 * 3. se todos estiverem ocupados, qualquer um dos visíveis.
 */
export function pickTarget(pigeons: readonly PigeonSlot[], busy: ReadonlySet<number>, rng: () => number = Math.random): number {
  const all = pigeons.map((_, i) => i)
  const crowded = pigeons.length > MAIN_SLOTS.length
  const visible = crowded ? all.filter((i) => pigeons[i].y >= FRONT_ROW_Y) : all
  const candidates = visible.length > 0 ? visible : all
  const free = candidates.filter((i) => !busy.has(i))
  const pool = free.length > 0 ? free : candidates
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))]
}

const pigeonsLabel = (n: number) => (n === 1 ? '1 pombo reunido' : `${n} pombos reunidos`)

/** Texto para leitores de tela: diz o que aconteceu e quantos pombos há. */
export function announcementFor(event: Exclude<FeedEvent, null>, grains: number, message: string): string {
  const n = pigeonsFor(grains).length
  if (event === 'invasion') return `Invasão dos pombos! ${message} Agora são ${pigeonsLabel(n)}.`
  return `${message} ${pigeonsLabel(n)}.`
}
