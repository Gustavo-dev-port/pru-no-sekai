import { describe, expect, it } from 'vitest'
import { initialEconomy } from '../economy/farm'
import { createFakeLockManager } from '../test/fakeLocks'
import { MemoryStorage } from '../test/memoryStorage'
import {
  BACKUP_KEY_PREFIX,
  createSaveStore,
  interpretSave,
  LEGACY_MAIL_KEY,
  LOCK_NAME,
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

function browser(entries: Record<string, string> = {}, storage = new MemoryStorage()) {
  for (const [k, v] of Object.entries(entries)) storage.setItem(k, v)
  storage.writes = 0
  // todas as "abas" deste navegador compartilham o armazenamento E os locks
  const locks = createFakeLockManager()
  const open = () => createSaveStore({ storage, locks, now: () => T0 })
  const backups = () => storage.keys().filter((k) => k.startsWith(BACKUP_KEY_PREFIX))
  return { storage, locks, open, backups }
}

/** Armazenamento em que gravar o save falha (cota cheia), mas o resto funciona. */
class FailingSaveStorage extends MemoryStorage {
  failSave = false
  setItem(key: string, value: string) {
    if (this.failSave && key === SAVE_KEY) throw new Error('QuotaExceededError')
    super.setItem(key, value)
  }
}

const withFood = (milho: number): SaveData => v2({ economy: { ...v2().economy, food: { milho, arroz: 0, girassol: 0 } } })

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
  it('migra v1 → v2, grava a v2 e deixa a chave antiga EXATAMENTE como estava', async () => {
    const { storage, open } = browser({ [LEGACY_MAIL_KEY]: legacyText })
    const store = open()
    expect(store.get().mail).toEqual(legacyMail)
    // a gravação da migração passa pelo Web Lock (assíncrona): espera terminar
    await store.flush()
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

  it('save corrompido: o texto original vai para uma chave de cópia antes de gravar', async () => {
    const { storage, open } = browser({ [SAVE_KEY]: '{quebrado', [LEGACY_MAIL_KEY]: legacyText })
    const store = open()
    expect(store.status()).toBe('recovered')
    expect(store.get().mail).toEqual(legacyMail)
    await store.flush()
    expect(store.status()).toBe('recovered')
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).mail).toEqual(legacyMail)
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

describe('AUD-007.1-02 — abrir o site em várias abas ao mesmo tempo', () => {
  it('duas abas abrem juntas sem save: o save é criado uma vez só', async () => {
    const { storage, open } = browser()
    const a = open()
    const b = open()
    await Promise.all([a.flush(), b.flush()])
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).schemaVersion).toBe(SCHEMA_VERSION)
    expect(storage.writes).toBe(1) // a segunda releu dentro do lock e não regravou
  })

  it('a gravação de abertura passa pelo lock "pru:save"', async () => {
    const { locks, open } = browser()
    await open().flush()
    expect(locks.requests.get(LOCK_NAME)).toBe(1)
  })

  it('save íntegro: abrir não pede lock nem grava', async () => {
    const { storage, locks, open } = browser({ [SAVE_KEY]: JSON.stringify(v2()) })
    await open().flush()
    expect(locks.requests.get(LOCK_NAME)).toBeUndefined()
    expect(storage.writes).toBe(0)
  })

  it('outra aba grava progresso antes de a abertura desta terminar: o progresso dela NÃO é sobrescrito', async () => {
    const { storage, locks, open } = browser()
    const release = locks.hold(LOCK_NAME) // a outra aba está no meio de uma ação
    const b = open() // esta aba leu "nada salvo" e espera o lock para criar o save
    const fromOtherTab = JSON.stringify(withFood(7))
    storage.setItem(SAVE_KEY, fromOtherTab)
    release()
    await b.flush()

    expect(storage.getItem(SAVE_KEY)).toBe(fromOtherTab)
    expect(b.get().economy.food.milho).toBe(7) // e esta aba passa a mostrar o progresso da outra
  })

  it('alteração do Correio feita antes de a abertura terminar não se perde nem apaga o progresso da outra aba', async () => {
    const { storage, locks, open } = browser()
    const release = locks.hold(LOCK_NAME)
    const b = open()
    void b.updateSave((s) => ({ ...s, mail: { ...s.mail, pokes: s.mail.pokes + 1 } }))
    expect(b.get().mail.pokes).toBe(1) // aparece na hora
    storage.setItem(SAVE_KEY, JSON.stringify(withFood(7)))
    release()
    await b.flush()

    const saved = JSON.parse(storage.getItem(SAVE_KEY)!)
    expect(saved.economy.food.milho).toBe(7)
    expect(saved.mail.pokes).toBe(2) // 1 da outra aba + 1 desta
    expect(b.get().mail.pokes).toBe(2)
  })

  it('migração concorrente v1 → v2: uma gravação, Correio inteiro, chave antiga intacta, nenhuma cópia', async () => {
    const { storage, open, backups } = browser({ [LEGACY_MAIL_KEY]: legacyText })
    const a = open()
    const b = open()
    await Promise.all([a.flush(), b.flush()])
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).mail).toEqual(legacyMail)
    expect(a.get().mail).toEqual(legacyMail)
    expect(b.get().mail).toEqual(legacyMail)
    expect(storage.writes).toBe(1)
    expect(storage.getItem(LEGACY_MAIL_KEY)).toBe(legacyText)
    expect(backups()).toHaveLength(0)
  })

  it('recuperação concorrente: duas abas com o mesmo save corrompido fazem UMA cópia', async () => {
    const { storage, open, backups } = browser({ [SAVE_KEY]: '{quebrado', [LEGACY_MAIL_KEY]: legacyText })
    const a = open()
    const b = open()
    await Promise.all([a.flush(), b.flush()])
    expect(backups()).toHaveLength(1)
    expect(storage.getItem(backups()[0])).toBe('{quebrado')
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).mail).toEqual(legacyMail)
  })

  it('recuperação com falha de gravação: nada se perde e recarregar não multiplica as cópias', async () => {
    const storage = new FailingSaveStorage()
    const { open, backups } = browser({ [SAVE_KEY]: '{quebrado', [LEGACY_MAIL_KEY]: legacyText }, storage)
    storage.failSave = true

    for (let reload = 0; reload < 3; reload++) {
      const store = open()
      await store.flush()
      expect(store.status()).toBe('recovered')
      expect(store.get().mail).toEqual(legacyMail) // segue jogável, em memória
    }
    expect(storage.getItem(SAVE_KEY)).toBe('{quebrado') // o original continua lá
    expect(backups()).toHaveLength(1)
    expect(storage.getItem(LEGACY_MAIL_KEY)).toBe(legacyText)

    // o armazenamento volta a aceitar gravações: abrir de novo conclui a recuperação
    storage.failSave = false
    const store = open()
    await store.flush()
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).mail).toEqual(legacyMail)
    expect(backups()).toHaveLength(1)
  })

  it('falha de gravação ao abrir: a ação seguinte, já com espaço, grava o save recuperado', async () => {
    const storage = new FailingSaveStorage()
    const { open, backups } = browser({ [SAVE_KEY]: '{quebrado' }, storage)
    storage.failSave = true
    const store = open()
    await store.flush()
    storage.failSave = false
    const r = await store.transactSave((s) => ({ next: { ...s, economy: { ...s.economy, tutorialDone: true } }, value: 1 }))
    expect(r).toEqual({ ok: true, value: 1 })
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).economy.tutorialDone).toBe(true)
    expect(backups()).toHaveLength(1)
  })

  it('uma cópia nunca substitui outra diferente feita no mesmo instante', async () => {
    const { storage, open, backups } = browser({ [`${BACKUP_KEY_PREFIX}${T0}`]: 'cópia anterior', [SAVE_KEY]: '{quebrado' })
    await open().flush()
    expect(backups()).toHaveLength(2)
    expect(backups().map((k) => storage.getItem(k)).sort()).toEqual(['cópia anterior', '{quebrado'].sort())
  })

  it('sem Web Locks: grava direto ao abrir (melhor esforço) e preserva a chave antiga', () => {
    const storage = new MemoryStorage()
    storage.setItem(LEGACY_MAIL_KEY, legacyText)
    const store = createSaveStore({ storage, locks: null, now: () => T0 })
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).mail).toEqual(legacyMail)
    expect(store.get().mail).toEqual(legacyMail)
    expect(storage.getItem(LEGACY_MAIL_KEY)).toBe(legacyText)
  })
})

