// Ícones em pixel art. Grades em src/pixel/sprites/icons.ts.
import type { FortuneIcon } from '../data/fortunes'
import type { ModuleId } from '../data/modules'
import { PixelSprite } from '../pixel/PixelSprite'
import {
  ICON_BIRD,
  ICON_BRUSH,
  ICON_FLOWER,
  ICON_GRAIN,
  ICON_HEART,
  ICON_LETTER,
  ICON_OMIKUJI,
  ICON_SPARKLES,
  ICON_SPROUT,
  ICON_SUN,
  ICON_TORII,
} from '../pixel/sprites/icons'

const MODULE_ICONS: Record<ModuleId, readonly string[]> = {
  santuario: ICON_TORII,
  oraculo: ICON_OMIKUJI,
  alimentar: ICON_GRAIN,
  correio: ICON_LETTER,
  fazenda: ICON_SPROUT,
}

const FORTUNE_ICONS: Record<FortuneIcon, readonly string[]> = {
  heart: ICON_HEART,
  sun: ICON_SUN,
  bird: ICON_BIRD,
  flower: ICON_FLOWER,
  palette: ICON_BRUSH,
  sparkles: ICON_SPARKLES,
}

/** Ícone 12×12. `scale` 3 na barra inferior (36px), 4 nas ema (48px). */
export function ModuleIcon({ id, scale = 3 }: { id: ModuleId; scale?: number }) {
  return <PixelSprite width={12} height={12} layers={[{ grid: MODULE_ICONS[id] }]} scale={scale} />
}

/** Ícone 8×8 das categorias do oráculo (24px). */
export function FortuneIconSvg({ icon }: { icon: FortuneIcon }) {
  return <PixelSprite width={8} height={8} layers={[{ grid: FORTUNE_ICONS[icon] }]} scale={3} />
}
