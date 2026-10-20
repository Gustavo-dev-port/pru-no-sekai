import { useCallback, useRef, useState } from 'react'
import { pickIndexAvoiding } from '../lib/random'

/** Mensagem atual + função para sortear a próxima, sem repetir a anterior. */
export function useRotatingMessage(messages: readonly string[], initial: string) {
  const lastIndex = useRef<number | null>(null)
  const [message, setMessage] = useState(initial)
  const [count, setCount] = useState(0)

  const next = useCallback(() => {
    const index = pickIndexAvoiding(messages.length, lastIndex.current)
    lastIndex.current = index
    setMessage(messages[index])
    setCount((c) => c + 1)
  }, [messages])

  return { message, next, count }
}
