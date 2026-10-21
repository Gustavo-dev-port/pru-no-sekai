import { useSyncExternalStore } from 'react'
import { initialEconomy, recoverEconomy, type EconomyState } from '../economy/farm'

/* =========================================================================
   Salvamento único do jogo (localStorage), com versão de esquema,
   migração, recuperação e proteção entre abas.

   VERSÕES
     v1 — só o Correio, chave antiga "pru:correio:v1" (Entrega 06).
     v2 — atual: chave "pru:save" = { schemaVersion: 2, mail, economy }.

   AO CARREGAR (interpretSave, função pura)
     • sem "pru:save"            → migra o Correio da chave v1 (se houver);
                                   a chave v1 NUNCA é apagada nem alterada.
     • schemaVersion === 2       → valida e recupera campo a campo.
     • schemaVersion inteiro > 2 → VERSÃO FUTURA: mostra o que der para ler,
                                   mas NUNCA grava (modo somente leitura).
     • versão ausente/inválida,
       JSON corrompido           → guarda uma CÓPIA do texto original em
                                   "pru:save:backup:<data>" e só então
                                   grava a versão recuperada.

   CONCORRÊNCIA ENTRE ABAS (AUD-007-01)
     • Ações econômicas (plantar, colher, saquinho) usam transactSave():
       dentro de um Web Lock exclusivo "pru:save" (compartilhado por todas
       as abas da mesma origem) elas RELEEM o armazenamento, validam,
       aplicam e gravam. Com o lock, duas abas nunca fazem isso ao mesmo
       tempo: sem colheita dupla e sem sobrescrita.
     • Sem Web Locks (navegador antigo / contexto inseguro) e COM
       armazenamento compartilhado: NÃO há garantia → as ações econômicas
       falham de forma controlada ("sem-protecao") e o save não é tocado.
     • Sem armazenamento nenhum (ex.: modo privado bloqueado): tudo fica em
       memória nesta aba; não existe outra aba para conflitar.
     • Lock que demora demais (outra aba travada) → falha "ocupado" após
       LOCK_TIMEOUT_MS, sem tocar no save.
     • O Correio (não econômico) usa updateSave(): aplica na hora em memória
       e grava pelo mesmo lock; sem lock, grava direto (melhor esforço,
       documentado como sem garantia).
     • Evento "storage": quando outra aba grava, esta relê e atualiza a tela.
   ========================================================================= */

export const SAVE_KEY = 'pru:save'
export const LEGACY_MAIL_KEY = 'pru:correio:v1'
export const BACKUP_KEY_PREFIX = 'pru:save:backup:'
export const SCHEMA_VERSION = 2
export const LOCK_NAME = 'pru:save'
export const LOCK_TIMEOUT_MS = 5000

export interface MailProgress {
  /** Cartas já abertas (lidas), em ordem de abertura. */
  opened: number[]
  /** Cartas desbloqueadas que já apareceram no álbum. */
  seen: number[]
  /** Quantas vezes algum pombo do site foi cutucado. */
  pokes: number
  /** Módulos visitados. */
  visited: string[]
}

export interface SaveData {
  schemaVersion: typeof SCHEMA_VERSION
  mail: MailProgress
  economy: EconomyState
}

/**
 * - ok: save atual e íntegro (ou migrado da v1 / novo)
 * - recovered: havia problemas; o original foi copiado e a versão consertada é usada
 * - future-version: save de versão mais nova; somente leitura
 * - storage-unavailable: sem armazenamento; tudo em memória
 */
export type SaveStatus = 'ok' | 'recovered' | 'future-version' | 'storage-unavailable'

export interface LoadResult {
  data: SaveData
  status: SaveStatus
  /** Pode gravar no armazenamento? (false só na versão futura) */
  writable: boolean
  /** O que foi consertado/notado. */
  issues: string[]
  /** Texto original a guardar como cópia antes de gravar (recuperação). */
  backup: string | null
  /** É preciso gravar o resultado agora (migração ou recuperação). */
  needsWrite: boolean
}

const emptyMail = (): MailProgress => ({ opened: [], seen: [], pokes: 0, visited: [] })

export function sanitizeMail(raw: unknown): MailProgress {
  if (!raw || typeof raw !== 'object') return emptyMail()
  const data = raw as Partial<Record<keyof MailProgress, unknown>>
  const ids = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((n): n is number => Number.isInteger(n)))] : [])
  return {
    opened: ids(data.opened),
    seen: ids(data.seen),
    pokes: typeof data.pokes === 'number' && Number.isInteger(data.pokes) && data.pokes > 0 ? data.pokes : 0,
    visited: Array.isArray(data.visited) ? [...new Set(data.visited.filter((s): s is string => typeof s === 'string'))] : [],
  }
}

function tryParse(text: string | null): { ok: true; value: unknown } | { ok: false } {
  if (text === null) return { ok: true, value: null }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false }
  }
}

