import { GardenScene } from '../../components/GardenScene'
import { Guardian } from '../../components/Guardian'
import { SakuraPetals } from '../../components/SakuraPetals'
import { GUARDIAN_GREETING_GATE } from '../../data/guardianMessages'
import { useFocusOnMount } from '../../hooks/useFocusOnMount'

interface GateProps {
  entering: boolean
  onEnter: () => void
}

/**
 * Durante a travessia (1,3 s) o botão NÃO recebe `disabled`: um botão
 * desabilitado perde o foco, que cairia no <body>. Ele continua focado,
 * marcado como aria-disabled, e o resto da tela fica `inert`.
 * Ao terminar, o pátio leva o foco ao seu título (useFocusOnMount).
 */
export function Gate({ entering, onEnter }: GateProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>()

  const handleEnter = () => {
    if (!entering) onEnter()
  }

  return (
    <main className={`gate ${entering ? 'gate--entering' : ''}`} aria-busy={entering}>
      <div className="gate__scene">
        <GardenScene />
      </div>
      <SakuraPetals />

      <div className="gate__ui">
        <header className="gate__title" inert={entering}>
          <p className="gate__jp jp" lang="ja">
            プルの世界
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            Pru no Sekai
          </h1>
          <p className="gate__subtitle">o mundo da Pru</p>
        </header>

        <div className="gate__bottom">
          <div inert={entering}>
            <Guardian greeting={GUARDIAN_GREETING_GATE} />
          </div>
          <button
            type="button"
            className="btn btn--primary gate__enter"
            onClick={handleEnter}
            aria-disabled={entering || undefined}
          >
            {entering ? 'Atravessando…' : '⛩ Atravessar o torii'}
          </button>
        </div>
      </div>

      <p className="visually-hidden" role="status">
        {entering ? 'Atravessando o torii. Entrando no santuário…' : ''}
      </p>

      <div className="gate__flash" aria-hidden="true" />
    </main>
  )
}
