import { useSyncExternalStore } from 'react'
import { initialEconomy, sanitizeEconomy, type EconomyState } from '../economy/farm'

// Salvamento único do jogo, só neste aparelho (localStorage).
//
// Versões do esquema:
//   v1 — só o Correio, na chave antiga "pru:correio:v1" (Entrega 06).
//   v2 — esta: chave "pru:save" com { schemaVersion, mail, economy }.
//
// Migração v1 → v2: se não existe "pru:save" mas existe a chave antiga, o
// progresso do Correio é COPIADO para o novo formato. A chave antiga nunca é
// apagada nem alterada (fica como cópia de segurança).
//
// Nada pessoal é guardado e nada sai do navegador.

export const SAVE_KEY = 'pru:save'
export const LEGACY_MAIL_KEY = 'pru:correio:v1'
export const SCHEMA_VERSION = 2

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

/**
 * Monta o save atual a partir do que estiver guardado. Pura (testável):
 * - save v2 (ou mais novo) → confere e conserta os campos;
 * - sem save v2 → começa do zero, trazendo o Correio da chave antiga (v1).
 */
export function migrate(rawSave: unknown, rawLegacyMail: unknown, now: number): SaveData {
  if (rawSave && typeof rawSave === 'object' && typeof (rawSave as { schemaVersion?: unknown }).schemaVersion === 'number') {
    const save = rawSave as { mail?: unknown; economy?: unknown }
    return { schemaVersion: SCHEMA_VERSION, mail: sanitizeMail(save.mail), economy: sanitizeEconomy(save.economy, now) }
  }
  return { schemaVersion: SCHEMA_VERSION, mail: sanitizeMail(rawLegacyMail), economy: initialEconomy() }
}

function parse(key: string): unknown {
  const raw = localStorage.getItem(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null // dado corrompido: ignora, mas não apaga
  }
}

/** Lê o armazenamento. `null` se o armazenamento não estiver disponível. */
function readStored(): SaveData | null {
  try {
    return migrate(parse(SAVE_KEY), parse(LEGACY_MAIL_KEY), Date.now())
  } catch {
    return null
  }
}

function write(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch {
    /* sem armazenamento: segue só em memória */
  }
}

function initialLoad(): SaveData {
  const data = readStored() ?? migrate(null, null, Date.now())
  try {
    // persiste a migração na hora (sem tocar na chave antiga)
    if (localStorage.getItem(SAVE_KEY) === null) write(data)
  } catch {
    /* sem armazenamento */
  }
  return data
}

let state: SaveData = initialLoad()
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

export function getSave(): SaveData {
  return state
}

export function subscribeSave(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSave<T>(select: (s: SaveData) => T): T {
  return useSyncExternalStore(subscribeSave, () => select(state), () => select(state))
}

/**
 * Altera o save. Relê o armazenamento antes (outra aba pode ter salvo algo
 * novo), aplica a mudança e grava. Assim duas abas abertas não colhem a
 * mesma plantação duas vezes.
 */
export function updateSave(change: (current: SaveData) => SaveData) {
  const fresh = readStored()
  state = change(fresh ?? state)
  write(state)
  notify()
}

// outra aba salvou: atualiza esta também
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== SAVE_KEY) return
    const fresh = readStored()
    if (fresh) {
      state = fresh
      notify()
    }
  })
}

/** Só para testes: recarrega do armazenamento como se a página abrisse de novo. */
export function reloadSaveForTests() {
  state = initialLoad()
  notify()
}
