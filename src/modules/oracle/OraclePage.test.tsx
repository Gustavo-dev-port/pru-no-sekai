import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FORTUNES, parseFortune } from '../../data/fortunes'
import { setReducedMotion } from '../../test/setup'
import OraclePage, { SHAKE_DURATION_MS } from './OraclePage'

const titles = new Set(FORTUNES.map((f) => f.title))

function currentFortuneTitle() {
  const heading = screen.getByRole('heading', { level: 2 })
  expect(titles.has(heading.textContent!)).toBe(true)
  return heading
}

describe('Coleção 01', () => {
  it('tem 30 previsões com ids únicos e todos os campos preenchidos', () => {
    expect(FORTUNES).toHaveLength(30)
    expect(new Set(FORTUNES.map((f) => f.id)).size).toBe(30)
    for (const f of FORTUNES) {
      for (const field of [f.title, f.body, f.extra, f.category, f.kanji, f.luckLabel]) {
        expect(field.trim()).not.toBe('')
      }
    }
  })

  it('reconhece todos os níveis de sorte usados', () => {
    expect(new Set(FORTUNES.map((f) => f.luck))).toEqual(
      new Set(['daikichi', 'chukichi', 'kichi', 'shokichi', 'suekichi', 'kyo']),
    )
  })

  it('classificação desconhecida é erro, não falha silenciosa', () => {
    expect(() => parseFortune({ ...FORTUNES[0], type: '超吉 · Inventada' })).toThrow()
  })
})

describe('Oráculo dos Pombos', () => {
  it('começa sem previsão e com o título focado', () => {
    render(<OraclePage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Oráculo dos Pombos' })).toHaveFocus()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('sacode a caixa, anuncia, e só então revela com foco no título da previsão', () => {
    vi.useFakeTimers()
    try {
      render(<OraclePage />)
      const button = screen.getByRole('button', { name: /tirar um omikuji/i })
      button.focus()
      fireEvent.click(button)

      expect(button).toHaveFocus()
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(screen.getByRole('status')).toHaveTextContent(/consultando os astros/i)
      expect(screen.queryByRole('article')).not.toBeInTheDocument()

      fireEvent.click(button) // clique durante o sacode é ignorado
      act(() => {
        vi.advanceTimersByTime(SHAKE_DURATION_MS)
      })

      expect(screen.getAllByRole('article')).toHaveLength(1)
      expect(currentFortuneTitle()).toHaveFocus()
      expect(button).not.toHaveAttribute('aria-disabled')
      expect(button).toHaveTextContent(/tirar outra previsão/i)
    } finally {
      vi.useRealTimers()
    }
  })

  it('nunca repete a previsão anterior e ela fica visível até a próxima consulta', async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    render(<OraclePage />)
    await user.click(screen.getByRole('button', { name: /tirar um omikuji/i }))

    let previous = currentFortuneTitle().textContent
    for (let i = 0; i < 40; i++) {
      // continua lá antes de pedir outra
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(previous!)
      await user.click(screen.getByRole('button', { name: /tirar outra previsão/i }))
      const current = currentFortuneTitle().textContent
      expect(current).not.toBe(previous)
      previous = current
    }
  })

  it('previsão de má sorte (凶) é fofa: azul calmo, sem alarme, com aviso brincalhão', async () => {
    setReducedMotion(true)
    const kyoIndex = FORTUNES.findIndex((f) => f.luck === 'kyo')
    vi.spyOn(Math, 'random').mockReturnValue((kyoIndex + 0.5) / FORTUNES.length)

    const user = userEvent.setup()
    render(<OraclePage />)
    await user.click(screen.getByRole('button', { name: /tirar um omikuji/i }))

    const article = screen.getByRole('article')
    expect(article).toHaveClass('fortune--kyo')
    expect(article).toHaveTextContent('Má sorte')
    expect(article).toHaveTextContent('nível de perigo: fofo')
  })
})
