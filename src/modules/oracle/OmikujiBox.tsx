import { PixelSprite } from '../../pixel/PixelSprite'
import { OMIKUJI_BOX, OMIKUJI_STICK } from '../../pixel/sprites/props'

/**
 * Caixa de omikuji em pixel art. O palitinho fica escondido atrás da caixa
 * e, ao sacudir, sobe em degraus pelo furo da tampa (ver Oracle.css).
 */
export function OmikujiBox({ shaking, drawn }: { shaking: boolean; drawn: boolean }) {
  const state = shaking ? 'omikuji-box--shaking' : drawn ? 'omikuji-box--drawn' : ''
  return (
    <div className={`omikuji-box ${state}`} aria-hidden="true">
      <PixelSprite
        width={OMIKUJI_BOX.width}
        height={OMIKUJI_BOX.height}
        layers={[
          { grid: OMIKUJI_STICK.grid, className: 'omikuji-box__stick' },
          { grid: OMIKUJI_BOX.grid },
        ]}
      />
    </div>
  )
}
