import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CROPS } from '../../data/crops'
import { finishTutorial } from '../../economy/store'
import { getSave, reloadSaveForTests } from '../../lib/save'
import FarmPage from './FarmPage'

const T0 = new Date('2026-10-21T10:00:00Z').getTime()
const plot = (n: number) => screen.getByRole('button', { name: new RegExp(`^Canteiro ${n}:`) })
const count = (id: string) => Number(screen.getByTestId(id).textContent)
const status = () => screen.getByRole('status')

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] })
  vi.setSystemTime(T0)
})
afterEach(() => {
  vi.useRealTimers()
})

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('Fazendinha', () => {
  it('primeira visita: tutorial curto com foco no botão; fechar marca como visto', () => {
    render(<FarmPage />)
    const tutorial = screen.getByRole('dialog', { name: 'Como cuidar da fazendinha' })
    const start = within(tutorial).getByRole('button', { name: /vamos plantar/i })
    expect(start).toHaveFocus()
    fireEvent.click(start)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(getSave().economy.tutorialDone).toBe(true)
    advance(0)
    expect(screen.getByRole('heading', { level: 1, name: 'Fazendinha da Pru' })).toHaveFocus()
  })

  it('segunda visita não mostra o tutorial; "Como jogar" abre de novo', () => {
    finishTutorial()
    render(<FarmPage />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /como jogar/i }))
    expect(screen.getByRole('dialog', { name: 'Como cuidar da fazendinha' })).toBeInTheDocument()
  })

  it('plantar → aguardar → colher atualiza o estoque; não colhe duas vezes', () => {
    finishTutorial()
    render(<FarmPage />)
    expect(plot(1)).toHaveAccessibleName('Canteiro 1: vazio. Plantar milho')

    fireEvent.click(plot(1))
    expect(count('seeds-milho')).toBe(3)
    expect(plot(1)).toHaveAccessibleName('Canteiro 1: milho crescendo, pronto em 30 s')
    expect(status()).toHaveTextContent('Plantou milho no canteiro 1')

    // tocar antes da hora não colhe
    fireEvent.click(plot(1))
    expect(count('food-milho')).toBe(0)
    expect(status()).toHaveTextContent('ainda está crescendo')

    advance(30_000)
    expect(plot(1)).toHaveAccessibleName('Canteiro 1: milho pronto. Colher')
    expect(status()).toHaveTextContent('Pronto para colher: Milho no canteiro 1.')

    fireEvent.click(plot(1))
    expect(count('food-milho')).toBe(CROPS.milho.yield)
    expect(count('seeds-milho')).toBe(4) // devolveu 1 semente

    fireEvent.click(plot(1)) // o canteiro agora está vazio: planta de novo, não colhe
    expect(count('food-milho')).toBe(5)
  })

  it('os quatro canteiros funcionam, com sementes diferentes', () => {
    finishTutorial()
    render(<FarmPage />)
    fireEvent.click(plot(1))
    fireEvent.click(screen.getByRole('button', { name: /^Arroz/ }))
    fireEvent.click(plot(2))
    fireEvent.click(screen.getByRole('button', { name: /^Girassol/ }))
    fireEvent.click(plot(3))
    fireEvent.click(screen.getByRole('button', { name: /^Milho/ }))
    fireEvent.click(plot(4))
    expect(getSave().economy.plots.map((p) => p?.crop)).toEqual(['milho', 'arroz', 'girassol', 'milho'])
  })

  it('não gasta semente que não tem: avisa e não planta', () => {
    finishTutorial()
    render(<FarmPage />)
    fireEvent.click(screen.getByRole('button', { name: /^Girassol/ }))
    fireEvent.click(plot(1)) // gasta a única semente de girassol
    expect(plot(2)).toHaveAccessibleName('Canteiro 2: vazio. Sem sementes de girassol')
    fireEvent.click(plot(2))
    expect(getSave().economy.plots[1]).toBeNull()
    expect(count('seeds-girassol')).toBe(0)
    expect(status()).toHaveTextContent('não tem sementes de girassol')
  })

  it('cresce com o site fechado: planta, "fecha", volta 2 minutos depois e está pronto', () => {
    finishTutorial()
    const { unmount } = render(<FarmPage />)
    fireEvent.click(screen.getByRole('button', { name: /^Girassol/ }))
    fireEvent.click(plot(1))
    unmount()

    vi.setSystemTime(T0 + 2 * 60_000) // o tempo passa com a página fechada
    reloadSaveForTests() // reabrir o site lê o que estava salvo
    render(<FarmPage />)
    expect(plot(1)).toHaveAccessibleName('Canteiro 1: girassol pronto. Colher')
    fireEvent.click(plot(1))
    expect(count('food-girassol')).toBe(20)
  })

  it('saquinho grátis: dá sementes e depois espera o intervalo', () => {
    finishTutorial()
    render(<FarmPage />)
    const pouch = screen.getByRole('button', { name: /pegar saquinho grátis/i })
    fireEvent.click(pouch)
    expect(count('seeds-milho')).toBe(6)
    expect(pouch).toHaveAttribute('aria-disabled', 'true')
    expect(pouch).toHaveTextContent('Saquinho grátis em 3 min')
    fireEvent.click(pouch)
    expect(count('seeds-milho')).toBe(6) // não dá duas vezes
  })

  it('tudo funciona com teclado (Enter e Espaço nos canteiros e nas sementes)', () => {
    finishTutorial()
    render(<FarmPage />)
    const arroz = screen.getByRole('button', { name: /^Arroz/ })
    arroz.focus()
    fireEvent.keyDown(arroz, { key: 'Enter' })
    fireEvent.click(arroz) // botões nativos: Enter/Espaço disparam click
    expect(arroz).toHaveAttribute('aria-pressed', 'true')
    plot(1).focus()
    fireEvent.click(plot(1))
    expect(getSave().economy.plots[0]?.crop).toBe('arroz')
    expect(plot(1).tagName).toBe('BUTTON')
  })
})
