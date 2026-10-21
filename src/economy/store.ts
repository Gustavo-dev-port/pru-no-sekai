// Liga as regras puras (farm.ts) ao save. A interface chama estas funções;
// elas devolvem o resultado para a tela mostrar a mensagem certa.
import type { CropId } from '../data/crops'
import { getSave, updateSave, useSave } from '../lib/save'
import { claimFreePouch, harvest, plant, type EconomyState, type FarmResult } from './farm'

export function useEconomy(): EconomyState {
  return useSave((s) => s.economy)
}

export function getEconomy(): EconomyState {
  return getSave().economy
}

function apply(action: (economy: EconomyState, now: number) => FarmResult): FarmResult {
  let result: FarmResult | undefined
  updateSave((save) => {
    result = action(save.economy, Date.now())
    return result.ok ? { ...save, economy: result.state } : save
  })
  return result!
}

export const plantAt = (plotIndex: number, crop: CropId) => apply((e, now) => plant(e, plotIndex, crop, now))
export const harvestAt = (plotIndex: number) => apply((e, now) => harvest(e, plotIndex, now))
export const takeFreePouch = () => apply((e, now) => claimFreePouch(e, now))

export function finishTutorial() {
  updateSave((s) => ({ ...s, economy: { ...s.economy, tutorialDone: true } }))
}
