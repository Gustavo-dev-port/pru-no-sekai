import { PIXEL_COLORS } from '../pixel/palette'
import { PixelSprite } from '../pixel/PixelSprite'
import { LANTERN } from '../pixel/sprites/props'
import './PaperLanterns.css'

const PINK = { r: PIXEL_COLORS.sakuraMid, R: PIXEL_COLORS.sakuraDark }
const VARIANTS = [undefined, PINK, undefined, PINK, undefined]

/** Varal de chōchin (lanternas de papel) em pixel art. Decorativo. */
export function PaperLanterns() {
  return (
    <div className="lanterns" aria-hidden="true">
      <div className="lanterns__rope" />
      {VARIANTS.map((recolor, i) => (
        <span key={i} className="lanterns__item" style={{ animationDelay: `${i * -0.4}s` }}>
          <PixelSprite width={LANTERN.width} height={LANTERN.height} layers={[{ grid: LANTERN.grid }]} recolor={recolor} />
        </span>
      ))}
    </div>
  )
}
