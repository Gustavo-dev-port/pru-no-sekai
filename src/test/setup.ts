import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { reloadSaveForTests } from '../lib/save'
import { createFakeLockManager } from './fakeLocks'

// jsdom não implementa matchMedia nem scrollTo.
let reducedMotion = false

export function setReducedMotion(value: boolean) {
  reducedMotion = value
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})

// jsdom não tem Web Locks: usa um LockManager de teste (o mesmo para todas as "abas")
Object.defineProperty(navigator, 'locks', { configurable: true, value: createFakeLockManager() })
reloadSaveForTests({ locks: navigator.locks })

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  localStorage.clear()
  // cada teste começa com um navegador "novo": armazenamento vazio e Web Locks
  reloadSaveForTests({ locks: createFakeLockManager() })
  window.location.hash = ''
  reducedMotion = false
})

// jsdom não tem canvas: o cenário simplesmente não é desenhado nos testes.
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext
