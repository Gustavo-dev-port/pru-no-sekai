import { useEffect, useRef } from 'react'

/** Leva o foco ao título da página quando a tela muda (leitores de tela e teclado). */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    window.scrollTo(0, 0)
    ref.current?.focus({ preventScroll: true })
  }, [])
  return ref
}
