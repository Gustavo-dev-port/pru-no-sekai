import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CROPS } from '../../data/crops'
import { finishTutorial } from '../../economy/store'
import { flushSaves, getSave, reloadSaveForTests, SAVE_KEY } from '../../lib/save'
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

/** Toca e espera a ação protegida (Web Lock, assíncrona) terminar. */
async function tap(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element)
    await flushSaves()
  })
}

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

  it('plantar → aguardar → colher atualiza o estoque; não colhe duas vezes', async () => {
    finishTutorial()
    render(<FarmPage />)
    expect(plot(1)).toHaveAccessibleName('Canteiro 1: vazio. Plantar milho')

    await tap(plot(1))
    expect(count('seeds-milho')).toBe(3)
    expect(plot(1)).toHaveAccessibleName('Canteiro 1: milho crescendo, pronto em 30 s')
    expect(status()).toHaveTextContent('Plantou milho no canteiro 1')

    // tocar antes da hora não colhe
    await tap(plot(1))
    expect(count('food-milho')).toBe(0)
    expect(status()).toHaveTextContent('ainda está crescendo')

    advance(30_000)
    expect(plot(1)).toHaveAccessibleName('Canteiro 1: milho pronto. Colher')
    expect(status()).toHaveTextContent('Pronto para colher: Milho no canteiro 1.')

    await tap(plot(1))
    expect(count('food-milho')).toBe(CROPS.milho.yield)
    expect(count('seeds-milho')).toBe(4) // devolveu 1 semente

    await tap(plot(1)) // o canteiro agora está vazio: planta de novo, não colhe
    expect(count('food-milho')).toBe(5)
  })

  it('toque duplo rápido no mesmo canteiro pronto: colhe uma vez só', async () => {
    finishTutorial()
    render(<FarmPage />)
    await tap(plot(1))
    advance(30_000)
    const ready = plot(1)
    await act(async () => {
      fireEvent.click(ready)
      fireEvent.click(ready) // segundo toque antes do primeiro terminar: ignorado
      await flushSaves()
    })
    expect(count('food-milho')).toBe(CROPS.milho.yield)
    expect(status()).toHaveTextContent('Colheu')
  })

  it('o foco continua no canteiro tocado depois da ação', async () => {
    finishTutorial()
    render(<FarmPage />)
    plot(2).focus()
    await tap(plot(2))
    expect(plot(2)).toHaveFocus()
  })

  it('os quatro canteiros funcionam, com sementes diferentes', async () => {
    finishTutorial()
    render(<FarmPage />)
    await tap(plot(1))
    fireEvent.click(screen.getByRole('button', { name: /^Arroz/ }))
    await tap(plot(2))
    fireEvent.click(screen.getByRole('button', { name: /^Girassol/ }))
    await tap(plot(3))
    fireEvent.click(screen.getByRole('button', { name: /^Milho/ }))
    await tap(plot(4))
    expect(getSave().economy.plots.map((p) => p?.crop)).toEqual(['milho', 'arroz', 'girassol', 'milho'])
  })

  it('não gasta semente que não tem: avisa e não planta', async () => {
    finishTutorial()
    render(<FarmPage />)
    fireEvent.click(screen.getByRole('button', { name: /^Girassol/ }))
    await tap(plot(1)) // gasta a única semente de girassol
    expect(plot(2)).toHaveAccessibleName('Canteiro 2: vazio. Sem sementes de girassol')
    await tap(plot(2))
    expect(getSave().economy.plots[1]).toBeNull()
    expect(count('seeds-girassol')).toBe(0)
    expect(status()).toHaveTextContent('não tem sementes de girassol')
  })

  it('cresce com o site fechado: planta, "fecha", volta 2 minutos depois e está pronto', async () => {
    finishTutorial()
    const { unmount } = render(<FarmPage />)
    fireEvent.click(screen.getByRole('button', { name: /^Girassol/ }))
    await tap(plot(1))
    unmount()

    vi.setSystemTime(T0 + 2 * 60_000) // o tempo passa com a página fechada
    reloadSaveForTests() // reabrir o site lê o que estava salvo
    render(<FarmPage />)
    expect(plot(1)).toHaveAccessibleName('Canteiro 1: girassol pronto. Colher')
    await tap(plot(1))
    expect(count('food-girassol')).toBe(20)
  })

  it('saquinho grátis: dá sementes e depois espera o intervalo', async () => {
    finishTutorial()
    render(<FarmPage />)
    const pouch = screen.getByRole('button', { name: /pegar saquinho grátis/i })
    await tap(pouch)
    expect(count('seeds-milho')).toBe(6)
    expect(pouch).toHaveAttribute('aria-disabled', 'true')
    expect(pouch).toHaveTextContent('Saquinho grátis em 3 min')
    await tap(pouch)
    expect(count('seeds-milho')).toBe(6) // não dá duas vezes
  })

  it('tudo funciona com teclado (Enter e Espaço nos canteiros e nas sementes)', async () => {
    finishTutorial()
    render(<FarmPage />)
    const arroz = screen.getByRole('button', { name: /^Arroz/ })
    arroz.focus()
    fireEvent.keyDown(arroz, { key: 'Enter' })
    fireEvent.click(arroz) // botões nativos: Enter/Espaço disparam click
    expect(arroz).toHaveAttribute('aria-pressed', 'true')
    plot(1).focus()
    await tap(plot(1))
    expect(getSave().economy.plots[0]?.crop).toBe('arroz')
    expect(plot(1).tagName).toBe('BUTTON')
  })

  it('navegador sem Web Locks: avisa que não dá para proteger e não altera nada', async () => {
    reloadSaveForTests({ locks: null })
    finishTutorial()
    render(<FarmPage />)
    await tap(plot(1))
    expect(getSave().economy.plots[0]).toBeNull()
    expect(count('seeds-milho')).toBe(4)
    expect(status()).toHaveTextContent('não consegue proteger a fazendinha entre abas')
  })

  it('save de versão mais nova: aviso de somente leitura e nada é gravado', async () => {
    const future = JSON.stringify({ schemaVersion: 3, mail: {}, economy: { tutorialDone: true } })
    localStorage.setItem(SAVE_KEY, future)
    reloadSaveForTests()
    render(<FarmPage />)
    expect(screen.getByRole('note')).toHaveTextContent('versão mais nova')
    await tap(plot(1))
    expect(status()).toHaveTextContent('só para olhar')
    expect(localStorage.getItem(SAVE_KEY)).toBe(future)
  })
})
