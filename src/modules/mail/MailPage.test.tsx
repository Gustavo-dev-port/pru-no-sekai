import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FINAL_LETTER_FOOTER, LOVE_LETTERS } from '../../data/loveLetters'
import { getProgress, markOpened, markSeen, recordPoke, recordVisit } from '../../lib/progress'
import { flushSaves, reloadSaveForTests, SAVE_KEY } from '../../lib/save'
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
    await waitFor(() => expect(JSON.parse(localStorage.getItem('pru:save')!).mail.opened).toEqual([1]))
  })
})

describe('AUD-007.1-01 — Correio com save de versão mais nova (somente leitura)', () => {
  it('mostra o que está gravado; cutucar, abrir carta e entregas não criam progresso', async () => {
    const mail = { opened: [1], seen: [1, 2], pokes: 2, visited: [] }
    const future = JSON.stringify({ schemaVersion: 3, mail, economy: {} })
    localStorage.setItem(SAVE_KEY, future)
    reloadSaveForTests()
    setReducedMotion(true)
    const user = userEvent.setup()
    render(<MailPage />)

    expect(screen.getByRole('note')).toHaveTextContent('versão mais nova')
    expect(screen.getByTestId('album-count')).toHaveTextContent('2 / 10 cartas encontradas · 1 lidas')

    // seria a 3ª cutucada (carta "Confissão criminosa"): não conta
    await user.click(screen.getByRole('button', { name: 'Cutucar o pombo-carteiro' }))
    // dá para ler a carta já encontrada, mas ela não passa a "lida"
    await user.click(card('Meu lugar favorito'))
    expect(screen.getByRole('dialog', { name: 'Meu lugar favorito' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /fechar carta/i }))
    await flushSaves()

    expect(screen.getByTestId('album-count')).toHaveTextContent('2 / 10 cartas encontradas · 1 lidas')
    expect(card('Meu lugar favorito')).toHaveAccessibleName(/^Abrir/)
    expect(screen.queryByText('Confissão criminosa')).not.toBeInTheDocument()
    expect(status()).toBeEmptyDOMElement() // nenhuma entrega anunciada
    expect(getProgress()).toEqual(mail)
    expect(localStorage.getItem(SAVE_KEY)).toBe(future)
  })
})

