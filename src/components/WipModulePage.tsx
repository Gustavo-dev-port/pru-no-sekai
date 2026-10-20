import { getModule, type ModuleId } from '../data/modules'
import { useFocusOnMount } from '../hooks/useFocusOnMount'
import { hrefFor } from '../router'
import { BottomNav } from './BottomNav'
import { Pigeon, type PigeonHat } from './Pigeon'
import './WipModulePage.css'

interface WipModulePageProps {
  id: ModuleId
  hat: PigeonHat
}

/**
 * Tela honesta de "em construção": mostra o que o módulo vai ter,
 * com cada item marcado como pendente até ser implementado de verdade.
 */
export function WipModulePage({ id, hat }: WipModulePageProps) {
  const mod = getModule(id)
  const headingRef = useFocusOnMount<HTMLHeadingElement>()

  return (
    <div className="wip-page">
      <main className="wip-page__main">
        <header className="wip-page__header">
          <p className="eyebrow">
            <span className="jp">{mod.jp}</span> · Módulo {mod.number}
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            {mod.name}
          </h1>
          <p className="wip-page__tagline">{mod.tagline}</p>
        </header>

        <section className="wip-card" aria-labelledby={`${id}-status`}>
          <div className="wip-card__pigeon">
            <Pigeon hat={hat} />
          </div>
          <span id={`${id}-status`} className="badge badge--wip">
            Em construção
          </span>
          <p className="wip-card__line">{mod.wipLine}</p>

          <h2 className="wip-card__title">O que vai ter aqui</h2>
          <ul className="wip-card__list">
            {mod.features.map((f) => (
              <li key={f.label} className={f.done ? 'is-done' : undefined}>
                <span className="wip-card__check" aria-hidden="true">
                  {f.done ? '✓' : ''}
                </span>
                {f.label}
                <span className="visually-hidden">{f.done ? ' (pronto)' : ' (pendente)'}</span>
              </li>
            ))}
          </ul>
        </section>

        <a className="btn" href={hrefFor('santuario')}>
          ⛩ Voltar ao santuário
        </a>
      </main>
      <BottomNav current={id} />
    </div>
  )
}
