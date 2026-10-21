import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FINAL_LETTER_FOOTER, LOVE_LETTERS } from '../../data/loveLetters'
import { getProgress, markOpened, markSeen, recordPoke, recordVisit } from '../../lib/progress'
import { setReducedMotion } from '../../test/setup'
import MailPage from './MailPage'

const status = () => screen.getByRole('status')
const albumItems = () => document.querySelectorAll('.album__grid > li')
const card = (title: string) => screen.getByRole('button', { name: new RegExp(`carta "${title}"`) })

async function setup() {
  setReducedMotion(true)
  const user = userEvent.setup()
  render(<MailPage />)
  // o carteiro entrega a carta da primeira visita
  await waitFor(() => expect(getProgress().seen).toContain(1))
  return user
}

describe('Correio Pombo do Amor', () => {
  it('primeira visita: o carteiro entrega a carta 1; o resto fica bloqueado com dica', async () => {
    await setup()
    expect(screen.getByRole('heading', { level: 1, name: 'Correio Pombo do Amor' })).toHaveFocus()
    expect(status()).toHaveTextContent('O pombo-carteiro trouxe 1 carta nova: Entrega especial.')
    expect(screen.getByTestId('album-count')).toHaveTextContent('1 / 10 cartas encontradas')
    expect(card('Entrega especial')).toHaveAccessibleName('Abrir: carta "Entrega especial" (comum), nova')

    // bloqueadas: título escondido, dica visível
    expect(screen.queryByText('Meu lugar favorito')).not.toBeInTheDocument()
    expect(screen.getAllByText('Carta bloqueada.')).toHaveLength(9)
    expect(screen.getByText('Abra 1 carta.')).toBeInTheDocument()
    expect(screen.getByText(/Abra 5 cartas\. \(0\/5\)/)).toBeInTheDocument()
  })

  it('abrir uma carta: janela com o texto completo, foco no título, Esc fecha e devolve o foco', async () => {
    const user = await setup()
    const button = card('Entrega especial')
    await user.click(button)

    const dialog = screen.getByRole('dialog', { name: 'Entrega especial' })
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Entrega especial' })).toHaveFocus()
    expect(dialog).toHaveTextContent(LOVE_LETTERS[0].body)
    expect(dialog).toHaveTextContent('De: Correio dos Pombinhos')
    expect(document.querySelector('main')).toHaveAttribute('inert')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(card('Entrega especial')).toHaveFocus()
    expect(card('Entrega especial')).toHaveAccessibleName(/^Ler de novo/)
  })

  it('depois de ler, chega a próxima carta (só quando a janela fecha)', async () => {
    const user = await setup()
    await user.click(card('Entrega especial'))
    expect(getProgress().seen).not.toContain(2) // nada de entrega com a carta aberta
    await user.click(screen.getByRole('button', { name: /fechar carta/i }))
    await waitFor(() => expect(status()).toHaveTextContent('Meu lugar favorito'))
    expect(screen.getByTestId('album-count')).toHaveTextContent('2 / 10 cartas encontradas · 1 lidas')
  })

  it('o Tab fica preso dentro da carta aberta', async () => {
    const user = await setup()
    await user.click(card('Entrega especial'))
    const close = screen.getByRole('button', { name: /fechar carta/i })
    close.focus()
    await user.tab()
    expect(close).toHaveFocus()
  })

  it('filtro por raridade', async () => {
    const user = await setup()
    await user.click(screen.getByRole('button', { name: /^Raras/ }))
    expect(screen.getByRole('button', { name: /^Raras/ })).toHaveAttribute('aria-pressed', 'true')
    expect(albumItems()).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: /^Todas/ }))
    expect(albumItems()).toHaveLength(10)
  })

  it('cutucar o pombo-carteiro 3 vezes traz a "Confissão criminosa"', async () => {
    const user = await setup()
    const carrier = screen.getByRole('button', { name: 'Cutucar o pombo-carteiro' })
    await user.click(carrier)
    await user.click(carrier)
    await user.click(carrier)
    await waitFor(() => expect(status()).toHaveTextContent('Confissão criminosa'))
  })

  it('visitar o Oráculo antes traz o "Decreto real"', async () => {
    recordVisit('oraculo')
    await setup()
    expect(card('Decreto real')).toBeInTheDocument()
  })

  it('com as outras 9 encontradas, o Rei Pombo entrega a carta final', async () => {
    recordPoke()
    recordPoke()
    recordPoke()
    recordVisit('oraculo')
    for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9]) markOpened(id)
    markSeen([1, 2, 3, 4, 5, 6, 7, 8, 9])

    setReducedMotion(true)
    const user = userEvent.setup()
    render(<MailPage />)

    const king = await screen.findByRole('dialog', { name: 'O Rei Pombo chegou!' })
    const receive = within(king).getByRole('button', { name: /receber a carta/i })
    expect(receive).toHaveFocus()
    expect(status()).toHaveTextContent('Rei Pombo')

    await user.click(receive)
    const letter = screen.getByRole('dialog', { name: 'A carta mais importante' })
    expect(letter).toHaveTextContent('Eu te amo, Pombinha.')
    expect(letter).toHaveTextContent(FINAL_LETTER_FOOTER)
    expect(screen.getByTestId('album-count')).toHaveTextContent('10 / 10 cartas encontradas · 10 lidas')
  })

  it('o progresso fica salvo no aparelho', async () => {
    const user = await setup()
    await user.click(card('Entrega especial'))
    expect(JSON.parse(localStorage.getItem('pru:correio:v1')!).opened).toEqual([1])
  })
})
