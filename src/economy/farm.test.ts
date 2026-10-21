import { describe, expect, it } from 'vitest'
import { CROPS, FREE_POUCH, PLOT_COUNT, SEEDS_RETURNED_ON_HARVEST, STARTING_SEEDS } from '../data/crops'
import { claimFreePouch, growthOf, harvest, initialEconomy, plant, pouchReadyIn, recoverEconomy, type EconomyState } from './farm'

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

describe('AUD-007-03 — recuperação de dados salvos', () => {
  const NOW = T0 + 1000
  const valid = () => ({
    seeds: { milho: 2, arroz: 0, girassol: 1 },
    food: { milho: 10, arroz: 0, girassol: 20 },
    plots: [{ crop: 'milho', plantedAt: T0 }, null, null, null],
    lastFreePouchAt: null,
    tutorialDone: true,
  })

  it('save íntegro: nada muda e o relatório fica vazio (zeros escritos são mantidos)', () => {
    const r = recoverEconomy(valid(), NOW)
    expect(r.issues).toEqual([])
    expect(r.state).toEqual(valid())
  })

  it('sementes parcialmente ausentes: mantém as que existem; ausente vira 0 e é relatado como "ausente"', () => {
    const r = recoverEconomy({ ...valid(), seeds: { milho: 2 } }, NOW)
    expect(r.state.seeds).toEqual({ milho: 2, arroz: 0, girassol: 0 })
    expect(r.issues).toContain('seeds.arroz: ausente → 0')
    expect(r.issues).toContain('seeds.girassol: ausente → 0')
  })

  it('alimentos parcialmente ausentes: idem, sem inventar estoque', () => {
    const r = recoverEconomy({ ...valid(), food: { girassol: 20 } }, NOW)
    expect(r.state.food).toEqual({ milho: 0, arroz: 0, girassol: 20 })
    expect(r.issues).toContain('food.milho: ausente → 0')
  })

  it('valores negativos, não finitos e não numéricos são rejeitados (→ 0, "inválido")', () => {
    const r = recoverEconomy(
      { ...valid(), seeds: { milho: -3, arroz: Infinity, girassol: '5' }, food: { milho: NaN, arroz: null, girassol: 2.9 } },
      NOW,
    )
    expect(r.state.seeds).toEqual({ milho: 0, arroz: 0, girassol: 0 })
    expect(r.state.food).toEqual({ milho: 0, arroz: 0, girassol: 2 })
    expect(r.issues).toEqual(expect.arrayContaining(['seeds.milho: inválido → 0', 'seeds.girassol: inválido → 0', 'food.girassol: fração → 2']))
  })

  it('canteiros inválidos ficam vazios; os válidos são preservados', () => {
    const r = recoverEconomy({ ...valid(), plots: [{ crop: 'milho', plantedAt: T0 }, { crop: 'abacaxi', plantedAt: T0 }, 'lixo', 42] }, NOW)
    expect(r.state.plots).toEqual([{ crop: 'milho', plantedAt: T0 }, null, null, null])
    expect(r.issues).toEqual(expect.arrayContaining(['canteiro 2: inválido → vazio', 'canteiro 3: inválido → vazio']))
  })

  it('datas de plantio inválidas: a planta é mantida e volta a crescer de agora', () => {
    const r = recoverEconomy(
      { ...valid(), plots: [{ crop: 'arroz' }, { crop: 'milho', plantedAt: 'ontem' }, { crop: 'girassol', plantedAt: NOW + 99_999 }, null] },
      NOW,
    )
    expect(r.state.plots).toEqual([
      { crop: 'arroz', plantedAt: NOW },
      { crop: 'milho', plantedAt: NOW },
      { crop: 'girassol', plantedAt: NOW },
      null,
    ])
    expect(r.issues).toContain('canteiro 1: data de plantio ausente → agora (planta mantida)')
    expect(r.issues).toContain('canteiro 3: plantio no futuro → agora')
  })

  it('canteiros além do limite: removidos com a semente devolvida (sem duplicar)', () => {
    const plots = [null, null, null, null, { crop: 'girassol', plantedAt: T0 }, { crop: 'abacaxi', plantedAt: T0 }]
    const r = recoverEconomy({ ...valid(), plots }, NOW)
    expect(r.state.plots).toHaveLength(4)
    expect(r.state.seeds.girassol).toBe(valid().seeds.girassol + 1)
  })

  it('objeto incompleto: o que falta é deduzido de forma conservadora', () => {
    const r = recoverEconomy({ food: { milho: 3, arroz: 0, girassol: 0 } }, NOW)
    expect(r.state.food.milho).toBe(3) // preservado
    expect(r.state.plots).toEqual([null, null, null, null])
    expect(r.state.lastFreePouchAt).toBeNull() // ficou sem sementes e plantas → saquinho liberado
    expect(r.state.tutorialDone).toBe(true) // já tinha colhido: tutorial visto
    expect(r.issues).toContain('sem sementes e sem plantas após a recuperação → saquinho grátis liberado')
  })

  it('último saquinho ausente/inválido: espera o intervalo inteiro (não ganha saquinho de graça)', () => {
    const r = recoverEconomy({ ...valid(), lastFreePouchAt: 'ontem' }, NOW)
    expect(r.state.lastFreePouchAt).toBe(NOW)
    expect(pouchReadyIn(r.state, NOW)).toBe(FREE_POUCH.cooldownMs)
  })

  it('save totalmente corrompido: estado inicial, sem lançar erro', () => {
    for (const lixo of ['nada', 42, null, undefined, [], true]) {
      const r = recoverEconomy(lixo, NOW)
      expect(r.state).toEqual(initialEconomy())
      expect(r.issues).toEqual(['economia ausente ou inválida: estado inicial'])
    }
  })

  it('recuperação é estável: recuperar de novo não muda nada nem duplica recursos', () => {
    const once = recoverEconomy({ seeds: { milho: 1 }, plots: [null, null, null, null, { crop: 'milho', plantedAt: T0 }] }, NOW).state
    const twice = recoverEconomy(once, NOW)
    expect(twice.state).toEqual(once)
    expect(twice.issues).toEqual([])
  })
})
