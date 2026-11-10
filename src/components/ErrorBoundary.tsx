import { Component, createRef, type ReactNode } from 'react'
import { hrefFor } from '../router'
import { Pigeon } from './Pigeon'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Padrão: recarrega a página. Trocável nos testes. */
  onReload?: () => void
}

/**
 * Rede de segurança dos módulos: se um deles não carregar (sem internet,
 * versão nova publicada com a aba aberta) ou quebrar ao desenhar, mostra o
 * Pombo-sama com um botão para recarregar, em vez de uma tela em branco.
 * O progresso salvo não é tocado.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false }
  private headingRef = createRef<HTMLHeadingElement>()

  static getDerivedStateFromError() {
    return { failed: true }
  }

  // leva o foco à mensagem (leitores de tela e teclado); a falha pode
  // acontecer já na primeira montagem ou depois
  componentDidMount() {
    if (this.state.failed) this.headingRef.current?.focus()
  }

  componentDidUpdate(_: ErrorBoundaryProps, previous: { failed: boolean }) {
    if (this.state.failed && !previous.failed) this.headingRef.current?.focus()
  }

  private reload = () => {
    if (this.props.onReload) this.props.onReload()
    else window.location.reload()
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="app-error">
        <div className="app-error__pigeon">
          <Pigeon hat="eboshi" />
        </div>
        <section className="app-error__dialog px-box" role="alert">
          <span className="app-error__speaker" aria-hidden="true">
            Pombo-sama
          </span>
          <h1 ref={this.headingRef} tabIndex={-1} className="app-error__title">
            Pru-pru… tropecei no caminho!
          </h1>
          <p>Esta parte do santuário não carregou. Pode ser a internet ou uma novidade que acabou de chegar.</p>
          <p>Suas cartinhas e a fazendinha continuam guardadas.</p>
        </section>
        <button type="button" className="btn btn--primary app-error__reload" onClick={this.reload}>
          ↺ Recarregar a página
        </button>
        <a className="btn btn--ghost" href={hrefFor('santuario')}>
          ◀ Voltar ao santuário
        </a>
      </main>
    )
  }
}
