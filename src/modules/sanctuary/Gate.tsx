import { GardenScene } from '../../components/GardenScene'
import { Guardian } from '../../components/Guardian'
import { SakuraPetals } from '../../components/SakuraPetals'
import { GUARDIAN_GREETING_GATE } from '../../data/guardianMessages'
import { useFocusOnMount } from '../../hooks/useFocusOnMount'

interface GateProps {
  entering: boolean
  onEnter: () => void
}

export function Gate({ entering, onEnter }: GateProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>()

  return (
    <main className={`gate ${entering ? 'gate--entering' : ''}`} aria-busy={entering}>
      <div className="gate__scene">
        <GardenScene />
      </div>
      <SakuraPetals />

      <div className="gate__ui">
        <header className="gate__title">
          <p className="gate__jp jp" lang="ja">
            プルの世界
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            Pru no Sekai
          </h1>
          <p className="gate__subtitle">o mundo da Pru</p>
        </header>

        <div className="gate__bottom">
          <Guardian greeting={GUARDIAN_GREETING_GATE} />
          <button type="button" className="btn btn--primary gate__enter" onClick={onEnter} disabled={entering}>
            {entering ? 'Atravessando…' : '⛩ Atravessar o torii'}
          </button>
        </div>
      </div>

      <div className="gate__flash" aria-hidden="true" />
    </main>
  )
}
