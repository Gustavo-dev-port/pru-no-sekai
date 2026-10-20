import { useEffect, useState } from 'react'
import { MODULES, type ModuleId } from './data/modules'

// Roteamento por hash (#/oraculo): funciona em qualquer hospedagem
// estática, sem regra de rewrite e sem biblioteca extra.
export function parseHash(hash: string): ModuleId {
  const path = hash.replace(/^#/, '') || '/'
  return MODULES.find((m) => m.path === path)?.id ?? 'santuario'
}

export function hrefFor(id: ModuleId): string {
  const mod = MODULES.find((m) => m.id === id)
  return `#${mod?.path ?? '/'}`
}

export function useRoute(): ModuleId {
  const [route, setRoute] = useState<ModuleId>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}