describe('AUD-007.1-01 — save incompatível: nada muda, nem em memória', () => {
  const future = JSON.stringify({ ...v2(), schemaVersion: 3, novidade: 'campo do futuro' })
  const poke = (s: SaveData): SaveData => ({ ...s, mail: { ...s.mail, pokes: s.mail.pokes + 1 } })

  it('versão futura ao abrir: alterações do Correio e do tutorial não aparecem nem são gravadas', async () => {
    const { storage, open } = browser({ [SAVE_KEY]: future })
    const store = open()
    const before = store.get()
    let notified = 0
    store.subscribe(() => notified++)

    await store.updateSave(poke)
    await store.updateSave((s) => ({ ...s, mail: { ...s.mail, opened: [...s.mail.opened, 1] } }))
    await store.updateSave((s) => ({ ...s, economy: { ...s.economy, tutorialDone: false } }))
    await store.flush()

    expect(store.get()).toBe(before) // o mesmo objeto: nada mudou
    expect(notified).toBe(0) // a tela nem foi avisada
    expect(storage.getItem(SAVE_KEY)).toBe(future)
    expect(storage.writes).toBe(0)
  })

  it('o save fica incompatível com alterações na fila: elas são desfeitas e nada é gravado', async () => {
    const { storage, locks, open } = browser({ [SAVE_KEY]: JSON.stringify(v2()) })
    const store = open()
    const release = locks.hold(LOCK_NAME)
    void store.updateSave(poke)
    void store.updateSave(poke)
    expect(store.get().mail.pokes).toBe(3) // otimista: 1 + 2

    storage.setItem(SAVE_KEY, future) // outra aba, mais nova, gravou uma v3
    storage.writes = 0
    release()
    await store.flush()

    expect(storage.getItem(SAVE_KEY)).toBe(future)
    expect(storage.writes).toBe(0)
    expect(store.status()).toBe('future-version')
    expect(store.get().mail.pokes).toBe(1) // voltou ao que está gravado

    // e continua sem aceitar nada
    await store.updateSave(poke)
    expect(store.get().mail.pokes).toBe(1)
    expect(storage.getItem(SAVE_KEY)).toBe(future)
  })

  it('ação econômica na fila quando o save fica incompatível: recusada, memória igual ao que está gravado', async () => {
    const { storage, locks, open } = browser({ [SAVE_KEY]: JSON.stringify(v2()) })
    const store = open()
    const release = locks.hold(LOCK_NAME)
    const action = store.transactSave((s) => ({ next: { ...s, economy: { ...s.economy, food: { milho: 99, arroz: 0, girassol: 0 } } }, value: 1 }))
    storage.setItem(SAVE_KEY, future)
    release()
    expect(await action).toEqual({ ok: false, failure: 'save-incompativel' })
    expect(store.get().economy.food.milho).toBe(0)
    expect(storage.getItem(SAVE_KEY)).toBe(future)
  })

  it('o evento "storage" com uma v3 descarta o que estava na fila', async () => {
    const { storage, locks, open } = browser({ [SAVE_KEY]: JSON.stringify(v2()) })
    const store = open()
    const release = locks.hold(LOCK_NAME)
    void store.updateSave(poke)
    storage.setItem(SAVE_KEY, future)
    store.handleExternalChange()
    expect(store.get().mail.pokes).toBe(1)
    storage.writes = 0
    release()
    await store.flush()
    expect(storage.writes).toBe(0)
    expect(storage.getItem(SAVE_KEY)).toBe(future)
  })
})

