import { describe, expect, it } from 'vitest'
import { CROPS, FREE_POUCH, PLOT_COUNT, SEEDS_RETURNED_ON_HARVEST, STARTING_SEEDS } from '../data/crops'
import { claimFreePouch, growthOf, harvest, initialEconomy, plant, pouchReadyIn, sanitizeEconomy, type EconomyState } from './farm'

const T0 = 1_700_000_000_000
const ok = (r: ReturnType<typeof plant>) => {
  if (!r.ok) throw new Error(`esperava sucesso, veio ${r.error}`)
  return r.state
}

describe('configuração', () => {
  it('valores aprovados: milho 30 s/5, arroz 60 s/10, girassol 120 s/20; 4 canteiros', () => {
    expect([CROPS.milho.growMs, CROPS.milho.yield]).toEqual([30_000, 5])
    expect([CROPS.arroz.growMs, CROPS.arroz.yield]).toEqual([60_000, 10])
    expect([CROPS.girassol.growMs, CROPS.girassol.yield]).toEqual([120_000, 20])
    expect(PLOT_COUNT).toBe(4)
  })

  it('começa com as sementes iniciais, sem alimentos e com os 4 canteiros vazios', () => {
    const s = initialEconomy()
    expect(s.seeds).toEqual(STARTING_SEEDS)
    expect(s.food).toEqual({ milho: 0, arroz: 0, girassol: 0 })
    expect(s.plots).toEqual([null, null, null, null])
  })
})

describe('plantar', () => {
  it('funciona nos quatro canteiros e gasta 1 semente por vez', () => {
    let s: EconomyState = { ...initialEconomy(), seeds: { milho: 4, arroz: 0, girassol: 0 } }
    for (let i = 0; i < 4; i++) s = ok(plant(s, i, 'milho', T0))
    expect(s.plots.every((p) => p?.crop === 'milho')).toBe(true)
    expect(s.seeds.milho).toBe(0)
  })

  it('não gasta semente que não existe', () => {
    const s = { ...initialEconomy(), seeds: { milho: 0, arroz: 0, girassol: 0 } }
    const r = plant(s, 0, 'milho', T0)
    expect(r.ok).toBe(false)
    expect(!r.ok && r.error).toBe('sem-sementes')
    expect(r.state).toBe(s)
  })

  it('não planta em canteiro ocupado nem em canteiro inexistente', () => {
    const s = ok(plant(initialEconomy(), 0, 'milho', T0))
    expect(plant(s, 0, 'arroz', T0)).toMatchObject({ ok: false, error: 'canteiro-ocupado' })
    expect(plant(s, 4, 'arroz', T0)).toMatchObject({ ok: false, error: 'canteiro-invalido' })
    expect(plant(s, -1, 'arroz', T0)).toMatchObject({ ok: false, error: 'canteiro-invalido' })
    expect(plant(s, 1.5, 'arroz', T0)).toMatchObject({ ok: false, error: 'canteiro-invalido' })
  })
})

describe('crescimento pelo horário real', () => {
  it('fica pronto exatamente no tempo configurado', () => {
    const plot = { crop: 'milho' as const, plantedAt: T0 }
    expect(growthOf(plot, T0 + 29_999).ready).toBe(false)
    expect(growthOf(plot, T0 + 30_000).ready).toBe(true)
    expect(growthOf(plot, T0 + 10_000).remainingMs).toBe(20_000)
  })

  it('passa pelos estágios semente → broto → crescendo → pronto', () => {
    const plot = { crop: 'girassol' as const, plantedAt: T0 }
    expect([0, 40_000, 80_000, 120_000].map((dt) => growthOf(plot, T0 + dt).stage)).toEqual([0, 1, 2, 3])
  })

  it('continua com o site fechado: horas depois, está pronto', () => {
    const plot = { crop: 'girassol' as const, plantedAt: T0 }
    expect(growthOf(plot, T0 + 5 * 3_600_000)).toMatchObject({ ready: true, progress: 1, remainingMs: 0 })
  })

  it('relógio voltando no tempo não gera crescimento negativo', () => {
    const plot = { crop: 'milho' as const, plantedAt: T0 }
    expect(growthOf(plot, T0 - 60_000)).toMatchObject({ progress: 0, ready: false, remainingMs: 30_000 })
  })
})

