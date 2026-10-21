import { GUARDIAN_MESSAGES } from '../data/guardianMessages'
import { useRotatingMessage } from '../hooks/useRotatingMessage'
import { recordPoke } from '../lib/progress'
import { PixelSprite } from '../pixel/PixelSprite'
import { BUBBLE_TAIL } from '../pixel/sprites/props'
import { Pigeon } from './Pigeon'
import './Guardian.css'

interface GuardianProps {
  greeting: string
}

/** Pombo-sama: caixa de diálogo + pombo clicável que troca de mensagem. */
export function Guardian({ greeting }: GuardianProps) {
  const { message, next, count } = useRotatingMessage(GUARDIAN_MESSAGES, greeting)

  // cada cutucada conta para a carta "clicar em pombo 3 vezes" do Correio
  const poke = () => {
    recordPoke()
    next()
  }

  return (
    <div className="guardian">
      <div className="guardian__dialog">
        <p className="guardian__bubble px-box" aria-live="polite">
          <span className="guardian__name" aria-hidden="true">
            Pombo-sama
          </span>
          <span key={count} className="guardian__text">
            {message}
          </span>
        </p>
        <span className="guardian__tail">
          <PixelSprite width={BUBBLE_TAIL.width} height={BUBBLE_TAIL.height} layers={[{ grid: BUBBLE_TAIL.grid }]} />
        </span>
      </div>
      <button type="button" className="guardian__button" onClick={poke} aria-label="Cutucar o Pombo-sama para ouvir outra mensagem">
        <Pigeon hat="eboshi" pokeCount={count} />
      </button>
      <p className="guardian__hint" aria-hidden="true">
        ▲ toque no pombo
      </p>
    </div>
  )
}
