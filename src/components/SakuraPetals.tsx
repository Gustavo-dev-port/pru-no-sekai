import { useMemo, type CSSProperties } from 'react'
import { PixelSprite } from '../pixel/PixelSprite'
import { PETAL } from '../pixel/sprites/props'
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

/** Pétalas em pixel art caindo aos "trancos" (steps). Somem com movimento reduzido. */
export function SakuraPetals({ count = 12 }: SakuraPetalsProps) {
  const petals = useMemo(() => {
    const rand = seeded(7)
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      style: {
        '--x': `${Math.round(rand() * 100)}vw`,
        '--drift': `${Math.round(rand() * 30 - 15) * 4}px`,
        '--dur': `${8 + rand() * 6}s`,
        '--delay': `${-rand() * 14}s`,
      } as CSSProperties,
    }))
  }, [count])

  return (
    <div className="petals" aria-hidden="true">
      {petals.map((p) => (
        <span key={p.id} className="petals__petal" style={p.style}>
          <PixelSprite width={PETAL.width} height={PETAL.height} layers={[{ grid: PETAL.grid }]} />
        </span>
      ))}
    </div>
  )
}
