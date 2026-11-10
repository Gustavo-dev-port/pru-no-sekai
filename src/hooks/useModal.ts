import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Comportamento de janela modal acessível:
 * - leva o foco para `initialFocus` ao abrir;
 * - Tab e Shift+Tab ficam presos dentro da janela, partindo de qualquer
 *   ponto (inclusive do título, que recebe foco mas não é parada de Tab);
 * - Esc fecha;
 * - a página de trás não rola;
 * - ao fechar, o foco volta para quem abriu.
 */
export function useModal(
  containerRef: RefObject<HTMLElement | null>,
  initialFocusRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    initialFocusRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !containerRef.current) return
      // O foco é sempre movido aqui, nunca pelo navegador: assim ele não
      // tem como sair da janela.
      e.preventDefault()
      const items = [...containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (items.length === 0) return
      const active = document.activeElement
      const index = items.indexOf(active as HTMLElement)
      let target: HTMLElement
      if (index !== -1) {
        target = items[(index + (e.shiftKey ? -1 : 1) + items.length) % items.length]
      } else {
        // foco fora das paradas de Tab (título da janela, fundo da página):
        // vai para a parada seguinte/anterior na ordem do documento
        const isAfter = (el: HTMLElement) => !!active && !!(active.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
        const inside = containerRef.current.contains(active)
        const next = inside ? items.find(isAfter) : undefined
        const previous = inside ? items.filter((el) => !isAfter(el)).pop() : undefined
        target = e.shiftKey ? (previous ?? items[items.length - 1]) : (next ?? items[0])
      }
      target.focus()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (opener && document.contains(opener)) opener.focus()
    }
    // abre e fecha uma vez: as refs são estáveis
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