describe('rollback — gravação que falha não deixa progresso fictício na economia', () => {
  it('ação econômica com falha ao gravar: "falha-ao-salvar", memória e armazenamento como antes', async () => {
    const storage = new FailingSaveStorage()
    const original = JSON.stringify(v2())
    const { open } = browser({ [SAVE_KEY]: original }, storage)
    const store = open()
    const before = store.get()
    storage.failSave = true

    const r = await store.transactSave((s) => ({ next: { ...s, economy: { ...s.economy, food: { milho: 5, arroz: 0, girassol: 0 } } }, value: 1 }))
    expect(r).toEqual({ ok: false, failure: 'falha-ao-salvar' })
    expect(store.get()).toEqual(before)
    expect(store.get().economy.food.milho).toBe(0)
    expect(storage.getItem(SAVE_KEY)).toBe(original)
  })

  it('outra aba grava enquanto esta tem uma alteração do Correio na fila: as duas valem', async () => {
    const { storage, locks, open } = browser({ [SAVE_KEY]: JSON.stringify(v2()) })
    const store = open()
    const release = locks.hold(LOCK_NAME)
    void store.updateSave((s) => ({ ...s, mail: { ...s.mail, pokes: s.mail.pokes + 1 } }))
    storage.setItem(SAVE_KEY, JSON.stringify(withFood(3))) // a outra aba colheu
    store.handleExternalChange()
    expect(store.get().economy.food.milho).toBe(3)
    expect(store.get().mail.pokes).toBe(2) // a cutucada na fila continua na tela
    release()
    await store.flush()
    const saved = JSON.parse(storage.getItem(SAVE_KEY)!)
    expect(saved.economy.food.milho).toBe(3)
    expect(saved.mail.pokes).toBe(2)
  })
})
