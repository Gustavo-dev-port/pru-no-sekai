// Configuração da economia da Fazendinha. TODO número ajustável fica aqui:
// tempos, produção, sementes iniciais e o saquinho grátis.

export type CropId = 'milho' | 'arroz' | 'girassol'

export interface CropConfig {
  id: CropId
  /** Nome da planta. */
  name: string
  /** Nome do alimento colhido (estoque). */
  foodName: string
  /** Tempo real até ficar pronto para colher. */
  growMs: number
  /** Unidades de alimento por colheita. */
  yield: number
}

export const CROPS: Record<CropId, CropConfig> = {
  milho: { id: 'milho', name: 'Milho', foodName: 'milho', growMs: 30_000, yield: 5 },
  arroz: { id: 'arroz', name: 'Arroz', foodName: 'arroz', growMs: 60_000, yield: 10 },
  girassol: { id: 'girassol', name: 'Girassol', foodName: 'sementes de girassol', growMs: 120_000, yield: 20 },
}

/** Ordem de exibição. */
export const CROP_ORDER: readonly CropId[] = ['milho', 'arroz', 'girassol']

/** Canteiros da fazendinha nesta versão. */
export const PLOT_COUNT = 4

/** Sementes com que a jogadora começa. */
export const STARTING_SEEDS: Record<CropId, number> = { milho: 4, arroz: 2, girassol: 1 }

/** Cada colheita devolve esta quantidade de sementes da mesma planta. */
export const SEEDS_RETURNED_ON_HARVEST = 1

/**
 * Saquinho grátis do Pombo-sama: garante que ninguém fique sem sementes
 * para sempre. Pode ser pego de novo depois do intervalo.
 */
export const FREE_POUCH = {
  seeds: { milho: 2, arroz: 1, girassol: 1 } as Record<CropId, number>,
  cooldownMs: 3 * 60_000,
}
