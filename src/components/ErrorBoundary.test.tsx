import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('módulo quebrado')
}

describe('ErrorBoundary — falha ao carregar ou desenhar um módulo', () => {
  beforeEach(() => {
    // o React registra o erro capturado no console; aqui ele é esperado
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('sem erro: mostra o conteúdo normalmente', () => {
    render(
      <ErrorBoundary>
        <p>tudo certo</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('tudo certo')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('com erro: mensagem do Pombo-sama no lugar da tela em branco, com o foco no título', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('não carregou')
    expect(alert).toHaveTextContent('continuam guardadas')
    expect(screen.getByRole('heading', { level: 1, name: /tropecei no caminho/i })).toHaveFocus()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('o botão "Recarregar a página" funciona com clique e com teclado', async () => {
    const onReload = vi.fn()
    const user = userEvent.setup()
    render(
      <ErrorBoundary onReload={onReload}>
        <Boom />
      </ErrorBoundary>,
    )
    const reload = screen.getByRole('button', { name: /recarregar a página/i })
    await user.click(reload)
    expect(onReload).toHaveBeenCalledTimes(1)

    reload.focus()
    await user.keyboard('{Enter}')
    expect(onReload).toHaveBeenCalledTimes(2)
  })

  it('oferece a volta ao santuário', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('link', { name: /voltar ao santuário/i })).toHaveAttribute('href', '#/')
  })
})
