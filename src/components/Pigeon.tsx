import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { PixelSprite, type SpriteLayer } from '../pixel/PixelSprite'
import {
  BAG_MAIL,
  HAT_GUARDIAN,
  HAT_MAIL,
  HAT_SEER,
  PIGEON_BASE_Y,
  PIGEON_BLINK,
  PIGEON_BODY,
  PIGEON_HEAD,
  PIGEON_HEIGHT,
  PIGEON_WIDTH,
  PIGEON_WING_DOWN,
  PIGEON_WING_UP,
  type PigeonAccessory,
} from '../pixel/sprites/pigeon'
import { useTicker } from '../pixel/useTicker'
import './Pigeon.css'

/** Função do pombo: muda só o acessório, o corpo é sempre o mesmo. */
export type PigeonHat = 'none' | 'eboshi' | 'mail' | 'omikuji'

const ACCESSORIES: Record<PigeonHat, PigeonAccessory[]> = {
  none: [],
  eboshi: [HAT_GUARDIAN],
  omikuji: [HAT_SEER],
  mail: [BAG_MAIL, HAT_MAIL],
}

/** Um quadro de animação a cada 220 ms: ritmo de sprite, não de vídeo. */
const FRAME_MS = 220
const FLAP_MS = 660

interface PigeonProps {
  hat?: PigeonHat
  /** Quando ausente, o pombo é decorativo (aria-hidden). */
  title?: string
  className?: string
  /** Liga o ciclo de bob de cabeça + piscadas. */
  animated?: boolean
  /** Muda a cada cutucada: o pombo dá um pulinho batendo as asas. */
  pokeCount?: number
  /** Px de CSS por pixel do sprite. Padrão do jogo: 4. */
  scale?: number
}

export function Pigeon({ hat = 'none', title, className = '', animated = true, pokeCount = 0, scale = 4 }: PigeonProps) {
  const reducedMotion = usePrefersReducedMotion()
  const live = animated && !reducedMotion
  const tick = useTicker(live ? FRAME_MS : null)
  const [flapping, setFlapping] = useState(false)

  useEffect(() => {
    if (pokeCount === 0 || reducedMotion) return
    setFlapping(true)
    const id = window.setTimeout(() => setFlapping(false), FLAP_MS)
    return () => window.clearTimeout(id)
  }, [pokeCount, reducedMotion])

  // bob: cabeça vai 1 pixel para a frente a cada 2 quadros
  const headDx = live && Math.floor(tick / 2) % 2 === 1 ? -1 : 0
  // piscada: 1 quadro a cada 17
  const blinking = live && tick % 17 === 16
  // asas: alterna cima/baixo enquanto bate
  const wingUp = flapping && tick % 2 === 0

  const y = (top: number) => PIGEON_BASE_Y + top
  const accessories = ACCESSORIES[hat]

  const layers: SpriteLayer[] = [
    { grid: PIGEON_BODY, dy: y(0) },
    { grid: wingUp ? PIGEON_WING_UP : PIGEON_WING_DOWN, dy: y(0) },
    ...accessories.filter((a) => !a.onHead).map((a) => ({ grid: a.grid, dy: y(a.top) })),
    { grid: PIGEON_HEAD, dx: headDx, dy: y(0) },
    ...(blinking ? [{ grid: PIGEON_BLINK, dx: headDx, dy: y(0) }] : []),
    ...accessories.filter((a) => a.onHead).map((a) => ({ grid: a.grid, dx: headDx, dy: y(a.top) })),
  ]

  return (
    <span className={`pigeon ${flapping ? 'pigeon--hop' : ''} ${className}`}>
      <PixelSprite width={PIGEON_WIDTH} height={PIGEON_HEIGHT} layers={layers} scale={scale} title={title} />
    </span>
  )
}
