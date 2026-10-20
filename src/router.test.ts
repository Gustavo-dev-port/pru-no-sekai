import { describe, expect, it } from 'vitest'
import { MODULES } from './data/modules'
import { hrefFor, parseHash } from './router'

describe('parseHash', () => {
  it.each([
    ['', 'santuario'],
    ['#', 'santuario'],
    ['#/', 'santuario'],
    ['#/oraculo', 'oraculo'],
    ['#/alimentar', 'alimentar'],
    ['#/correio', 'correio'],
  ])('%j → %s', (hash, expected) => {
    expect(parseHash(hash)).toBe(expected)
  })

  it('rota desconhecida cai no santuário', () => {
    expect(parseHash('#/nao-existe')).toBe('santuario')
    expect(parseHash('#/ORACULO')).toBe('santuario')
  })
})

describe('hrefFor', () => {
  it('ida e volta: hrefFor → parseHash devolve o mesmo módulo', () => {
    for (const m of MODULES) {
      expect(parseHash(hrefFor(m.id))).toBe(m.id)
    }
  })

  it('cada módulo tem rota única', () => {
    const paths = MODULES.map((m) => m.path)
    expect(new Set(paths).size).toBe(paths.length)
  })
})
