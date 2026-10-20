import { describe, expect, it } from 'vitest'
import { FEED_STAGES, INVASION_AT, INVASION_SLOTS, MAIN_SLOTS } from '../../data/feedGame'
import { eventBetween, isInvasion, pigeonsFor, stageFor } from './feedLogic'

describe('regras do Alimente o Pombo', () => {
  it('começa com 1 pombo e a progressão nunca diminui até a invasão', () => {
    expect(pigeonsFor(0)).toHaveLength(1)
    let previous = 0
    for (let g = 0; g < INVASION_AT; g++) {
      const count = pigeonsFor(g).length
      expect(count).toBeGreaterThanOrEqual(previous)
      previous = count
    }
  })

  it('segue as etapas: 1 → 2 → 3 → 5 → 8 pombos', () => {
    expect([0, 3, 6, 10, 15].map((g) => pigeonsFor(g).length)).toEqual([1, 2, 3, 5, 8])
    expect(pigeonsFor(INVASION_AT - 1)).toHaveLength(8)
  })

  it('a invasão começa no limite e traz todos os pombos', () => {
    expect(isInvasion(INVASION_AT - 1)).toBe(false)
    expect(isInvasion(INVASION_AT)).toBe(true)
    expect(pigeonsFor(INVASION_AT)).toHaveLength(MAIN_SLOTS.length + INVASION_SLOTS.length)
    expect(pigeonsFor(INVASION_AT + 50)).toHaveLength(MAIN_SLOTS.length + INVASION_SLOTS.length)
  })

  it('eventos: só anuncia mudanças de etapa e a invasão', () => {
    expect(eventBetween(0, 1)).toBe('stage')
    expect(eventBetween(1, 2)).toBe(null)
    expect(eventBetween(2, 3)).toBe('stage')
    expect(eventBetween(INVASION_AT - 1, INVASION_AT)).toBe('invasion')
    expect(eventBetween(INVASION_AT, INVASION_AT + 1)).toBe(null)
  })

  it('etapas em ordem e com o grupo principal suficiente', () => {
    FEED_STAGES.forEach((stage, i) => {
      if (i > 0) expect(stage.minGrains).toBeGreaterThan(FEED_STAGES[i - 1].minGrains)
      expect(stage.pigeons).toBeLessThanOrEqual(MAIN_SLOTS.length)
    })
    expect(stageFor(0)).toBe(FEED_STAGES[0])
  })

  it('todos os pombos ficam dentro da praça', () => {
    for (const slot of [...MAIN_SLOTS, ...INVASION_SLOTS]) {
      expect(slot.x).toBeGreaterThanOrEqual(0)
      expect(slot.x).toBeLessThanOrEqual(100)
      expect(slot.y).toBeGreaterThan(35) // abaixo da plaquinha
      expect(slot.y).toBeLessThanOrEqual(100)
    }
  })
})
