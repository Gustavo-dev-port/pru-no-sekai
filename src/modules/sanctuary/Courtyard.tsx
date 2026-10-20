import { Guardian } from '../../components/Guardian'
import { ModuleIcon } from '../../components/icons'
import { PaperLanterns } from '../../components/PaperLanterns'
import { SakuraPetals } from '../../components/SakuraPetals'
import { GUARDIAN_GREETING_INSIDE } from '../../data/guardianMessages'
import { MODULES } from '../../data/modules'
import { useFocusOnMount } from '../../hooks/useFocusOnMount'
import { hrefFor } from '../../router'

const EXPERIENCES = MODULES.filter((m) => m.id !== 'santuario')

interface CourtyardProps {
  onBackToGate: () => void
}

/** Pátio interno: cada experiência é uma ema (plaquinha de madeira de pedidos). */
export function Courtyard({ onBackToGate }: CourtyardProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>()

  return (
    <div className="courtyard">
      <SakuraPetals count={8} />
      <PaperLanterns />

      <main className="courtyard__main">
        <header className="courtyard__header">
          <p className="eyebrow">
            <span className="jp" lang="ja">
              神社
            </span>{' '}
            · Módulo 1
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            Santuário da Grande Pru
          </h1>
        </header>

        <Guardian greeting={GUARDIAN_GREETING_INSIDE} size="sm" />

        <nav aria-label="Experiências do santuário" className="courtyard__nav">
          <ul className="ema-grid">
            {EXPERIENCES.map((m, i) => (
              <li key={m.id} style={{ animationDelay: `${150 + i * 120}ms` }}>
                <a className="ema" href={hrefFor(m.id)}>
                  <span className="ema__hole" aria-hidden="true" />
                  <span className="ema__icon">
                    <ModuleIcon id={m.id} />
                  </span>
                  <span className="ema__jp jp" lang="ja" aria-hidden="true">
                    {m.jp}
                  </span>
                  <span className="ema__name">{m.name}</span>
                  <span className="ema__tagline">{m.tagline}</span>
                  {m.status === 'em-construcao' && <span className="badge badge--wip">Em construção</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button type="button" className="btn btn--ghost" onClick={onBackToGate}>
          Voltar ao portão
        </button>
      </main>

      <footer className="courtyard__footer">feito com milho e carinho 🌸</footer>
    </div>
  )
}
