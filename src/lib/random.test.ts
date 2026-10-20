import { describe, expect, it } from 'vitest'
import { pickIndexAvoiding } from './random'

describe('pickIndexAvoiding', () => {
  it('nunca repete o índice anterior em 10.000 sorteios seguidos', () => {
    let previous: number | null = null
    for (let i = 0; i < 10_000; i++) {
      const next = pickIndexAvoiding(5, previous)
      expect(next).not.toBe(previous)
      expect(next).toBeGreaterThanOrEqual(0)
      expect(next).toBeLessThan(5)
      previous = next
    }
  })

  it('alcança todos os outros índices (não fica preso em um subconjunto)', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 2_000; i++) seen.add(pickIndexAvoiding(4, 2))
    expect([...seen].sort()).toEqual([0, 1, 3])
  })

  it('pula o anterior nas bordas do sorteio', () => {
    // rng = 0 escolhe o primeiro candidato; rng ≈ 1 escolhe o último.
    expect(pickIndexAvoiding(3, 0, () => 0)).toBe(1)
    expect(pickIndexAvoiding(3, 2, () => 0.999)).toBe(1)
    expect(pickIndexAvoiding(3, 1, () => 0.999)).toBe(2)
  })

  it('sem anterior (ou anterior inválido), sorteia em toda a lista', () => {
    expect(pickIndexAvoiding(3, null, () => 0)).toBe(0)
    expect(pickIndexAvoiding(3, 7, () => 0.999)).toBe(2)
  })

  it('lista de um item sempre devolve 0; lista vazia é erro', () => {
    expect(pickIndexAvoiding(1, 0)).toBe(0)
    expect(() => pickIndexAvoiding(0, null)).toThrow()
  })
})