describe('Correio — janelas modais só com teclado', () => {
  const bottomNav = () => screen.getByRole('navigation', { name: /módulos do pru no sekai/i, hidden: true })
  const insideDialog = () => expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement)

  /** Tudo pronto para o Rei Pombo, menos a 3ª cutucada (carta 8). */
  function almostEverything() {
    recordPoke()
    recordPoke()
    recordVisit('oraculo')
    for (const id of [1, 2, 3, 4, 5, 6, 7, 9]) markOpened(id)
    markSeen([1, 2, 3, 4, 5, 6, 7, 9])
  }

  it('carta aberta: Tab e Shift+Tab nunca saem da janela, nem partindo do título', async () => {
    const user = await setup()
    card('Entrega especial').focus()
    await user.keyboard('{Enter}')

    const dialog = screen.getByRole('dialog', { name: 'Entrega especial' })
    const close = within(dialog).getByRole('button', { name: /fechar carta/i })
    expect(within(dialog).getByRole('heading', { level: 2 })).toHaveFocus()

    await user.tab({ shift: true }) // do título para trás: antes escapava da janela
    expect(close).toHaveFocus()
    for (let i = 0; i < 5; i++) {
      await user.tab({ shift: true })
      insideDialog()
    }
    for (let i = 0; i < 5; i++) {
      await user.tab()
      insideDialog()
    }

    await user.keyboard('{Enter}') // "Fechar carta" pelo teclado
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(card('Entrega especial')).toHaveFocus()
  })

  it('a barra inferior fica inerte enquanto a carta está aberta e volta ao fechar', async () => {
    const user = await setup()
    expect(bottomNav()).not.toHaveAttribute('inert')
    card('Entrega especial').focus()
    await user.keyboard('{Enter}')
    expect(bottomNav()).toHaveAttribute('inert')
    await user.keyboard('{Escape}')
    expect(bottomNav()).not.toHaveAttribute('inert')
  })

  it('Rei Pombo: foco preso na janela, barra inerte; depois da carta final o foco volta para ela no álbum', async () => {
    almostEverything()
    recordPoke()
    markOpened(8)
    markSeen([8])
    setReducedMotion(true)
    const user = userEvent.setup()
    render(<MailPage />)

    const king = await screen.findByRole('dialog', { name: 'O Rei Pombo chegou!' })
    const receive = within(king).getByRole('button', { name: /receber a carta/i })
    expect(receive).toHaveFocus()
    expect(bottomNav()).toHaveAttribute('inert')
    await user.tab()
    expect(receive).toHaveFocus()
    await user.tab({ shift: true })
    expect(receive).toHaveFocus()

    await user.keyboard('{Enter}')
    const letter = screen.getByRole('dialog', { name: 'A carta mais importante' })
    expect(within(letter).getByRole('heading', { level: 2 })).toHaveFocus()
    expect(bottomNav()).toHaveAttribute('inert')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(card('A carta mais importante')).toHaveFocus() // antes: o foco se perdia
    expect(bottomNav()).not.toHaveAttribute('inert')
  })

  it('Rei Pombo dispensado com Esc: a carta final fica no álbum como nova e o foco não se perde', async () => {
    almostEverything()
    recordPoke()
    markOpened(8)
    markSeen([8])
    setReducedMotion(true)
    const user = userEvent.setup()
    render(<MailPage />)

    await screen.findByRole('dialog', { name: 'O Rei Pombo chegou!' })
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(card('A carta mais importante')).toHaveAccessibleName(/, nova$/)
    expect(document.activeElement).not.toBe(document.body)
    expect(bottomNav()).not.toHaveAttribute('inert')
  })

  it('carta final escondida pelo filtro: ao fechar, o foco vai para o título da página', async () => {
    almostEverything()
    setReducedMotion(true)
    const user = userEvent.setup()
    render(<MailPage />)

    await user.click(screen.getByRole('button', { name: /^Raras/ }))
    // a 3ª cutucada traz a carta 8 e, com ela, o Rei Pombo
    const carrier = screen.getByRole('button', { name: 'Cutucar o pombo-carteiro' })
    carrier.focus()
    await user.keyboard('{Enter}')

    const king = await screen.findByRole('dialog', { name: 'O Rei Pombo chegou!' })
    await waitFor(() => expect(within(king).getByRole('button', { name: /receber a carta/i })).toHaveFocus())
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog', { name: 'A carta mais importante' })).toBeInTheDocument()
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /A carta mais importante/ })).not.toBeInTheDocument() // filtro: só raras
    expect(screen.getByRole('heading', { level: 1, name: 'Correio Pombo do Amor' })).toHaveFocus()
  })
})

describe('Correio — pombo-carteiro', () => {
  it('não dá o pulinho da cutucada sozinho ao remontar nas entregas', async () => {
    setReducedMotion(false)
    const user = userEvent.setup()
    render(<MailPage />)
    const carrier = screen.getByRole('button', { name: 'Cutucar o pombo-carteiro' })
    const hopping = () => carrier.querySelector('.pigeon--hop') !== null

    // a entrega da primeira visita está em andamento; cutucada de verdade: pula
    await user.click(carrier)
    expect(carrier.className).toContain('arriving')
    expect(hopping()).toBe(true)

    // a entrega termina e o carteiro é remontado, já cutucado: não pula de novo
    await waitFor(() => expect(carrier.className).not.toContain('arriving'), { timeout: 3000 })
    expect(hopping()).toBe(false)
  })
})
