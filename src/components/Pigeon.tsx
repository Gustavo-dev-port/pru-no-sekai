import { useEffect, useRef, useState } from 'react'
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
  PIGEON_EXCLAIM,
  PIGEON_EXPRESSIONS,
  PIGEON_HEAD,
  PIGEON_HEIGHT,
  PIGEON_VARIANTS,
  PIGEON_WIDTH,
  PIGEON_WING_DOWN,
  PIGEON_WING_OPEN,
  PIGEON_WING_UP,
  type PigeonAccessory,
  type PigeonExpression,
  type PigeonVariant,
} from '../pixel/sprites/pigeon'
import { useTicker } from '../pixel/useTicker'
import './Pigeon.css'

/** Função do pombo: muda só o acessório, o corpo é sempre o mesmo. */
export type PigeonHat = 'none' | 'eboshi' | 'mail' | 'omikuji'

/**
 * Pose da cabeça:
 * - stand: em pé
 * - tilt: inclinando (quadro 1 da bicada)
 * - reach: bico no chão (quadro 2 da bicada)
 */
export type PigeonPose = 'stand' | 'tilt' | 'reach'

const ACCESSORIES: Record<PigeonHat, PigeonAccessory[]> = {
  none: [],
  eboshi: [HAT_GUARDIAN],
  omikuji: [HAT_SEER],
  mail: [BAG_MAIL, HAT_MAIL],
}

/** Deslocamento da cabeça (em pixels do sprite) em cada pose. */
const HEAD_OFFSET: Record<PigeonPose, { dx: number; dy: number }> = {
  stand: { dx: 0, dy: 0 },
  tilt: { dx: -1, dy: 4 },
  reach: { dx: -3, dy: 13 },
}

/** Do centro do sprite até a ponta do bico na pose "reach", em px de CSS (escala 4). */
export const PIGEON_BEAK_REACH_PX = 15 * 4

/** Um quadro de animação a cada 220 ms: ritmo de sprite, não de vídeo. */
const FRAME_MS = 220
/** Bater de asas: quadros mais rápidos, poucos e com fim. */
const FLAP_FRAME_MS = 110
const FLAP_SEQUENCE = ['open', 'up', 'down', 'up', 'open', 'up'] as const

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
  /** Cor das penas (pombos comuns do minijogo). */
  variant?: PigeonVariant
  /** Olha para a direita em vez da esquerda. */
  flip?: boolean
  pose?: PigeonPose
  expression?: PigeonExpression
  /** Mostra um "!" de susto acima da cabeça. */
  exclaim?: boolean
  /** Bate as asas ao aparecer, depois deste atraso (ms). `null` = não bate. */
  flapOnMountMs?: number | null
  /** Atraso em quadros, para vários pombos não balançarem em sincronia. */
  phase?: number
}

export function Pigeon({
  hat = 'none',
  title,
  className = '',
  animated = true,
  pokeCount = 0,
  scale = 4,
  variant = 'classico',
  flip = false,
  pose = 'stand',
  expression = 'normal',
  exclaim = false,
  flapOnMountMs = null,
  phase = 0,
}: PigeonProps) {
  const reducedMotion = usePrefersReducedMotion()
  const live = animated && !reducedMotion
  const tick = useTicker(live ? FRAME_MS : null) + (live ? phase : 0)
  const [flapFrame, setFlapFrame] = useState<number | null>(null)
  const [hopping, setHopping] = useState(false)
  const flapTimer = useRef<number | undefined>(undefined)

  // Bate as asas: poucos quadros e para sozinho (nada de loop infinito em 26 pombos).
  const startFlap = () => {
    window.clearInterval(flapTimer.current)
    let frame = 0
    setFlapFrame(0)
    flapTimer.current = window.setInterval(() => {
      frame++
      if (frame >= FLAP_SEQUENCE.length) {
        window.clearInterval(flapTimer.current)
        setFlapFrame(null)
      } else setFlapFrame(frame)
    }, FLAP_FRAME_MS)
  }

  useEffect(() => () => window.clearInterval(flapTimer.current), [])

  useEffect(() => {
    if (flapOnMountMs === null || reducedMotion) return
    const id = window.setTimeout(startFlap, flapOnMountMs)
    return () => window.clearTimeout(id)
    // só ao montar: a chegada acontece uma vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (pokeCount === 0 || reducedMotion) return
    startFlap()
    setHopping(true)
    const id = window.setTimeout(() => setHopping(false), 660)
    return () => window.clearTimeout(id)
  }, [pokeCount, reducedMotion])

  const head = HEAD_OFFSET[pose]
  const standing = pose === 'stand'
  // bob: cabeça vai 1 pixel para a frente a cada 2 quadros (só em pé)
  const headDx = head.dx + (standing && live && Math.floor(tick / 2) % 2 === 1 ? -1 : 0)
  const headDy = head.dy
  // bicando, o rosto é sempre o feliz
  const face: PigeonExpression = standing ? expression : 'feliz'
  // piscada: 1 quadro a cada 17, só com o rosto normal
  const blinking = face === 'normal' && live && tick % 17 === 16

  const wing = flapFrame === null ? 'down' : FLAP_SEQUENCE[flapFrame]
  const wingGrid = wing === 'open' ? PIGEON_WING_OPEN : wing === 'up' ? PIGEON_WING_UP : PIGEON_WING_DOWN

  const y = (top: number) => PIGEON_BASE_Y + top
  const accessories = ACCESSORIES[hat]
  const onHead = (top: number) => ({ dx: headDx, dy: y(top + headDy) })

  const layers: SpriteLayer[] = [
    { grid: PIGEON_BODY, dy: y(0) },
    { grid: wingGrid, dy: y(0) },
    ...accessories.filter((a) => !a.onHead).map((a) => ({ grid: a.grid, dy: y(a.top) })),
    { grid: PIGEON_HEAD, ...onHead(0) },
    ...(blinking ? [{ grid: PIGEON_BLINK, ...onHead(0) }] : []),
    ...(face !== 'normal' ? [{ grid: PIGEON_EXPRESSIONS[face], ...onHead(0) }] : []),
    ...accessories.filter((a) => a.onHead).map((a) => ({ grid: a.grid, ...onHead(a.top) })),
    ...(exclaim ? [{ grid: PIGEON_EXCLAIM.grid, ...onHead(PIGEON_EXCLAIM.top), className: 'pigeon__exclaim' }] : []),
  ]

  return (
    <span className={`pigeon ${hopping ? 'pigeon--hop' : ''} ${className}`}>
      <PixelSprite
        width={PIGEON_WIDTH}
        height={PIGEON_HEIGHT}
        layers={layers}
        scale={scale}
        title={title}
        recolor={PIGEON_VARIANTS[variant]}
        className={flip ? 'pixel-sprite--flip' : ''}
      />
    </span>
  )
}
