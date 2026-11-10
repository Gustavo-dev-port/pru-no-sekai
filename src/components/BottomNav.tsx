import { MODULES, type ModuleId } from '../data/modules'
import { hrefFor } from '../router'
import { ModuleIcon } from './icons'
import './BottomNav.css'

interface BottomNavProps {
  current: ModuleId
  /** Com uma janela modal aberta, a barra não recebe foco nem toques. */
  inert?: boolean
}

/** Barra inferior estilo minijogo com os cinco módulos. */
export function BottomNav({ current, inert = false }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Módulos do Pru no Sekai" inert={inert}>
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
