// AUD-007-01 — concorrência entre abas.
// Cada "aba" é uma loja (createSaveStore) própria, com o seu estado em
// memória, mas todas compartilham o MESMO armazenamento e o MESMO
// gerenciador de locks — como abas de um navegador.
//
// Limitação honesta: o jsdom roda numa única thread, então duas abas de
// teste nunca executam código ao mesmo tempo de verdade. Estes testes provam
// (1) que toda ação econômica passa pelo lock "pru:save", (2) que, dentro
// dele, o estado é relido do armazenamento (abas desatualizadas não
// estragam nada) e (3) os resultados com ações disparadas juntas
// (Promise.all). A exclusão mútua real entre processos é do navegador
// (Web Locks) e foi verificada manualmente com duas abas — ver ENTREGA-07.1.
import { describe, expect, it, vi } from 'vitest'
import { CROPS, FREE_POUCH } from '../data/crops'
import { createSaveStore, LOCK_NAME, LOCK_TIMEOUT_MS, SAVE_KEY } from '../lib/save'
import { createFakeLockManager } from '../test/fakeLocks'
import { MemoryStorage } from '../test/memoryStorage'
import { harvestAction, plantAction, pouchAction, runEconomyAction } from './store'

const T0 = 1_700_000_000_000

function twoTabs({ withLocks = true } = {}) {
  let now = T0
  const storage = new MemoryStorage()
  const locks = withLocks ? createFakeLockManager() : null
  const open = () => createSaveStore({ storage, locks, now: () => now })
  const a = open()
  const b = open()
  const act = (tab: typeof a, action: Parameters<typeof runEconomyAction>[0]) =>
    runEconomyAction(action, tab.transactSave, () => now)
  return { storage, locks, a, b, act, setNow: (t: number) => (now = t), saved: () => JSON.parse(storage.getItem(SAVE_KEY)!) }
}

