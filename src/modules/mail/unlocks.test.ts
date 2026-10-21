import { describe, expect, it } from 'vitest'
import { LETTER_UNLOCK_RULES, LOVE_LETTERS, UNLOCK_HINTS } from '../../data/loveLetters'
import type { Progress } from '../../lib/progress'
import { LETTER_ICONS } from '../../pixel/sprites/mail'
import { newlyUnlocked, unlockedIds } from './unlocks'

const progress = (p: Partial<Progress> = {}): Progress => ({ opened: [], seen: [], pokes: 0, visited: [], ...p })

describe('Coleção 01 do Correio', () => {
  it('tem as 10 cartas, com 4 comuns, 3 raras e 3 lendárias', () => {
    expect(LOVE_LETTERS.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    const count = (r: string) => LOVE_LETTERS.filter((l) => l.rarity === r).length
    expect([count('comum'), count('rara'), count('lendaria')]).toEqual([4, 3, 3])
  })

  it('toda carta tem regra, toda regra tem dica e todo ícone tem versão pixel', () => {
    for (const letter of LOVE_LETTERS) {
      const rule = LETTER_UNLOCK_RULES.find((r) => r.letterId === letter.id)
      expect(rule, `regra da carta ${letter.id}`).toBeDefined()
      expect(UNLOCK_HINTS[rule!.condition], `dica de ${rule!.condition}`).toBeTruthy()
      expect(LETTER_ICONS[letter.icon], `ícone ${letter.icon}`).toBeDefined()
    }
  })
})

describe('regras de descoberta', () => {
  it('na primeira visita só a carta 1 está disponível', () => {
    expect(unlockedIds(progress())).toEqual([1])
  })

  it('comuns aparecem primeiro: abrir 1 → carta 2; abrir 2 → carta 4', () => {
    expect(unlockedIds(progress({ opened: [1] }))).toEqual([1, 2])
    expect(unlockedIds(progress({ opened: [1, 2] }))).toEqual([1, 2, 4])
  })

  it('cutucar pombos 3 vezes → carta 8', () => {
    expect(unlockedIds(progress({ pokes: 2 }))).not.toContain(8)
    expect(unlockedIds(progress({ pokes: 3 }))).toContain(8)
  })

  it('raras: 3 comuns abertas → 3; visitar o Oráculo → 6; 5 cartas abertas → 9', () => {
    expect(unlockedIds(progress({ opened: [1, 2, 4] }))).toContain(3)
    expect(unlockedIds(progress({ visited: ['oraculo'] }))).toContain(6)
    expect(unlockedIds(progress({ opened: [1, 2, 4, 3, 8] }))).toContain(9)
  })

  it('lendárias: 2 raras abertas → 5; 7 cartas abertas → 7', () => {
    expect(unlockedIds(progress({ opened: [3, 6] }))).toContain(5)
    expect(unlockedIds(progress({ opened: [1, 2, 3, 4, 6, 8, 9] }))).toContain(7)
  })

  it('a carta 10 só chega com as outras 9 encontradas', () => {
    const almost = progress({ opened: [1, 2, 3, 4, 5, 9, 7], pokes: 3 }) // falta a 6 (Oráculo)
    expect(unlockedIds(almost)).not.toContain(10)
    expect(unlockedIds({ ...almost, visited: ['oraculo'] })).toContain(10)
  })

  it('a coleção inteira é alcançável jogando: abrir o que chega + cutucar + visitar o Oráculo', () => {
    let p = progress({ pokes: 3, visited: ['oraculo'] })
    for (let step = 0; step < 20; step++) {
      const next = unlockedIds(p).find((id) => !p.opened.includes(id))
      if (next === undefined) break
      p = { ...p, opened: [...p.opened, next] }
    }
    expect(p.opened.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('"novas" são as desbloqueadas que ainda não apareceram no álbum', () => {
    expect(newlyUnlocked(progress({ opened: [1], seen: [1] }))).toEqual([2])
    expect(newlyUnlocked(progress({ opened: [1], seen: [1, 2] }))).toEqual([])
  })
})
