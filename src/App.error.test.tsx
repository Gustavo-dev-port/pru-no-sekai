import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

// O módulo do Oráculo falha ao carregar (como um chunk que não baixou).
vi.mock('./modules/oracle/OraclePage', () => {
  throw new Error('Failed to fetch dynamically imported module')
})

// carregar um módulo sob demanda pela primeira vez pode demorar com a máquina ocupada
const SLOW = { timeout: 8000 }

function goTo(hash: string) {
  act(() => {
    window.location.hash = hash
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

describe('App — módulo que não carrega', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('mostra a tela do Pombo-sama; trocar de módulo tira a tela de erro', async () => {
    window.location.hash = '#/oraculo'
    render(<App />)

    expect(await screen.findByRole('alert', {}, SLOW)).toHaveTextContent('não carregou')
    expect(screen.getByRole('button', { name: /recarregar a página/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /voltar ao santuário/i })).toHaveAttribute('href', '#/')

    goTo('')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Pru no Sekai' })).toBeInTheDocument()

    // os outros módulos continuam funcionando
    goTo('#/correio')
    expect(await screen.findByRole('heading', { level: 1, name: 'Correio Pombo do Amor' }, SLOW)).toBeInTheDocument()
  }, 20_000)
})