describe('AUD-007-01 — duas abas', () => {
  it('as duas tentam colher o MESMO canteiro ao mesmo tempo: só uma colhe', async () => {
    const t = twoTabs()
    await t.act(t.a, plantAction(0, 'milho'))
    t.setNow(T0 + CROPS.milho.growMs)
    // a aba B ainda acha que o canteiro está pronto (estado antigo em memória)
    const [ra, rb] = await Promise.all([t.act(t.a, harvestAction(0)), t.act(t.b, harvestAction(0))])

    expect([ra.ok, rb.ok].filter(Boolean)).toHaveLength(1)
    expect([ra, rb].find((r) => !r.ok)).toMatchObject({ ok: false, error: 'canteiro-vazio' })
    expect(t.saved().economy.food.milho).toBe(CROPS.milho.yield) // colhido uma vez só
    expect(t.saved().economy.seeds.milho).toBe(4) // 4 − 1 plantada + 1 devolvida
  })

  it('dois plantios simultâneos no mesmo canteiro: um planta, o outro é recusado, só 1 semente gasta', async () => {
    const t = twoTabs()
    const [ra, rb] = await Promise.all([t.act(t.a, plantAction(0, 'milho')), t.act(t.b, plantAction(0, 'arroz'))])
    expect([ra.ok, rb.ok].filter(Boolean)).toHaveLength(1)
    expect([ra, rb].find((r) => !r.ok)).toMatchObject({ error: 'canteiro-ocupado' })
    const seeds = t.saved().economy.seeds
    expect(seeds.milho + seeds.arroz).toBe(4 + 2 - 1)
  })

  it('dois plantios simultâneos em canteiros diferentes: os dois valem, nada sobrescrito', async () => {
    const t = twoTabs()
    await Promise.all([t.act(t.a, plantAction(0, 'milho')), t.act(t.b, plantAction(1, 'milho'))])
    const eco = t.saved().economy
    expect(eco.plots.slice(0, 2).map((p: { crop: string }) => p.crop)).toEqual(['milho', 'milho'])
    expect(eco.seeds.milho).toBe(2)
  })

  it('colheita numa aba enquanto a outra mexe no inventário (saquinho): nenhum dos dois se perde', async () => {
    const t = twoTabs()
    await t.act(t.a, plantAction(0, 'arroz'))
    t.setNow(T0 + CROPS.arroz.growMs)
    const [harvest, pouch] = await Promise.all([t.act(t.a, harvestAction(0)), t.act(t.b, pouchAction)])
    expect(harvest.ok && pouch.ok).toBe(true)
    const eco = t.saved().economy
    expect(eco.food.arroz).toBe(CROPS.arroz.yield)
    expect(eco.seeds.arroz).toBe(2 - 1 + 1 + FREE_POUCH.seeds.arroz) // colheita E saquinho
    expect(eco.seeds.milho).toBe(4 + FREE_POUCH.seeds.milho)
  })

  it('duas tentativas simultâneas de pegar o saquinho grátis: só uma ganha', async () => {
    const t = twoTabs()
    const [ra, rb] = await Promise.all([t.act(t.a, pouchAction), t.act(t.b, pouchAction)])
    expect([ra.ok, rb.ok].filter(Boolean)).toHaveLength(1)
    expect([ra, rb].find((r) => !r.ok)).toMatchObject({ error: 'saquinho-indisponivel' })
    expect(t.saved().economy.seeds.milho).toBe(4 + FREE_POUCH.seeds.milho)
  })

  it('toda ação econômica passa pelo lock "pru:save"', async () => {
    const t = twoTabs()
    await t.act(t.a, plantAction(0, 'milho'))
    await t.act(t.b, pouchAction)
    expect(t.locks!.requests.get(LOCK_NAME)).toBe(2)
  })

  it('sincronização: depois que uma aba grava, a outra recebe o estado novo (evento storage)', async () => {
    const t = twoTabs()
    await t.act(t.a, plantAction(2, 'girassol'))
    expect(t.b.get().economy.plots[2]).toBeNull() // B ainda não sabe
    t.b.handleExternalChange() // o que o evento "storage" dispara
    expect(t.b.get().economy.plots[2]).toMatchObject({ crop: 'girassol' })
  })

  it('sem Web Locks: a ação econômica falha de forma controlada e o save não é tocado', async () => {
    const t = twoTabs({ withLocks: false })
    const before = t.storage.getItem(SAVE_KEY)
    const writes = t.storage.writes
    const r = await t.act(t.a, plantAction(0, 'milho'))
    expect(r).toEqual({ ok: false, error: 'sem-protecao' })
    expect(t.storage.getItem(SAVE_KEY)).toBe(before)
    expect(t.storage.writes).toBe(writes)
    expect(t.a.get().economy.seeds.milho).toBe(4)
  })

  it('outra aba segurando o lock tempo demais: falha "ocupado" sem tocar no save', async () => {
    vi.useFakeTimers()
    try {
      const t = twoTabs()
      const release = t.locks!.hold(LOCK_NAME)
      const before = t.storage.getItem(SAVE_KEY)
      const pending = t.act(t.a, plantAction(0, 'milho'))
      await vi.advanceTimersByTimeAsync(LOCK_TIMEOUT_MS)
      expect(await pending).toEqual({ ok: false, error: 'ocupado' })
      expect(t.storage.getItem(SAVE_KEY)).toBe(before)
      release()
    } finally {
      vi.useRealTimers()
    }
  })

  it('lock ocupado por pouco tempo: a ação espera e depois usa o estado mais novo', async () => {
    const t = twoTabs()
    const release = t.locks!.hold(LOCK_NAME)
    const pending = t.act(t.b, plantAction(0, 'milho'))
    // enquanto B espera, A... não consegue gravar também (espera na fila)
    const pendingA = t.act(t.a, plantAction(0, 'arroz'))
    release()
    const [rb, ra] = await Promise.all([pending, pendingA])
    expect(rb.ok).toBe(true)
    expect(ra).toMatchObject({ ok: false, error: 'canteiro-ocupado' }) // A viu o plantio de B
  })
})
