import { MODULES, type ModuleId } from '../data/modules'
import { hrefFor } from '../router'
import { ModuleIcon } from './icons'
import './BottomNav.css'

/** Barra inferior estilo minijogo com os quatro módulos. */
export function BottomNav({ current }: { current: ModuleId }) {
  return (
    <nav className="bottom-nav" aria-label="Módulos do Pru no Sekai">
      <ul className="bottom-nav__list">
        {MODULES.map((m) => (
          <li key={m.id}>
            <a href={hrefFor(m.id)} className="bottom-nav__link" aria-current={m.id === current ? 'page' : undefined}>
              <span className="bottom-nav__icon">
                <ModuleIcon id={m.id} />
              </span>
              <span className="bottom-nav__label">{m.shortName}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