/** Correio a partir da chave antiga (v1). Texto corrompido → vazio (a chave fica intacta). */
function legacyMail(legacyText: string | null, issues: string[]): MailProgress {
  const parsed = tryParse(legacyText)
  if (!parsed.ok) {
    issues.push('Correio v1 corrompido: ignorado (chave antiga mantida intacta)')
    return emptyMail()
  }
  return sanitizeMail(parsed.value)
}

/** Interpreta o que está guardado. Pura: não lê nem grava nada. */
export function interpretSave(saveText: string | null, legacyText: string | null, now: number): LoadResult {
  const issues: string[] = []
  const fresh = (status: SaveStatus, backup: string | null): LoadResult => ({
    data: { schemaVersion: SCHEMA_VERSION, mail: legacyMail(legacyText, issues), economy: initialEconomy() },
    status,
    writable: true,
    issues,
    backup,
    needsWrite: true,
  })

  // 1. nada salvo: novo jogo (migrando o Correio v1, se existir)
  if (saveText === null) return fresh('ok', null)

  // 2. JSON corrompido: cópia + recomeço (Correio v1 ainda é aproveitado)
  const parsed = tryParse(saveText)
  if (!parsed.ok || !parsed.value || typeof parsed.value !== 'object' || Array.isArray(parsed.value)) {
    issues.push('save ilegível: original copiado para backup')
    return fresh('recovered', saveText)
  }

  const raw = parsed.value as { schemaVersion?: unknown; mail?: unknown; economy?: unknown }
  const version = raw.schemaVersion

  // 3. versão futura: lê o que der, mas nunca grava
  if (typeof version === 'number' && Number.isInteger(version) && version > SCHEMA_VERSION) {
    issues.push(`save da versão ${version} (este site entende até a ${SCHEMA_VERSION}): somente leitura`)
    return {
      data: { schemaVersion: SCHEMA_VERSION, mail: sanitizeMail(raw.mail), economy: recoverEconomy(raw.economy, now).state },
      status: 'future-version',
      writable: false,
      issues,
      backup: null,
      needsWrite: false,
    }
  }

  // 4. versão atual ou versão ausente/inválida (recupera o que der)
  const versionOk = version === SCHEMA_VERSION
  if (!versionOk) issues.push(`versão ${version === undefined ? 'ausente' : `inválida (${JSON.stringify(version)})`}`)

  const mail = raw.mail === undefined ? legacyMail(legacyText, issues) : sanitizeMail(raw.mail)
  if (raw.mail === undefined) issues.push('Correio ausente no save: recuperado da chave v1, se existir')
  const economy = recoverEconomy(raw.economy, now)
  issues.push(...economy.issues.map((i) => `economia — ${i}`))

  const clean = issues.length === 0
  return {
    data: { schemaVersion: SCHEMA_VERSION, mail, economy: economy.state },
    status: clean ? 'ok' : 'recovered',
    writable: true,
    issues,
    backup: clean ? null : saveText,
    needsWrite: !clean,
  }
}

/* ---------------------------- loja (store) ---------------------------- */

export type SaveFailure = 'save-incompativel' | 'sem-protecao' | 'ocupado' | 'falha-ao-salvar'

export type TransactionResult<T> = { ok: true; value: T } | { ok: false; failure: SaveFailure }

export interface SaveStoreEnv {
  /** Armazenamento compartilhado entre abas (`null` = indisponível). */
  storage: Storage | null
  /** Web Locks (`null` = indisponível). */
  locks: LockManager | null
  now: () => number
  lockTimeoutMs?: number
}

