import { describe, expect, it } from 'vitest'
import { getProgress, markOpened, markSeen, recordPoke, recordVisit, resetProgress } from './progress'

const stored = () => JSON.parse(localStorage.getItem('pru:correio:v1') ?? 'null')

describe('progresso do álbum (só no aparelho)', () => {
  it('começa vazio', () => {
    expect(getProgress()).toEqual({ opened: [], seen: [], pokes: 0, visited: [] })
  })

  it('registra e guarda no localStorage', () => {
    recordPoke()
    recordPoke()
    recordVisit('oraculo')
    markOpened(1)
    markSeen([1, 2])
    expect(getProgress()).toEqual({ opened: [1], seen: [1, 2], pokes: 2, visited: ['oraculo'] })
    expect(stored()).toEqual(getProgress())
  })

  it('não duplica cartas abertas, vistas nem visitas', () => {
    markOpened(3)
    markOpened(3)
    markSeen([3])
    markSeen([3])
    recordVisit('correio')
    recordVisit('correio')
    expect(getProgress().opened).toEqual([3])
    expect(getProgress().seen).toEqual([3])
    expect(getProgress().visited).toEqual(['correio'])
  })

  it('recomeçar zera tudo', () => {
    markOpened(1)
    resetProgress()
    expect(getProgress().opened).toEqual([])
  })
})
