import type { LetterRarity } from '../../data/loveLetters'
import { PixelSprite } from '../../pixel/PixelSprite'
import {
  ENVELOPE_CLOSED,
  ENVELOPE_HEIGHT,
  ENVELOPE_OPEN,
  ENVELOPE_WIDTH,
  LOCKED_COLORS,
  SEAL_COLORS,
} from '../../pixel/sprites/mail'

interface EnvelopeProps {
  rarity: LetterRarity
  open?: boolean
  locked?: boolean
  scale?: number
}

/** Envelope pixel art com lacre na cor da raridade (ou cinza, se bloqueado). */
export function Envelope({ rarity, open = false, locked = false, scale = 4 }: EnvelopeProps) {
  return (
    <PixelSprite
      width={ENVELOPE_WIDTH}
      height={ENVELOPE_HEIGHT}
      layers={[{ grid: open ? ENVELOPE_OPEN : ENVELOPE_CLOSED }]}
      recolor={locked ? LOCKED_COLORS : SEAL_COLORS[rarity]}
      scale={scale}
      className="envelope"
    />
  )
}
