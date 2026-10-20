import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { GUARDIAN_GREETING_GATE } from './data/guardianMessages'
import { setReducedMotion } from './test/setup'

function goTo(hash: string) {
  act(() => {
    window.location.hash = hash
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

describe('Santuário — portão e travessia', () => {
  it('abre no portão com o título focado', () => {
    render(<App />)
    const title = screen.getByRole('heading', { level: 1, name: 'Pru no Sekai' })
    expect(title).toHaveFocus()
  })

  it('o pombo guardião troca de fala ao ser cutucado, sem repetir a anterior', async () => {
    const user = userEvent.setup()
    render(<App />)
    const pigeon = screen.getByRole('button', { name: /cutucar o pombo-sama/i })
    let previous = GUARDIAN_GREETING_GATE
    for (let i = 0; i < 20; i++) {
      await user.click(pigeon)
      const current = pigeon.parentElement!.querySelector('.guardian__text')!.textContent
      expect(current).not.toBe(previous)
      previous = current!
    }
  })

  it('durante a travessia o foco fica no botão, o estado é anunciado e o resto fica inerte', () => {
    vi.useFakeTimers()
    try {
      render(<App />)
      const enter = screen.getByRole('button', { name: /atravessar o torii/i })
      enter.focus()
      fireEvent.click(enter)

      // Ainda no portão, em transição.
      expect(enter).toHaveFocus()
      expect(enter).toHaveAttribute('aria-disabled', 'true')
      expect(enter).toHaveTextContent('Atravessando…')
      expect(screen.getByRole('status')).toHaveTextContent(/atravessando o torii/i)
      expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true')
      expect(document.querySelector('.gate__title')).toHaveAttribute('inert')

      // Clique repetido não reinicia nada.
      fireEvent.click(enter)

      act(() => {
        vi.advanceTimersByTime(1300)
      })

      const courtyardTitle = screen.getByRole('heading', { level: 1, name: 'Santuário da Grande Pru' })
      expect(courtyardTitle).toHaveFocus()
    } finally {
      vi.useRealTimers()
    }
  })

  it('com movimento reduzido entra direto no pátio, sem animação', async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /atravessar o torii/i }))
    expect(screen.getByRole('heading', { level: 1, name: 'Santuário da Grande Pru' })).toHaveFocus()
  })
})

describe('Navegação entre os quatro módulos', () => {
  it('o pátio tem uma ema para cada uma das três experiências', async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /atravessar o torii/i }))

    const nav = screen.getByRole('navigation', { name: /experiências do santuário/i })
    const links = within(nav).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#/oraculo', '#/alimentar', '#/correio'])
  })

  it('#/oraculo abre o Oráculo pronto (sem selo de construção) e marca a aba atual', async () => {
    render(<App />)
    goTo('#/oraculo')

    const title = await screen.findByRole('heading', { level: 1, name: 'Oráculo dos Pombos' })
    expect(title).toHaveFocus()
    expect(document.title).toBe('Oráculo dos Pombos · Pru no Sekai')
    expect(screen.queryByText('Em construção')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tirar um omikuji/i })).toBeInTheDocument()

    const bottomNav = screen.getByRole('navigation', { name: /módulos do pru no sekai/i })
    expect(within(bottomNav).getByRole('link', { current: 'page' })).toHaveAttribute('href', '#/oraculo')
  })

  it('#/alimentar abre o minijogo (sem selo de construção)', async () => {
    render(<App />)
    goTo('#/alimentar')
    expect(await screen.findByRole('heading', { level: 1, name: 'Alimente o Pombo' })).toHaveFocus()
    expect(screen.queryByText('Em construção')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /jogar grãozinho/i })).toBeInTheDocument()
    const bottomNav = screen.getByRole('navigation', { name: /módulos do pru no sekai/i })
    expect(within(bottomNav).getByRole('link', { current: 'page' })).toHaveAttribute('href', '#/alimentar')
  })

  it.each([
    ['#/correio', 'Correio Pombo do Amor'],
  ])('%s abre "%s", marca a aba atual e mostra que está em construção', async (hash, name) => {
    render(<App />)
    goTo(hash)

    const title = await screen.findByRole('heading', { level: 1, name })
    expect(title).toHaveFocus()
    expect(document.title).toBe(`${name} · Pru no Sekai`)
    expect(screen.getByText('Em construção')).toBeInTheDocument()

    const bottomNav = screen.getByRole('navigation', { name: /módulos do pru no sekai/i })
    const links = within(bottomNav).getAllByRole('link')
    expect(links).toHaveLength(4)
    expect(within(bottomNav).getByRole('link', { current: 'page' })).toHaveAttribute('href', hash)
  })

  it('ao voltar de um módulo, quem já entrou cai direto no pátio', async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /atravessar o torii/i }))

    goTo('#/correio')
    await screen.findByRole('heading', { level: 1, name: 'Correio Pombo do Amor' })

    goTo('#/')
    expect(screen.getByRole('heading', { level: 1, name: 'Santuário da Grande Pru' })).toBeInTheDocument()
  })

  it('"Voltar ao portão" mostra o portão de novo', async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /atravessar o torii/i }))
    await user.click(screen.getByRole('button', { name: /voltar ao portão/i }))
    expect(screen.getByRole('heading', { level: 1, name: 'Pru no Sekai' })).toBeInTheDocument()
  })
})
