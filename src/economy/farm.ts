// Regras da Fazendinha e do inventário. Funções puras: recebem o estado e
// o horário atual (`now`, em ms) e devolvem um estado novo. Nada de React,
// relógio ou armazenamento aqui — por isso o crescimento "com o site
// fechado" é só uma conta: agora − horário em que plantou.
import {
  CROP_ORDER,
  CROPS,
  FREE_POUCH,
  PLOT_COUNT,
  SEEDS_RETURNED_ON_HARVEST,
  STARTING_SEEDS,
  type CropId,
} from '../data/crops'

export interface Plot {
  crop: CropId
  /** Horário real (epoch ms) em que foi plantado. */
  plantedAt: number
}

export interface EconomyState {
  /** Sementes para plantar. */
  seeds: Record<CropId, number>
  /** Alimentos colhidos (estoque). Ainda não são gastos em nenhum módulo. */
  food: Record<CropId, number>
  /** Canteiros: `null` = vazio. */
  plots: (Plot | null)[]
  /** Quando o saquinho grátis foi pego pela última vez (`null` = nunca). */
  lastFreePouchAt: number | null
  /** Tutorial da primeira visita já visto. */
  tutorialDone: boolean
}

const zeroCrops = (): Record<CropId, number> => ({ milho: 0, arroz: 0, girassol: 0 })

export function initialEconomy(): EconomyState {
  return {
    seeds: { ...STARTING_SEEDS },
    food: zeroCrops(),
    plots: Array.from({ length: PLOT_COUNT }, () => null),
    lastFreePouchAt: null,
    tutorialDone: false,
  }
}

/* ---------- Crescimento ---------- */

export interface Growth {
  /** 0 a 1. */
  progress: number
  ready: boolean
  remainingMs: number
  /** 0 semente, 1 broto, 2 crescendo, 3 pronto. */
  stage: 0 | 1 | 2 | 3
}

export function growthOf(plot: Plot, now: number): Growth {
  const total = CROPS[plot.crop].growMs
  // relógio voltou no tempo: conta como zero, nunca como negativo
  const elapsed = Math.max(0, now - plot.plantedAt)
  const progress = Math.min(1, elapsed / total)
  const ready = elapsed >= total
  const stage = ready ? 3 : progress < 1 / 3 ? 0 : progress < 2 / 3 ? 1 : 2
  return { progress, ready, remainingMs: Math.max(0, total - elapsed), stage }
}

/* ---------- Ações ---------- */

export type FarmError = 'canteiro-invalido' | 'canteiro-ocupado' | 'sem-sementes' | 'canteiro-vazio' | 'ainda-crescendo' | 'saquinho-indisponivel'

export type FarmResult = { ok: true; state: EconomyState } | { ok: false; error: FarmError; state: EconomyState }

const fail = (state: EconomyState, error: FarmError): FarmResult => ({ ok: false, error, state })

export function plant(state: EconomyState, plotIndex: number, crop: CropId, now: number): FarmResult {
  if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= state.plots.length) return fail(state, 'canteiro-invalido')
  if (state.plots[plotIndex]) return fail(state, 'canteiro-ocupado')
  if ((state.seeds[crop] ?? 0) < 1) return fail(state, 'sem-sementes')
  const plots = state.plots.slice()
  plots[plotIndex] = { crop, plantedAt: now }
  return { ok: true, state: { ...state, seeds: { ...state.seeds, [crop]: state.seeds[crop] - 1 }, plots } }
}

export function harvest(state: EconomyState, plotIndex: number, now: number): FarmResult {
  if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= state.plots.length) return fail(state, 'canteiro-invalido')
  const plot = state.plots[plotIndex]
  if (!plot) return fail(state, 'canteiro-vazio')
  if (!growthOf(plot, now).ready) return fail(state, 'ainda-crescendo')
  const plots = state.plots.slice()
  plots[plotIndex] = null // o canteiro esvazia na mesma operação: não dá para colher duas vezes
  const { yield: amount } = CROPS[plot.crop]
  return {
    ok: true,
    state: {
      ...state,
      plots,
      food: { ...state.food, [plot.crop]: state.food[plot.crop] + amount },
      seeds: { ...state.seeds, [plot.crop]: state.seeds[plot.crop] + SEEDS_RETURNED_ON_HARVEST },
    },
  }
}

export function pouchReadyIn(state: EconomyState, now: number): number {
  if (state.lastFreePouchAt === null) return 0
  return Math.max(0, state.lastFreePouchAt + FREE_POUCH.cooldownMs - now)
}

export function claimFreePouch(state: EconomyState, now: number): FarmResult {
  if (pouchReadyIn(state, now) > 0) return fail(state, 'saquinho-indisponivel')
  const seeds = { ...state.seeds }
  for (const crop of CROP_ORDER) seeds[crop] += FREE_POUCH.seeds[crop]
  return { ok: true, state: { ...state, seeds, lastFreePouchAt: now } }
}

/* ---------- Dados salvos ---------- */

const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0)

/**
 * Confere e conserta dados lidos do armazenamento (podem estar velhos,
 * incompletos ou editados à mão). Nunca lança erro.
 */
export function sanitizeEconomy(raw: unknown, now: number): EconomyState {
  const base = initialEconomy()
  if (!raw || typeof raw !== 'object') return base
  const data = raw as Partial<Record<keyof EconomyState, unknown>>

  const cropRecord = (v: unknown, fallback: Record<CropId, number>) => {
    if (!v || typeof v !== 'object') return { ...fallback }
    const rec = v as Record<string, unknown>
    const out = zeroCrops()
    for (const crop of CROP_ORDER) out[crop] = count(rec[crop])
    return out
  }

  const plots = Array.from({ length: PLOT_COUNT }, (_, i): Plot | null => {
    const p = Array.isArray(data.plots) ? (data.plots[i] as Partial<Plot> | null) : null
    if (!p || typeof p !== 'object' || !(p.crop && p.crop in CROPS)) return null
    const plantedAt = typeof p.plantedAt === 'number' && Number.isFinite(p.plantedAt) ? p.plantedAt : now
    // plantio "no futuro" (relógio adiantado antes): conta a partir de agora
    return { crop: p.crop, plantedAt: Math.min(plantedAt, now) }
  })

  const last = data.lastFreePouchAt
  return {
    seeds: cropRecord(data.seeds, base.seeds),
    food: cropRecord(data.food, base.food),
    plots,
    lastFreePouchAt: typeof last === 'number' && Number.isFinite(last) ? Math.min(last, now) : null,
    tutorialDone: data.tutorialDone === true,
  }
}
