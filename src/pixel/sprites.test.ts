import { describe, expect, it } from 'vitest'
import { SPRITE_PALETTE } from './palette'
import * as icons from './sprites/icons'
import * as mail from './sprites/mail'
import * as pigeon from './sprites/pigeon'
import * as props from './sprites/props'

// Garante a consistência das grades: toda linha com a largura certa e
// todo caractere existente na paleta (um erro de digitação vira teste vermelho).
function checkGrid(name: string, grid: readonly string[], width: number, maxHeight: number) {
  expect(grid.length, `${name}: altura`).toBeLessThanOrEqual(maxHeight)
  grid.forEach((row, y) => {
    expect(row.length, `${name} linha ${y}: largura`).toBe(width)
    for (const ch of row) {
      if (ch !== '.') expect(SPRITE_PALETTE[ch], `${name} linha ${y}: cor "${ch}"`).toBeDefined()
    }
  })
}

describe('sprites em pixel art', () => {
  it('pombo: todas as camadas e acessórios cabem na grade 24×28', () => {
    for (const key of ['PIGEON_BODY', 'PIGEON_HEAD', 'PIGEON_BLINK', 'PIGEON_WING_DOWN', 'PIGEON_WING_UP', 'PIGEON_WING_OPEN'] as const) {
      checkGrid(key, pigeon[key], pigeon.PIGEON_WIDTH, pigeon.PIGEON_HEIGHT - pigeon.PIGEON_BASE_Y)
    }
    for (const [name, grid] of Object.entries(pigeon.PIGEON_EXPRESSIONS)) {
      checkGrid(`expressão ${name}`, grid, pigeon.PIGEON_WIDTH, pigeon.PIGEON_HEAD.length)
    }
    checkGrid('PIGEON_EXCLAIM', pigeon.PIGEON_EXCLAIM.grid, pigeon.PIGEON_WIDTH, 8)
    for (const key of ['HAT_GUARDIAN', 'HAT_SEER', 'HAT_MAIL', 'BAG_MAIL', 'HAT_KING'] as const) {
      const acc = pigeon[key]
      checkGrid(key, acc.grid, pigeon.PIGEON_WIDTH, pigeon.PIGEON_HEIGHT)
      expect(pigeon.PIGEON_BASE_Y + acc.top, `${key}: não sai pelo topo`).toBeGreaterThanOrEqual(0)
      expect(pigeon.PIGEON_BASE_Y + acc.top + acc.grid.length).toBeLessThanOrEqual(pigeon.PIGEON_HEIGHT)
    }
  })

  it('objetos do cenário', () => {
    for (const [name, sprite] of Object.entries(props)) {
      checkGrid(name, sprite.grid, sprite.width, sprite.height)
    }
  })

  it('correio: envelopes, caixa de correio e ícones das cartas', () => {
    checkGrid('ENVELOPE_CLOSED', mail.ENVELOPE_CLOSED, mail.ENVELOPE_WIDTH, mail.ENVELOPE_HEIGHT)
    checkGrid('ENVELOPE_OPEN', mail.ENVELOPE_OPEN, mail.ENVELOPE_WIDTH, mail.ENVELOPE_HEIGHT)
    checkGrid('POSTBOX', mail.POSTBOX.grid, mail.POSTBOX.width, mail.POSTBOX.height)
    for (const [emoji, grid] of Object.entries(mail.LETTER_ICONS)) checkGrid(`ícone ${emoji}`, grid, 8, 8)
  })

  it('ícones: módulos 12×12, categorias 8×8', () => {
    for (const [name, grid] of Object.entries(icons)) {
      const size = grid[0].length
      expect([8, 12]).toContain(size)
      checkGrid(name, grid, size, size)
    }
  })
})
