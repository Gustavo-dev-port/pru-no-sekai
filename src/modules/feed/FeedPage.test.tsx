import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FEED_STAGES, INVASION_AT, INVASION_MESSAGES, RESET_MESSAGE } from '../../data/feedGame'
import { setReducedMotion } from '../../test/setup'
import FeedPage, { GRAIN_LIFETIME_MS, GRAIN_TIMELINE, INVASION_SHOCK_MS } from './FeedPage'

const count = (id: string) => Number(screen.getByTestId(id).textContent)
const bubble = () => document.querySelector('.feed__message')!
const status = () => screen.getByRole('status')

async function setup() {
  setReducedMotion(true)
  const user = userEvent.setup()
  render(<FeedPage />)
  const throwButton = screen.getByRole('button', { name: /jogar grãozinho/i })
  const feed = async (times: number) => {
    for (let i = 0; i < times; i++) await user.click(throwButton)
  }
  return { user, feed, throwButton }
}

describe('Alimente o Pombo', () => {
  it('abre com o título focado, 1 pombo, 0 grãos e a fala inicial', async () => {
    await setup()
    expect(screen.getByRole('heading', { level: 1, name: 'Alimente o Pombo' })).toHaveFocus()
    expect(count('grain-count')).toBe(0)
    expect(count('pigeon-count')).toBe(1)
    expect(bubble()).toHaveTextContent(FEED_STAGES[0].message)
    // o balão em si não é aria-live: quem anuncia é a região de status
    expect(document.querySelector('.feed__bubble')).not.toHaveAttribute('aria-live')
    expect(status()).toHaveTextContent('')
  })

  it('cada grão soma no contador e faz um pombo bicar', async () => {
    const { feed } = await setup()
    await feed(1)
    expect(count('grain-count')).toBe(1)
    expect(document.querySelectorAll('.feed-grain')).toHaveLength(1)
  })

  it('mais pombos chegam conforme os grãos, com uma fala nova a cada etapa', async () => {
    const { feed } = await setup()
    await feed(3)
    expect(count('pigeon-count')).toBe(2)
    expect(bubble()).toHaveTextContent(FEED_STAGES[2].message)
    await feed(12) // 15 grãos
    expect(count('pigeon-count')).toBe(8)
    expect(bubble()).toHaveTextContent(FEED_STAGES[5].message)
  })

  it('a invasão acontece no limite: muitos pombos, faixa e frase cômica', async () => {
    const { feed } = await setup()
    await feed(INVASION_AT)
    expect(count('pigeon-count')).toBeGreaterThan(20)
    expect(document.querySelector('.feed-arena__banner')).toHaveTextContent('INVASÃO!')
    expect(INVASION_MESSAGES.some((m) => bubble().textContent!.includes(m))).toBe(true)
  })

  it('recomeçar volta tudo ao início e mantém o foco no botão', async () => {
    const { feed, user } = await setup()
    await feed(INVASION_AT + 2)
    const reset = screen.getByRole('button', { name: /recomeçar/i })
    await user.click(reset)
    expect(count('grain-count')).toBe(0)
    expect(count('pigeon-count')).toBe(1)
    expect(document.querySelector('.feed-arena__banner')).toBeNull()
    expect(bubble()).toHaveTextContent(RESET_MESSAGE)
    expect(reset).toHaveFocus()
    expect(reset).toHaveAttribute('aria-disabled', 'true')
  })

  it('recomeçar com 0 grãos não faz nada (e não perde o foco)', async () => {
    const { user } = await setup()
    const reset = screen.getByRole('button', { name: /recomeçar/i })
    await user.click(reset)
    expect(bubble()).toHaveTextContent(FEED_STAGES[0].message)
    expect(reset).toHaveFocus()
  })

  it('toques em rajada (antes de a tela atualizar) contam todos', async () => {
    const { throwButton } = await setup()
    act(() => {
      for (let i = 0; i < INVASION_AT; i++) throwButton.click()
    })
    expect(count('grain-count')).toBe(INVASION_AT)
    expect(document.querySelector('.feed-arena__banner')).not.toBeNull()
  })

  it('funciona só com teclado', async () => {
    const { user, throwButton } = await setup()
    throwButton.focus()
    await user.keyboard('{Enter}{Enter} ')
    expect(count('grain-count')).toBe(3)
  })

  it('a praça é decorativa: o estado é dito em texto, não pelo desenho', async () => {
    await setup()
    expect(document.querySelector('.feed-arena')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('Alimente o Pombo — Entrega 05', () => {
  it('bicada: o grão cai, some quando o bico chega (com "nhac!") e o pombo volta ao normal', () => {
    vi.useFakeTimers()
    try {
      render(<FeedPage />)
      act(() => screen.getByRole('button', { name: /jogar grãozinho/i }).click())
      expect(document.querySelectorAll('.feed-grain')).toHaveLength(1)
      expect(document.querySelector('.feed-nhac')).toBeNull()

      const reachAt = GRAIN_TIMELINE.find(([phase]) => phase === 'reach')![1]
      act(() => vi.advanceTimersByTime(reachAt))
      expect(document.querySelectorAll('.feed-grain')).toHaveLength(0)
      expect(document.querySelector('.feed-nhac')).toHaveTextContent('nhac!')

      act(() => vi.advanceTimersByTime(GRAIN_LIFETIME_MS + 600))
      expect(document.querySelector('.feed-nhac')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('AUD-004-01: recomeçar no meio de várias animações cancela todos os temporizadores', () => {
    setReducedMotion(true) // sem relógios de sprite: só os temporizadores do jogo contam
    vi.useFakeTimers()
    try {
      render(<FeedPage />)
      const throwButton = screen.getByRole('button', { name: /jogar grãozinho/i })
      act(() => {
        for (let i = 0; i < INVASION_AT; i++) throwButton.click()
      })
      act(() => vi.advanceTimersByTime(200)) // grãos no meio da bicada, invasão acontecendo
      expect(vi.getTimerCount()).toBeGreaterThan(0)

      act(() => screen.getByRole('button', { name: /recomeçar/i }).click())
      expect(vi.getTimerCount()).toBe(0)

      act(() => vi.advanceTimersByTime(5000))
      expect(count('grain-count')).toBe(0)
      expect(count('pigeon-count')).toBe(1)
      expect(document.querySelectorAll('.feed-grain, .feed-nhac, .feed-hearts, .pigeon__exclaim')).toHaveLength(0)
      expect(bubble()).toHaveTextContent(RESET_MESSAGE)
    } finally {
      vi.useRealTimers()
    }
  })

  it('AUD-004-03: a invasão é anunciada em texto, com a quantidade de pombos', async () => {
    const { feed } = await setup()
    await feed(INVASION_AT)
    expect(status()).toHaveTextContent(/invasão dos pombos/i)
    expect(status()).toHaveTextContent('26 pombos reunidos')
  })

  it('AUD-004-03: cliques seguidos sem mudança de etapa não geram novos anúncios', async () => {
    const { feed } = await setup()
    await feed(3) // etapa nova: 2 pombos
    const announced = status().textContent
    expect(announced).toContain('2 pombos reunidos')
    await feed(2) // 4 e 5 grãos: mesma etapa
    expect(status().textContent).toBe(announced)
  })

  it('nova etapa: o pombo que chegou ganha corações e "+1 pombo!"', async () => {
    const { feed } = await setup()
    await feed(3)
    expect(document.querySelector('.feed-hearts')).toHaveTextContent('+1 pombo!')
  })

  it('invasão: o grupo principal se assusta ("!") e depois volta ao normal; o retrato do Pombo-sama reage', () => {
    vi.useFakeTimers()
    try {
      render(<FeedPage />)
      const throwButton = screen.getByRole('button', { name: /jogar grãozinho/i })
      act(() => {
        for (let i = 0; i < INVASION_AT; i++) throwButton.click()
      })
      expect(document.querySelector('.feed__portrait--surprised')).not.toBeNull()
      expect(document.querySelectorAll('.feed-pigeon .pigeon__exclaim').length).toBe(8)

      act(() => vi.advanceTimersByTime(INVASION_SHOCK_MS))
      expect(document.querySelector('.feed__portrait--surprised')).toBeNull()
      expect(document.querySelectorAll('.feed-pigeon .pigeon__exclaim')).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
