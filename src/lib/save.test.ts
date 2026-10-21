import { describe, expect, it } from 'vitest'
import { initialEconomy } from '../economy/farm'
import { getProgress } from './progress'
import { getSave, LEGACY_MAIL_KEY, migrate, reloadSaveForTests, SAVE_KEY, SCHEMA_VERSION, updateSave } from './save'

const T0 = 1_700_000_000_000
const legacyMail = { opened: [1, 2, 4], seen: [1, 2, 4, 3], pokes: 2, visited: ['correio', 'oraculo'] }

describe('migração do save', () => {
  it('v1 → v2: traz o progresso do Correio e começa a fazenda do zero', () => {
    const save = migrate(null, legacyMail, T0)
    expect(save.schemaVersion).toBe(SCHEMA_VERSION)
    expect(save.mail).toEqual(legacyMail)
    expect(save.economy).toEqual(initialEconomy())
  })

  it('save v2 existente tem prioridade sobre a chave antiga', () => {
    const v2 = { schemaVersion: 2, mail: { opened: [9], seen: [9], pokes: 0, visited: [] }, economy: initialEconomy() }
    expect(migrate(v2, legacyMail, T0).mail.opened).toEqual([9])
  })

  it('sem nada salvo: tudo do zero', () => {
    const save = migrate(null, null, T0)
    expect(save.mail).toEqual({ opened: [], seen: [], pokes: 0, visited: [] })
  })
})

describe('proteção do progresso do Correio', () => {
  it('ao abrir o site com só o save antigo, o Correio continua igual e a chave antiga NÃO é tocada', () => {
    const legacyText = JSON.stringify(legacyMail)
    localStorage.clear()
    localStorage.setItem(LEGACY_MAIL_KEY, legacyText)
    reloadSaveForTests()

    expect(getProgress()).toEqual(legacyMail)
    // migração gravada no formato novo...
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)!).mail).toEqual(legacyMail)
    // ...e a chave antiga fica exatamente como estava (cópia de segurança)
    expect(localStorage.getItem(LEGACY_MAIL_KEY)).toBe(legacyText)

    // mexer na fazenda não apaga nada do Correio
    updateSave((s) => ({ ...s, economy: { ...s.economy, tutorialDone: true } }))
    expect(getProgress()).toEqual(legacyMail)
    expect(localStorage.getItem(LEGACY_MAIL_KEY)).toBe(legacyText)
  })

  it('save corrompido não derruba o site nem apaga a chave antiga', () => {
    localStorage.clear()
    localStorage.setItem(SAVE_KEY, '{isso não é json')
    localStorage.setItem(LEGACY_MAIL_KEY, JSON.stringify(legacyMail))
    expect(() => reloadSaveForTests()).not.toThrow()
    expect(getProgress()).toEqual(legacyMail)
    expect(localStorage.getItem(LEGACY_MAIL_KEY)).not.toBeNull()
  })

  it('o progresso sobrevive a recarregar a página', () => {
    updateSave((s) => ({ ...s, economy: { ...s.economy, food: { milho: 7, arroz: 0, girassol: 0 } } }))
    reloadSaveForTests()
    expect(getSave().economy.food.milho).toBe(7)
  })

  it('outra aba salvou algo novo: a alteração seguinte parte do valor salvo, não do antigo em memória', () => {
    updateSave((s) => ({ ...s, economy: { ...s.economy, food: { milho: 1, arroz: 0, girassol: 0 } } }))
    // "outra aba" grava direto no armazenamento
    const other = JSON.parse(localStorage.getItem(SAVE_KEY)!)
    other.economy.food.milho = 50
    localStorage.setItem(SAVE_KEY, JSON.stringify(other))
    updateSave((s) => ({ ...s, economy: { ...s.economy, food: { ...s.economy.food, arroz: 1 } } }))
    expect(getSave().economy.food).toEqual({ milho: 50, arroz: 1, girassol: 0 })
  })
})
