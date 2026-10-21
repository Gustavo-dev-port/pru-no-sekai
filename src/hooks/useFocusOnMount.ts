import { useEffect, useRef } from 'react'

/**
 * Leva o foco ao título da página quando a tela muda (leitores de tela e
 * teclado). Com `enabled = false` (ex.: uma janela modal abre junto com a
 * página), não rouba o foco dela.
 */
export function useFocusOnMount<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null)
  useEffect(() => {
    window.scrollTo(0, 0)
    if (enabled) ref.current?.focus({ preventScroll: true })
    // só ao montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return ref
}
