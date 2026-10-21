import { CROPS, type CropId } from '../../data/crops'
import type { Growth, Plot } from '../../economy/farm'
import { PixelSprite } from '../../pixel/PixelSprite'
import { CROP_SPRITE_HEIGHT, CROP_SPRITE_WIDTH, cropSprite } from '../../pixel/sprites/farm'
import { formatDuration } from './farmText'

interface PlotButtonProps {
  index: number
  plot: Plot | null
  growth: Growth | null
  selected: CropId
  hasSeeds: boolean
  onActivate: (index: number) => void
}

/** Um canteiro: vazio (plantar), crescendo (contagem) ou pronto (colher). */
export function PlotButton({ index, plot, growth, selected, hasSeeds, onActivate }: PlotButtonProps) {
  const n = index + 1
  let label: string
  let caption: string
  let state: 'empty' | 'growing' | 'ready'

  if (!plot || !growth) {
    state = 'empty'
    const seedName = CROPS[selected].name.toLowerCase()
    label = hasSeeds ? `Canteiro ${n}: vazio. Plantar ${seedName}` : `Canteiro ${n}: vazio. Sem sementes de ${seedName}`
    caption = hasSeeds ? `+ Plantar ${seedName}` : 'Vazio'
  } else if (growth.ready) {
    state = 'ready'
    label = `Canteiro ${n}: ${CROPS[plot.crop].name.toLowerCase()} pronto. Colher`
    caption = '★ Colher!'
  } else {
    state = 'growing'
    label = `Canteiro ${n}: ${CROPS[plot.crop].name.toLowerCase()} crescendo, pronto em ${formatDuration(growth.remainingMs)}`
    caption = formatDuration(growth.remainingMs)
  }

  return (
    <button type="button" className={`plot plot--${state}`} onClick={() => onActivate(index)} aria-label={label}>
      <span className="plot__soil" aria-hidden="true">
        {plot && growth && (
          <span className="plot__crop">
            <PixelSprite
              width={CROP_SPRITE_WIDTH}
              height={CROP_SPRITE_HEIGHT}
              layers={[{ grid: cropSprite(plot.crop, growth.stage) }]}
            />
          </span>
        )}
        {state === 'ready' && <span className="plot__sparkle" />}
      </span>
      {state === 'growing' && growth && (
        <span className="plot__bar" aria-hidden="true">
          {/* barra em 8 degraus, como num jogo */}
          <span className="plot__bar-fill" style={{ width: `${(Math.floor(growth.progress * 8) / 8) * 100}%` }} />
        </span>
      )}
      <span className="plot__caption" aria-hidden="true">
        {caption}
      </span>
    </button>
  )
}