export function createSaveStore(env: SaveStoreEnv) {
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((l) => l())
  let pending: Promise<unknown> = Promise.resolve()

  const read = (): LoadResult => {
    if (!env.storage) {
      return { ...interpretSave(null, null, env.now()), status: 'storage-unavailable', needsWrite: false }
    }
    return interpretSave(env.storage.getItem(SAVE_KEY), env.storage.getItem(LEGACY_MAIL_KEY), env.now())
  }

  /** Grava (com cópia de segurança antes, se for recuperação). false = falhou. */
  const persist = (result: LoadResult, data: SaveData): boolean => {
    if (!env.storage || !result.writable) return false
    try {
      if (result.backup !== null) env.storage.setItem(`${BACKUP_KEY_PREFIX}${env.now()}`, result.backup)
      env.storage.setItem(SAVE_KEY, JSON.stringify(data))
      return true
    } catch {
      return false
    }
  }

  let loaded: LoadResult = (() => {
    try {
      const result = read()
      if (result.needsWrite && persist(result, result.data)) return { ...result, backup: null, needsWrite: false }
      return result
    } catch {
      return { ...interpretSave(null, null, env.now()), status: 'storage-unavailable' as const, needsWrite: false }
    }
  })()
  let state: SaveData = loaded.data

  /** Executa `work` com exclusividade entre abas. */
  async function exclusive<T>(work: () => T): Promise<TransactionResult<T>> {
    if (!env.locks) return { ok: false, failure: 'sem-protecao' }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), env.lockTimeoutMs ?? LOCK_TIMEOUT_MS)
    try {
      const value = await env.locks.request(LOCK_NAME, { mode: 'exclusive', signal: controller.signal }, () => {
        clearTimeout(timer)
        return work()
      })
      return { ok: true, value }
    } catch (error) {
      clearTimeout(timer)
      if (error instanceof SaveAbort) return { ok: false, failure: error.failure }
      // DOMException nem sempre é instanceof Error (depende do ambiente): compara pelo nome
      if ((error as { name?: unknown } | null)?.name === 'AbortError') return { ok: false, failure: 'ocupado' }
      throw error
    }
  }

  /**
   * Alteração protegida (economia): lê do armazenamento, aplica e grava
   * dentro do lock. `change` devolve `{ next, value }`; `next = null` = não
   * altera nada (ex.: ação recusada pelas regras).
   */
  async function transactSave<T>(change: (current: SaveData) => { next: SaveData | null; value: T }): Promise<TransactionResult<T>> {
    if (!loaded.writable) return { ok: false, failure: 'save-incompativel' }

    // sem armazenamento: só esta aba existe, em memória
    if (!env.storage) {
      const { next, value } = change(state)
      if (next) {
        state = next
        notify()
      }
      return { ok: true, value }
    }

    const run = exclusive(() => {
      const fresh = read() // relê DENTRO do lock: o que outra aba gravou conta
      if (!fresh.writable) {
        loaded = fresh
        state = fresh.data
        notify()
        throw new SaveAbort('save-incompativel')
      }
      const { next, value } = change(fresh.data)
      const target = next ?? fresh.data
      if (next || fresh.needsWrite) {
        if (!persist(fresh, target)) throw new SaveAbort('falha-ao-salvar')
      }
      state = target
      notify()
      return value
    })
    pending = run.catch(() => undefined)
    return run
  }

  /**
   * Alteração de melhor esforço (Correio): aparece na hora e é gravada
   * pelo lock (ou direto, sem lock). Nunca derruba a tela.
   */
  function updateSave(change: (current: SaveData) => SaveData): Promise<void> {
    state = change(state)
    notify()
    if (!loaded.writable || !env.storage) return Promise.resolve()

    const writeFresh = () => {
      const fresh = read()
      if (!fresh.writable) return
      const next = change(fresh.data)
      if (persist(fresh, next)) state = next
      notify()
    }

    if (!env.locks) {
      try {
        writeFresh()
      } catch {
        /* melhor esforço */
      }
      return Promise.resolve()
    }
    const run = exclusive(writeFresh).then(() => undefined, () => undefined)
    pending = Promise.all([pending, run])
    return run
  }

  /** Outra aba gravou: atualiza esta. */
  function handleExternalChange() {
    try {
      const fresh = read()
      loaded = fresh
      state = fresh.data
      notify()
    } catch {
      /* mantém o que está em memória */
    }
  }

  return {
    get: () => state,
    status: () => loaded.status,
    issues: () => loaded.issues,
    writable: () => loaded.writable,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    transactSave,
    updateSave,
    handleExternalChange,
    /** Espera as gravações em andamento (testes). */
    flush: () => pending.then(() => undefined),
  }
}

class SaveAbort extends Error {
  constructor(readonly failure: SaveFailure) {
    super(failure)
  }
}

export type SaveStore = ReturnType<typeof createSaveStore>

/* ------------------------- loja padrão do site ------------------------- */

function browserEnv(): SaveStoreEnv {
  let storage: Storage | null = null
  try {
    storage = window.localStorage
    storage.getItem(SAVE_KEY) // pode lançar em modo privado
  } catch {
    storage = null
  }
  const locks = typeof navigator !== 'undefined' && navigator.locks ? navigator.locks : null
  return { storage, locks, now: () => Date.now() }
}

let store: SaveStore = createSaveStore(browserEnv())
const appListeners = new Set<() => void>()
let unsubscribeStore = store.subscribe(() => appListeners.forEach((l) => l()))

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === SAVE_KEY || e.key === null) store.handleExternalChange()
  })
}

export const getSave = (): SaveData => store.get()
export const getSaveStatus = (): SaveStatus => store.status()
export const getSaveIssues = (): string[] => store.issues()

export function subscribeSave(listener: () => void): () => void {
  appListeners.add(listener)
  return () => {
    appListeners.delete(listener)
  }
}

export function useSave<T>(select: (s: SaveData) => T): T {
  return useSyncExternalStore(subscribeSave, () => select(store.get()), () => select(store.get()))
}

export function useSaveStatus(): SaveStatus {
  return useSyncExternalStore(subscribeSave, () => store.status(), () => store.status())
}

export const transactSave: SaveStore['transactSave'] = (change) => store.transactSave(change)
export const updateSave: SaveStore['updateSave'] = (change) => store.updateSave(change)
export const flushSaves = () => store.flush()

/** Testes: recria a loja padrão como se a página abrisse de novo. */
export function reloadSaveForTests(env: Partial<SaveStoreEnv> = {}) {
  unsubscribeStore()
  store = createSaveStore({ ...browserEnv(), ...env })
  unsubscribeStore = store.subscribe(() => appListeners.forEach((l) => l()))
  appListeners.forEach((l) => l())
}
