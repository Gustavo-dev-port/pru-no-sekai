import { PixelSprite } from '../../pixel/PixelSprite'
import {
  HAT_GUARDIAN,
  PIGEON_BASE_Y,
  PIGEON_EXCLAIM,
  PIGEON_EXPRESSIONS,
  PIGEON_HEAD,
  PIGEON_HEIGHT,
  PIGEON_WIDTH,
} from '../../pixel/sprites/pigeon'

/**
 * Retrato do Pombo-sama na caixa de diálogo (como em RPG): recorte da cabeça
 * do mesmo sprite do guardião. Na invasão, arregala os olhos com um "!".
 */
export function GuardianPortrait({ surprised }: { surprised: boolean }) {
  const y = (top: number) => PIGEON_BASE_Y + top
  return (
    <span className={`feed__portrait ${surprised ? 'feed__portrait--surprised' : ''}`} aria-hidden="true">
      <PixelSprite
        width={PIGEON_WIDTH}
        height={PIGEON_HEIGHT}
        crop={{ x: -1, y: -2, w: 18, h: 16 }}
        scale={3}
        layers={[
          { grid: PIGEON_HEAD, dy: y(0) },
          ...(surprised ? [{ grid: PIGEON_EXPRESSIONS.surpreso, dy: y(0) }] : []),
          { grid: HAT_GUARDIAN.grid, dy: y(HAT_GUARDIAN.top) },
          ...(surprised ? [{ grid: PIGEON_EXCLAIM.grid, dx: -2, dy: y(PIGEON_EXCLAIM.top + 4), className: 'pigeon__exclaim' }] : []),
        ]}
      />
    </span>
  )
}
