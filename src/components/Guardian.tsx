import { GUARDIAN_MESSAGES } from '../data/guardianMessages'
import { useRotatingMessage } from '../hooks/useRotatingMessage'
import { Pigeon } from './Pigeon'
import './Guardian.css'

interface GuardianProps {
  greeting: string
  size?: 'lg' | 'sm'
}

/** Pombo-sama: balão de fala + pombo clicável que troca de mensagem. */
export function Guardian({ greeting, size = 'lg' }: GuardianProps) {
  const { message, next, count } = useRotatingMessage(GUARDIAN_MESSAGES, greeting)

  return (
    <div className={`guardian guardian--${size}`}>
      <p className="guardian__bubble" aria-live="polite">
        <span key={count} className="guardian__text">
          {message}
        </span>
      </p>
      <button type="button" className="guardian__button" onClick={next} aria-label="Cutucar o Pombo-sama para ouvir outra mensagem">
        <span key={count} className={count > 0 ? 'guardian__poke' : undefined}>
          <Pigeon hat="eboshi" />
        </span>
      </button>
      <p className="guardian__hint" aria-hidden="true">
        toque no pombo
      </p>
    </div>
  )
}
