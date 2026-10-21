import { describe, expect, it } from 'vitest'
import { initialEconomy } from '../economy/farm'
import { createFakeLockManager } from '../test/fakeLocks'
import { MemoryStorage } from '../test/memoryStorage'
import {
  BACKUP_KEY_PREFIX,
  createSaveStore,
  interpretSave,
  LEGACY_MAIL_KEY,
  SAVE_KEY,
  SCHEMA_VERSION,
  type SaveData,
} from './save'

const T0 = 1_700_000_000_000
const legacyMail = { opened: [1, 2, 4], seen: [1, 2, 4, 3], pokes: 2, visited: ['correio', 'oraculo'] }
const legacyText = JSON.stringify(legacyMail)
const v2 = (over: Partial<SaveData> = {}): SaveData => ({
  schemaVersion: 2,
  mail: { opened: [9], seen: [9], pokes: 1, visited: ['correio'] },
  economy: { ...initialEconomy(), tutorialDone: true, lastFreePouchAt: null },
  ...over,
})

function browser(entries: Record<string, string> = {}) {
  const storage = new MemoryStorage()
  for (const [k, v] of Object.entries(entries)) storage.setItem(k, v)
  storage.writes = 0
  const open = () => createSaveStore({ storage, locks: createFakeLockManager(), now: () => T0 })
  return { storage, open }
}

describe('AUD-007-02 — versões do save (interpretSave)', () => {
  it('sem save nenhum: começa do zero', () => {
    const r = interpretSave(null, null, T0)
    expect(r).toMatchObject({ status: 'ok', writable: true, needsWrite: true, backup: null })
    expect(r.data.mail).toEqual({ opened: [], seen: [], pokes: 0, visited: [] })
    expect(r.data.economy).toEqual(initialEconomy())
  })

  it('migração v1 → v2: traz o Correio inteiro da chave antiga', () => {
    const r = interpretSave(null, legacyText, T0)
    expect(r.status).toBe('ok')
    expect(r.data.schemaVersion).toBe(SCHEMA_VERSION)
    expect(r.data.mail).toEqual(legacyMail)
  })

  it('v2 válido: carrega sem consertar nada e sem gravar', () => {
    const r = interpretSave(JSON.stringify(v2()), legacyText, T0)
    expect(r).toMatchObject({ status: 'ok', writable: true, needsWrite: false, backup: null, issues: [] })
    expect(r.data.mail.opened).toEqual([9]) // v2 tem prioridade sobre a chave antiga
  })

  it.each([3, 4, 99])('schemaVersion %i (futura): somente leitura, nunca grava', (version) => {
    const r = interpretSave(JSON.stringify({ ...v2(), schemaVersion: version }), null, T0)
    expect(r).toMatchObject({ status: 'future-version', writable: false, needsWrite: false })
    expect(r.data.mail.opened).toEqual([9]) // mostra o que der para ler
  })

  it.each([
    ['ausente', undefined],
    ['texto', '2'],
    ['fração', 2.5],
    ['zero', 0],
    ['negativa', -1],
    ['v1 dentro do save novo', 1],
  ])('versão %s: recupera o que der e pede cópia de segurança', (_, version) => {
    const save = { ...v2(), schemaVersion: version }
    const r = interpretSave(JSON.stringify(save), null, T0)
    expect(r.status).toBe('recovered')
    expect(r.backup).toBe(JSON.stringify(save))
    expect(r.data.mail.opened).toEqual([9]) // dados válidos preservados
  })

  it('JSON corrompido: recomeça, aproveita o Correio v1 e guarda o texto original', () => {
    const r = interpretSave('{isso não é json', legacyText, T0)
    expect(r).toMatchObject({ status: 'recovered', writable: true, backup: '{isso não é json' })
    expect(r.data.mail).toEqual(legacyMail)
  })
})

describe('AUD-007-02 — proteção ao abrir o site (loja)', () => {
  it('migra v1 → v2, grava a v2 e deixa a chave antiga EXATAMENTE como estava', () => {
    const { storage, open } = browser({ [LEGACY_MAIL_KEY]: legacyText })
    const store = open()
    expect(store.get().mail).toEqual(legacyMail)
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).mail).toEqual(legacyMail)
    expect(storage.getItem(LEGACY_MAIL_KEY)).toBe(legacyText)
  })

  it('save de versão futura: NADA é gravado, nem ao abrir nem ao tentar jogar', async () => {
    const future = JSON.stringify({ ...v2(), schemaVersion: 3, novidade: 'campo do futuro' })
    const { storage, open } = browser({ [SAVE_KEY]: future })
    const store = open()
    expect(store.status()).toBe('future-version')

    const r = await store.transactSave((s) => ({ next: { ...s, economy: { ...s.economy, tutorialDone: false } }, value: 1 }))
    expect(r).toEqual({ ok: false, failure: 'save-incompativel' })
    await store.updateSave((s) => ({ ...s, mail: { ...s.mail, pokes: 99 } }))
    await store.flush()

    expect(storage.getItem(SAVE_KEY)).toBe(future)
    expect(storage.writes).toBe(0)
  })

  it('outra aba (mais nova) grava uma v3 no meio: esta aba para de gravar', async () => {
    const { storage, open } = browser({ [SAVE_KEY]: JSON.stringify(v2()) })
    const store = open()
    const future = JSON.stringify({ ...v2(), schemaVersion: 3 })
    storage.setItem(SAVE_KEY, future)
    const r = await store.transactSave((s) => ({ next: s, value: 1 }))
    expect(r).toEqual({ ok: false, failure: 'save-incompativel' })
    expect(storage.getItem(SAVE_KEY)).toBe(future)
    expect(store.status()).toBe('future-version')
  })

  it('save corrompido: o texto original vai para uma chave de cópia antes de gravar', () => {
    const { storage, open } = browser({ [SAVE_KEY]: '{quebrado', [LEGACY_MAIL_KEY]: legacyText })
    const store = open()
    expect(store.status()).toBe('recovered')
    expect(store.get().mail).toEqual(legacyMail)
    const backups = storage.keys().filter((k) => k.startsWith(BACKUP_KEY_PREFIX))
    expect(backups).toHaveLength(1)
    expect(storage.getItem(backups[0])).toBe('{quebrado')
    expect(storage.getItem(LEGACY_MAIL_KEY)).toBe(legacyText)
  })

  it('o progresso sobrevive a recarregar a página', async () => {
    const { open } = browser()
    const first = open()
    await first.transactSave((s) => ({ next: { ...s, economy: { ...s.economy, food: { milho: 7, arroz: 0, girassol: 0 } } }, value: 1 }))
    expect(open().get().economy.food.milho).toBe(7)
  })

  it('sem armazenamento (modo privado): funciona em memória, sem erro', async () => {
    const store = createSaveStore({ storage: null, locks: null, now: () => T0 })
    expect(store.status()).toBe('storage-unavailable')
    const r = await store.transactSave((s) => ({ next: { ...s, economy: { ...s.economy, tutorialDone: true } }, value: 'ok' }))
    expect(r).toEqual({ ok: true, value: 'ok' })
    expect(store.get().economy.tutorialDone).toBe(true)
  })
})
