import { useMemo, type CSSProperties } from 'react'
import './SakuraPetals.css'

interface SakuraPetalsProps {
  count?: number
}

// Gerador determinístico: a chuva de pétalas fica igual entre renderizações.
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/** Pétalas caindo em CSS puro. Some por completo com movimento reduzido. */
export function SakuraPetals({ count = 14 }: SakuraPetalsProps) {
  const petals = useMemo(() => {
    const rand = seeded(7)
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      style: {
        '--x': `${Math.round(rand() * 100)}vw`,
        '--drift': `${Math.round(rand() * 120 - 60)}px`,
        '--size': `${10 + Math.round(rand() * 8)}px`,
        '--dur': `${7 + rand() * 6}s`,
        '--delay': `${-rand() * 12}s`,
      } as CSSProperties,
    }))
  }, [count])

  return (
    <div className="petals" aria-hidden="true">
      {petals.map((p) => (
        <span key={p.id} className="petals__petal" style={p.style} />
      ))}
    </div>
  )
}
