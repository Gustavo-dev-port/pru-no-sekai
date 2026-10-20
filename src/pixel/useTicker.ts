import { useEffect, useState } from 'react'

/**
 * Relógio de quadros dos sprites: incrementa a cada `intervalMs`.
 * Com `null` (ex.: movimento reduzido) fica parado no quadro 0.
 */
export function useTicker(intervalMs: number | null): number {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (intervalMs === null) {
      setTick(0)
      return
    }
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return tick
}
