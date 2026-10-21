import { RARITY_LABEL, type LoveLetter } from '../../data/loveLetters'
import { Envelope } from './Envelope'
import { LetterIcon } from './LetterIcon'

export type LetterState = 'locked' | 'discovered' | 'opened'

interface LetterCardProps {
  letter: LoveLetter
  state: LetterState
  /** Acabou de chegar pelo pombo-carteiro. */
  isNew: boolean
  /** Dica de desbloqueio (só para cartas bloqueadas). */
  hint: string
  onOpen: (id: number) => void
}

/**
 * Carta no álbum, em 3 estados:
 * - bloqueada: envelope cinza, título escondido, raridade e dica visíveis;
 * - descoberta: envelope lacrado, título, ícone e "Abrir";
 * - lida: envelope aberto e "Ler de novo".
 */
export function LetterCard({ letter, state, isNew, hint, onOpen }: LetterCardProps) {
  const rarity = RARITY_LABEL[letter.rarity]

  if (state === 'locked') {
    return (
      <div className={`letter-card letter-card--locked letter-card--${letter.rarity} px-box`}>
        <span className="letter-card__art">
          <Envelope rarity={letter.rarity} locked />
          <span className="letter-card__lock" aria-hidden="true">
            ?
          </span>
        </span>
        <span className="letter-card__title" aria-hidden="true">
          ???
        </span>
        <span className="visually-hidden">Carta bloqueada.</span>
        <span className={`rarity-seal rarity-seal--${letter.rarity}`}>{rarity}</span>
        <span className="letter-card__hint">
          <span className="visually-hidden">Dica: </span>
          {hint}
        </span>
      </div>
    )
  }

  const action = state === 'opened' ? 'Ler de novo' : 'Abrir'
  return (
    <button
      type="button"
      className={`letter-card letter-card--${state} letter-card--${letter.rarity} px-box ${isNew ? 'letter-card--new' : ''}`}
      onClick={() => onOpen(letter.id)}
      aria-label={`${action}: carta "${letter.title}" (${rarity.toLowerCase()})${isNew ? ', nova' : ''}`}
    >
      {isNew && (
        <span className="letter-card__new" aria-hidden="true">
          Nova!
        </span>
      )}
      <span className="letter-card__art" aria-hidden="true">
        <Envelope rarity={letter.rarity} open={state === 'opened'} />
        <span className="letter-card__icon">
          <LetterIcon icon={letter.icon} scale={3} />
        </span>
      </span>
      <span className="letter-card__title" aria-hidden="true">
        {letter.title}
      </span>
      <span className={`rarity-seal rarity-seal--${letter.rarity}`} aria-hidden="true">
        {rarity}
      </span>
      <span className="letter-card__action" aria-hidden="true">
        {state === 'opened' ? '↺ Ler de novo' : '▶ Abrir'}
      </span>
    </button>
  )
}