describe('colher', () => {
  it('atualiza o estoque, devolve 1 semente e esvazia o canteiro', () => {
    let s = ok(plant(initialEconomy(), 2, 'arroz', T0))
    const before = s.seeds.arroz
    s = ok(harvest(s, 2, T0 + 60_000))
    expect(s.food.arroz).toBe(10)
    expect(s.seeds.arroz).toBe(before + SEEDS_RETURNED_ON_HARVEST)
    expect(s.plots[2]).toBeNull()
  })

  it('não colhe duas vezes a mesma plantação', () => {
    const planted = ok(plant(initialEconomy(), 0, 'milho', T0))
    const once = ok(harvest(planted, 0, T0 + 30_000))
    const twice = harvest(once, 0, T0 + 30_000)
    expect(twice).toMatchObject({ ok: false, error: 'canteiro-vazio' })
    expect(twice.state.food.milho).toBe(5)
  })

  it('não colhe antes da hora', () => {
    const planted = ok(plant(initialEconomy(), 0, 'milho', T0))
    const r = harvest(planted, 0, T0 + 10_000)
    expect(r).toMatchObject({ ok: false, error: 'ainda-crescendo' })
    expect(r.state.food.milho).toBe(0)
  })
})

describe('saquinho grátis (ninguém fica bloqueado)', () => {
  it('dá sementes de todas as plantas e respeita o intervalo', () => {
    const empty = { ...initialEconomy(), seeds: { milho: 0, arroz: 0, girassol: 0 } }
    const s = ok(claimFreePouch(empty, T0))
    expect(s.seeds).toEqual(FREE_POUCH.seeds)
    expect(claimFreePouch(s, T0 + 1000)).toMatchObject({ ok: false, error: 'saquinho-indisponivel' })
    expect(pouchReadyIn(s, T0 + 1000)).toBe(FREE_POUCH.cooldownMs - 1000)
    expect(claimFreePouch(s, T0 + FREE_POUCH.cooldownMs).ok).toBe(true)
  })

  it('mesmo gastando tudo, dá para voltar a plantar', () => {
    let s: EconomyState = { ...initialEconomy(), seeds: { milho: 0, arroz: 0, girassol: 0 } }
    expect(plant(s, 0, 'milho', T0).ok).toBe(false)
    s = ok(claimFreePouch(s, T0))
    expect(plant(s, 0, 'milho', T0).ok).toBe(true)
  })
})

describe('dados salvos', () => {
  it('conserta valores inválidos sem lançar erro', () => {
    const s = sanitizeEconomy(
      {
        seeds: { milho: -3, arroz: 'muitas', girassol: 2.7, abacaxi: 99 },
        food: null,
        plots: [{ crop: 'milho', plantedAt: T0 }, { crop: 'abacaxi', plantedAt: T0 }, 'lixo', { crop: 'arroz' }, { crop: 'milho', plantedAt: T0 }],
        lastFreePouchAt: 'ontem',
        tutorialDone: 'sim',
      },
      T0 + 1000,
    )
    expect(s.seeds).toEqual({ milho: 0, arroz: 0, girassol: 2 })
    expect(s.food).toEqual({ milho: 0, arroz: 0, girassol: 0 })
    expect(s.plots).toEqual([{ crop: 'milho', plantedAt: T0 }, null, null, { crop: 'arroz', plantedAt: T0 + 1000 }])
    expect(s.lastFreePouchAt).toBeNull()
    expect(s.tutorialDone).toBe(false)
  })

  it('plantio salvo "no futuro" (relógio adiantado) passa a contar de agora', () => {
    const s = sanitizeEconomy({ plots: [{ crop: 'milho', plantedAt: T0 + 9_999_999 }] }, T0)
    expect(s.plots[0]).toEqual({ crop: 'milho', plantedAt: T0 })
  })

  it('lixo total vira o estado inicial', () => {
    expect(sanitizeEconomy('nada', T0)).toEqual(initialEconomy())
  })
})
