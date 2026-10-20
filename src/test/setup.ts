import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

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
  window.location.hash = ''
  reducedMotion = false
})
