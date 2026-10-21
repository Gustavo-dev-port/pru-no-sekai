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

/* ---------- Recuperação de dados salvos (AUD-007-03) ----------
   Política documentada, campo a campo. Princípios:
   1. O que é válido é mantido (inclusive zero escrito de propósito).
   2. Ausente ≠ zero: os dois viram um valor seguro, mas o ausente é
      registrado no relatório como "ausente" e o inválido como "inválido".
   3. Nunca cria recurso do nada: quantidade sem valor confiável vira 0.
      A única "devolução" é a semente de plantas que não cabem mais nos
      canteiros (a semente já tinha sido gasta para plantar).
   4. Se a recuperação deixar a jogadora sem sementes e sem plantas, o
      saquinho grátis fica disponível na hora (ninguém fica travado).
   5. Nunca lança erro.

   | Campo                  | Válido                    | Ausente                 | Inválido (negativo, NaN, texto…) |
   |------------------------|---------------------------|-------------------------|----------------------------------|
   | sementes/alimentos     | inteiro ≥ 0 (fração: piso) | 0                       | 0                                |
   | canteiro               | null ou {planta, data}    | vazio                   | vazio (planta desconhecida)      |
   | data de plantio        | número ≤ agora            | agora (planta mantida)  | agora (planta mantida)           |
   | data no futuro         | —                         | —                       | agora                            |
   | canteiros além do 4º   | —                         | —                       | removidos, +1 semente devolvida  |
   | último saquinho        | null ou número ≤ agora    | agora (espera o tempo)  | agora                            |
   | tutorial visto         | true/false                | deduzido do progresso   | deduzido do progresso            |
*/

export interface EconomyRecovery {
  state: EconomyState
  /** O que precisou ser consertado (vazio = dados íntegros). */
  issues: string[]
}

const isValidCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

export function recoverEconomy(raw: unknown, now: number): EconomyRecovery {
  const issues: string[] = []
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { state: initialEconomy(), issues: ['economia ausente ou inválida: estado inicial'] }
  }
  const data = raw as Partial<Record<keyof EconomyState, unknown>>

  const counts = (field: 'seeds' | 'food') => {
    const out = zeroCrops()
    const v = data[field]
    if (!v || typeof v !== 'object' || Array.isArray(v)) {
      issues.push(`${field}: ${v === undefined ? 'ausente' : 'inválido'} → 0`)
      return out
    }
    const rec = v as Record<string, unknown>
    for (const crop of CROP_ORDER) {
      const value = rec[crop]
      if (isValidCount(value)) {
        out[crop] = Math.floor(value)
        if (!Number.isInteger(value)) issues.push(`${field}.${crop}: fração → ${out[crop]}`)
      } else {
        issues.push(`${field}.${crop}: ${value === undefined ? 'ausente' : 'inválido'} → 0`)
      }
    }
    return out
  }

  const seeds = counts('seeds')
  const food = counts('food')

  const plots: (Plot | null)[] = Array.from({ length: PLOT_COUNT }, () => null)
  if (!Array.isArray(data.plots)) {
    issues.push(`canteiros: ${data.plots === undefined ? 'ausentes' : 'inválidos'} → vazios`)
  } else {
    data.plots.forEach((entry: unknown, i: number) => {
      if (entry === null) return
      const p = entry as Partial<Plot> | undefined
      if (!p || typeof p !== 'object' || typeof p.crop !== 'string' || !(p.crop in CROPS)) {
        if (i < PLOT_COUNT) issues.push(`canteiro ${i + 1}: inválido → vazio`)
        else issues.push(`canteiro ${i + 1}: inválido, além do limite → removido`)
        return
      }
      const crop = p.crop as CropId
      if (i >= PLOT_COUNT) {
        seeds[crop] += 1
        issues.push(`canteiro ${i + 1}: além do limite → removido, semente de ${crop} devolvida`)
        return
      }
      let plantedAt = now
      if (typeof p.plantedAt === 'number' && Number.isFinite(p.plantedAt)) {
        plantedAt = Math.min(p.plantedAt, now)
        if (p.plantedAt > now) issues.push(`canteiro ${i + 1}: plantio no futuro → agora`)
      } else {
        issues.push(`canteiro ${i + 1}: data de plantio ${p.plantedAt === undefined ? 'ausente' : 'inválida'} → agora (planta mantida)`)
      }
      plots[i] = { crop, plantedAt }
    })
  }

  let lastFreePouchAt: number | null
  const last = data.lastFreePouchAt
  if (last === null) lastFreePouchAt = null
  else if (typeof last === 'number' && Number.isFinite(last)) lastFreePouchAt = Math.min(last, now)
  else {
    lastFreePouchAt = now
    issues.push(`último saquinho: ${last === undefined ? 'ausente' : 'inválido'} → agora`)
  }

  let tutorialDone: boolean
  if (typeof data.tutorialDone === 'boolean') tutorialDone = data.tutorialDone
  else {
    const played = plots.some(Boolean) || CROP_ORDER.some((c) => food[c] > 0) || lastFreePouchAt !== null
    tutorialDone = played
    issues.push(`tutorial: ${data.tutorialDone === undefined ? 'ausente' : 'inválido'} → ${played ? 'visto' : 'não visto'}`)
  }

  // ninguém fica travado por causa de uma recuperação
  const noSeeds = CROP_ORDER.every((c) => seeds[c] === 0)
  if (issues.length > 0 && noSeeds && !plots.some(Boolean) && lastFreePouchAt !== null) {
    lastFreePouchAt = null
    issues.push('sem sementes e sem plantas após a recuperação → saquinho grátis liberado')
  }

  return { state: { seeds, food, plots, lastFreePouchAt, tutorialDone }, issues }
}

/** Atalho: só o estado recuperado. */
export function sanitizeEconomy(raw: unknown, now: number): EconomyState {
  return recoverEconomy(raw, now).state
}
