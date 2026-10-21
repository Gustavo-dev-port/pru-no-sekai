import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { resetProgress } from '../lib/progress'

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

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  localStorage.clear()
  resetProgress()
  window.location.hash = ''
  reducedMotion = false
})

// jsdom não tem canvas: o cenário simplesmente não é desenhado nos testes.
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext
