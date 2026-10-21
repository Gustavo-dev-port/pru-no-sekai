// Liga as regras puras (farm.ts) ao save protegido. As ações econômicas são
// assíncronas: rodam dentro do Web Lock do save (ver src/lib/save.ts) e
// devolvem o resultado para a tela mostrar a mensagem certa.
import type { CropId } from '../data/crops'
import { getSave, transactSave, updateSave, useSave, type SaveFailure, type SaveStore } from '../lib/save'
import { claimFreePouch, harvest, plant, type EconomyState, type FarmError, type FarmResult } from './farm'

/** Erro das regras do jogo OU da proteção do save. */
export type EconomyError = FarmError | SaveFailure

/** `before`: a economia como estava DENTRO da operação protegida, antes da ação. */
export type EconomyResult = { ok: true; state: EconomyState; before: EconomyState } | { ok: false; error: EconomyError }

type Action = (economy: EconomyState, now: number) => FarmResult

export function useEconomy(): EconomyState {
  return useSave((s) => s.economy)
}

export function getEconomy(): EconomyState {
  return getSave().economy
}

/**
 * Lê, valida e grava NA MESMA operação protegida. `transact` permite usar
 * outra loja (ex.: testes com duas "abas").
 */
export async function runEconomyAction(
  action: Action,
  transact: SaveStore['transactSave'] = transactSave,
  now: () => number = Date.now,
): Promise<EconomyResult> {
  const result = await transact((save) => {
    const outcome = action(save.economy, now())
    return { next: outcome.ok ? { ...save, economy: outcome.state } : null, value: { outcome, before: save.economy } }
  })
  if (!result.ok) return { ok: false, error: result.failure }
  const { outcome, before } = result.value
  return outcome.ok ? { ok: true, state: outcome.state, before } : { ok: false, error: outcome.error }
}

export const plantAction = (plotIndex: number, crop: CropId): Action => (e, now) => plant(e, plotIndex, crop, now)
export const harvestAction = (plotIndex: number): Action => (e, now) => harvest(e, plotIndex, now)
export const pouchAction: Action = (e, now) => claimFreePouch(e, now)

export const plantAt = (plotIndex: number, crop: CropId) => runEconomyAction(plantAction(plotIndex, crop))
export const harvestAt = (plotIndex: number) => runEconomyAction(harvestAction(plotIndex))
export const takeFreePouch = () => runEconomyAction(pouchAction)

/** Não é recurso: vale o melhor esforço (some na hora, grava pelo lock). */
export function finishTutorial() {
  void updateSave((s) => ({ ...s, economy: { ...s.economy, tutorialDone: true } }))
}
