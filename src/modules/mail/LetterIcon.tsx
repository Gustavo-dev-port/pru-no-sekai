import { PixelSprite } from '../../pixel/PixelSprite'
import { LETTER_ICONS } from '../../pixel/sprites/mail'

/**
 * Ícone da carta em pixel art. O dado continua sendo o emoji da coleção;
 * aqui ele vira a versão pixel. Emoji sem desenho aparece como texto.
 */
export function LetterIcon({ icon, scale = 4 }: { icon: string; scale?: number }) {
  const grid = LETTER_ICONS[icon]
  if (!grid) return <span aria-hidden="true">{icon}</span>
  return <PixelSprite width={8} height={8} layers={[{ grid }]} scale={scale} className="letter-icon" />
}
