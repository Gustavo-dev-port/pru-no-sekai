import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FEED_STAGES, INVASION_AT, INVASION_MESSAGES, RESET_MESSAGE } from '../../data/feedGame'
import { setReducedMotion } from '../../test/setup'
import FeedPage from './FeedPage'

const count = (id: string) => Number(screen.getByTestId(id).textContent)
const bubble = () => document.querySelector('.feed__bubble')!

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
    expect(bubble()).toHaveAttribute('aria-live', 'polite')
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
