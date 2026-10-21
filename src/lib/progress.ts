import { useSyncExternalStore } from 'react'

// Progresso do álbum de cartas, guardado SÓ neste aparelho (localStorage).
// Nada pessoal: só quais cartas foram abertas/vistas, quantas vezes algum
// pombo foi cutucado e quais módulos foram visitados. Nada sai do navegador.
// Se o armazenamento não estiver disponível (aba privada etc.), o progresso
// vive só enquanto a página estiver aberta.

export interface Progress {
  /** Cartas já abertas (lidas), em ordem de abertura. */
  opened: number[]
  /** Cartas desbloqueadas que já apareceram no álbum (as outras são "novas"). */
  seen: number[]
  /** Quantas vezes algum pombo do site foi cutucado. */
  pokes: number
  /** Módulos visitados (ids de src/data/modules.ts). */
  visited: string[]
}

const STORAGE_KEY = 'pru:correio:v1'
const EMPTY: Progress = { opened: [], seen: [], pokes: 0, visited: [] }

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const data = JSON.parse(raw) as Partial<Progress>
    const ids = (v: unknown) => (Array.isArray(v) ? v.filter((n): n is number => Number.isInteger(n)) : [])
    return {
      opened: ids(data.opened),
      seen: ids(data.seen),
      pokes: Number.isInteger(data.pokes) ? (data.pokes as number) : 0,
      visited: Array.isArray(data.visited) ? data.visited.filter((s): s is string => typeof s === 'string') : [],
    }
  } catch {
    return EMPTY
  }
}

let state: Progress = load()
const listeners = new Set<() => void>()

function update(next: Progress) {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* sem armazenamento: segue só em memória */
  }
  listeners.forEach((l) => l())
}

export function getProgress(): Progress {
  return state
}

export function subscribeProgress(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribeProgress, getProgress, getProgress)
}

export function recordPoke() {
  update({ ...state, pokes: state.pokes + 1 })
}

export function recordVisit(moduleId: string) {
  if (state.visited.includes(moduleId)) return
  update({ ...state, visited: [...state.visited, moduleId] })
}

export function markOpened(letterId: number) {
  if (state.opened.includes(letterId)) return
  update({ ...state, opened: [...state.opened, letterId] })
}

export function markSeen(letterIds: readonly number[]) {
  const fresh = letterIds.filter((id) => !state.seen.includes(id))
  if (fresh.length === 0) return
  update({ ...state, seen: [...state.seen, ...fresh] })
}

/** Zera o álbum (botão "recomeçar coleção" e testes). */
export function resetProgress() {
  update(EMPTY)
}
