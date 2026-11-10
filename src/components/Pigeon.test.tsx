import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setReducedMotion } from '../test/setup'
import { Pigeon } from './Pigeon'

const hopping = (container: HTMLElement) => container.querySelector('.pigeon--hop') !== null

describe('Pigeon — pulinho da cutucada', () => {
  it('uma cutucada nova faz o pombo pular', () => {
    const { container, rerender } = render(<Pigeon pokeCount={0} />)
    expect(hopping(container)).toBe(false)
    rerender(<Pigeon pokeCount={1} />)
    expect(hopping(container)).toBe(true)
  })

  it('montar o pombo com cutucadas antigas NÃO faz ele pular (carteiro remontado nas entregas)', () => {
    const { container, rerender } = render(<Pigeon key="idle" hat="mail" pokeCount={3} />)
    expect(hopping(container)).toBe(false)
    // a entrega começa e termina: o pombo é remontado com a mesma contagem
    rerender(<Pigeon key="fly-1" hat="mail" pokeCount={3} flapOnMountMs={0} />)
    expect(hopping(container)).toBe(false)
    rerender(<Pigeon key="idle" hat="mail" pokeCount={3} />)
    expect(hopping(container)).toBe(false)
    // e a próxima cutucada de verdade continua funcionando
    rerender(<Pigeon key="idle" hat="mail" pokeCount={4} />)
    expect(hopping(container)).toBe(true)
  })

  it('com movimento reduzido não pula, nem na cutucada', () => {
    setReducedMotion(true)
    const { container, rerender } = render(<Pigeon pokeCount={0} />)
    rerender(<Pigeon pokeCount={1} />)
    expect(hopping(container)).toBe(false)
  })
})
