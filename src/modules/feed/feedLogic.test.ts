import { describe, expect, it } from 'vitest'
import { FEED_STAGES, FRONT_ROW_Y, INVASION_AT, INVASION_SLOTS, MAIN_SLOTS } from '../../data/feedGame'
import { announcementFor, eventBetween, isInvasion, pickTarget, pigeonsFor, stageFor } from './feedLogic'

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

  it('todos os pombos ficam dentro da praça e abaixo da plaquinha', () => {
    for (const slot of [...MAIN_SLOTS, ...INVASION_SLOTS]) {
      expect(slot.x).toBeGreaterThanOrEqual(0)
      expect(slot.x).toBeLessThanOrEqual(100)
      expect(slot.y).toBeGreaterThanOrEqual(55)
      expect(slot.y).toBeLessThanOrEqual(97)
    }
  })

  it('AUD-004-02: na invasão, os grãos só vão para pombos da fileira da frente', () => {
    const crowd = pigeonsFor(INVASION_AT)
    for (let r = 0; r < 1; r += 0.01) {
      expect(crowd[pickTarget(crowd, new Set(), () => r)].y).toBeGreaterThanOrEqual(FRONT_ROW_Y)
    }
  })

  it('AUD-004-02: prefere um pombo que não está bicando; se todos estão, usa um visível', () => {
    const three = pigeonsFor(6)
    expect(pickTarget(three, new Set([0, 1]), () => 0)).toBe(2)
    expect([0, 1, 2]).toContain(pickTarget(three, new Set([0, 1, 2]), () => 0.5))
  })

  it('anúncio: diz a fala e quantos pombos há', () => {
    expect(announcementFor('stage', 3, 'Oi.')).toBe('Oi. 2 pombos reunidos.')
    expect(announcementFor('stage', 1, 'Oi.')).toBe('Oi. 1 pombo reunido.')
    expect(announcementFor('invasion', INVASION_AT, 'Socorro.')).toBe('Invasão dos pombos! Socorro. Agora são 26 pombos reunidos.')
  })
})
