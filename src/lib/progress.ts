// Progresso do Correio (cartas abertas/vistas, cutucadas, visitas).
// Desde a Entrega 07 fica dentro do save único (src/lib/save.ts, seção
// "mail"); o formato e as funções continuam os mesmos da Entrega 06.
import { getSave, subscribeSave, updateSave, useSave, type MailProgress } from './save'

export type Progress = MailProgress

export function getProgress(): Progress {
  return getSave().mail
}

export const subscribeProgress = subscribeSave

export function useProgress(): Progress {
  return useSave((s) => s.mail)
}

const updateMail = (change: (mail: Progress) => Progress) => updateSave((s) => ({ ...s, mail: change(s.mail) }))

export function recordPoke() {
  updateMail((m) => ({ ...m, pokes: m.pokes + 1 }))
}

export function recordVisit(moduleId: string) {
  if (getProgress().visited.includes(moduleId)) return
  updateMail((m) => (m.visited.includes(moduleId) ? m : { ...m, visited: [...m.visited, moduleId] }))
}

export function markOpened(letterId: number) {
  if (getProgress().opened.includes(letterId)) return
  updateMail((m) => (m.opened.includes(letterId) ? m : { ...m, opened: [...m.opened, letterId] }))
}

export function markSeen(letterIds: readonly number[]) {
  if (letterIds.every((id) => getProgress().seen.includes(id))) return
  updateMail((m) => {
    const fresh = letterIds.filter((id) => !m.seen.includes(id))
    return fresh.length ? { ...m, seen: [...m.seen, ...fresh] } : m
  })
}

/** Zera só o Correio (testes). */
export function resetProgress() {
  updateMail(() => ({ opened: [], seen: [], pokes: 0, visited: [] }))
}
