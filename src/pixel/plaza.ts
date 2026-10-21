import { disk, hash, rect, stoneLantern, type Ctx } from './garden'
import { PIXEL_COLORS as C } from './palette'

// Praça dos Pombos (鳩の広場), desenhada em canvas como o portão do santuário
// (1 pixel = 4px). Tudo aqui é FUNDO: os pombos, grãos e a faixa da invasão
// ficam sempre por cima, então a decoração nunca esconde o jogo.
// Os enfeites ficam na faixa de cima e nos cantos; o meio é a área dos pombos.

const TILE = '#f3e6cc'
const TILE_LIGHT = '#fbf3e3'
const GROUT = '#dcc9a3'

/** Altura (em pixels do canvas) da faixa de céu + cerca no topo. */
export const PLAZA_BACK_ROWS = 16

function sky(ctx: Ctx, w: number) {
  rect(ctx, 0, 0, w, 10, C.sakuraLight)
  rect(ctx, 0, 10, w, 4, '#fff0f3')
  for (let x = 0; x < w; x += 2) rect(ctx, x, 9, 1, 1, '#fff0f3')
  for (let x = 1; x < w; x += 2) rect(ctx, x, 10, 1, 1, C.sakuraLight)
}

/** Cerca baixa de bambu (tamagaki) separando o céu da praça. */
function fence(ctx: Ctx, w: number) {
  rect(ctx, 0, 11, w, 1, C.woodDark)
  rect(ctx, 0, 14, w, 1, C.woodDark)
  for (let x = 1; x < w; x += 4) {
    rect(ctx, x, 9, 2, 7, C.wood)
    rect(ctx, x + 1, 9, 1, 7, C.woodDark)
  }
  rect(ctx, 0, 15, w, 1, C.sage)
}

/** Ladrilhos de pedra em fileiras desencontradas, com rejunte e brilho. */
function tiles(ctx: Ctx, w: number, h: number) {
  const top = PLAZA_BACK_ROWS
  rect(ctx, 0, top, w, h - top, TILE)
  const tileW = 8
  const tileH = 5
  for (let row = 0; top + row * tileH < h; row++) {
    const y = top + row * tileH
    rect(ctx, 0, y + tileH - 1, w, 1, GROUT)
    const offset = row % 2 === 0 ? 0 : tileW / 2
    for (let x = -offset; x < w; x += tileW) {
      rect(ctx, x + tileW - 1, y, 1, tileH - 1, GROUT)
      rect(ctx, x, y, 2, 1, TILE_LIGHT)
      // musguinho de vez em quando
      if (hash(x, y) < 90) rect(ctx, x + 3, y + 2, 1, 1, C.sage)
    }
  }
}

/** Faixas de grama nas laterais, com tufinhos. */
function grassBorders(ctx: Ctx, w: number, h: number) {
  const top = PLAZA_BACK_ROWS
  for (const x0 of [0, w - 4]) {
    rect(ctx, x0, top, 4, h - top, C.sageLight)
    for (let y = top; y < h; y += 3) rect(ctx, x0 + (y % 2) + 1, y, 1, 1, C.sage)
  }
  rect(ctx, 4, top, 1, h - top, C.sage)
  rect(ctx, w - 5, top, 1, h - top, C.sage)
}

/** Canteiro de madeira com arbusto e florzinhas, nos cantos de baixo. */
function flowerBed(ctx: Ctx, x: number, h: number) {
  const top = h - 9
  rect(ctx, x, top + 4, 12, 5, C.woodDark)
  rect(ctx, x + 1, top + 5, 10, 3, C.wood)
  disk(ctx, x + 3, top + 3, 3, C.sageDark)
  disk(ctx, x + 8, top + 3, 3, C.sageDark)
  disk(ctx, x + 5, top + 1, 3, C.sage)
  for (const [dx, dy] of [
    [2, 1],
    [6, 0],
    [9, 2],
    [4, 3],
  ]) {
    rect(ctx, x + dx, top + dy, 1, 1, C.sakuraMid)
  }
}

/** Cerejeira pequena no canto de cima, à esquerda. */
function smallSakura(ctx: Ctx, x: number) {
  rect(ctx, x - 1, 6, 3, 18, C.trunk)
  rect(ctx, x + 1, 6, 1, 18, C.trunkDark)
  for (let i = 0; i < 4; i++) rect(ctx, x + 2 + i, 12 - i, 1, 1, C.trunk)
  disk(ctx, x, 5, 8, C.sakuraDark)
  disk(ctx, x, 4, 8, C.sakuraMid)
  disk(ctx, x - 2, 2, 5, C.sakura)
  disk(ctx, x + 6, 7, 4, C.sakuraMid)
  disk(ctx, x - 3, 0, 2, C.sakuraLight)
  for (let i = 0; i < 10; i++) rect(ctx, x - 7 + (hash(i, 3) % 15), 1 + (hash(3, i) % 9), 1, 1, C.white)
}

/**
 * Cantinho de descanso dos pombos: banquinho de madeira com almofada de
 * palha (zabuton) e uma tigelinha d'água.
 */
function restCorner(ctx: Ctx, x: number) {
  const seat = 18
  rect(ctx, x, seat, 13, 2, C.woodDark)
  rect(ctx, x, seat, 13, 1, C.wood)
  rect(ctx, x + 1, seat + 2, 2, 4, C.woodDark)
  rect(ctx, x + 10, seat + 2, 2, 4, C.woodDark)
  rect(ctx, x + 3, seat - 2, 7, 2, C.sakuraMid)
  rect(ctx, x + 3, seat - 2, 7, 1, C.sakura)
  // tigelinha d'água ao lado
  rect(ctx, x + 15, seat + 3, 5, 2, C.stoneDark)
  rect(ctx, x + 16, seat + 3, 3, 1, '#bfe3ef')
}

export function drawPlaza(ctx: Ctx, w: number, h: number) {
  ctx.imageSmoothingEnabled = false
  sky(ctx, w)
  fence(ctx, w)
  tiles(ctx, w, h)
  grassBorders(ctx, w, h)
  smallSakura(ctx, 8)
  restCorner(ctx, w - 30)
  stoneLantern(ctx, w - 7, 24)
  flowerBed(ctx, 1, h)
  flowerBed(ctx, w - 13, h)
  // pétalas caídas nos ladrilhos
  for (let i = 0; i < 12; i++) {
    const px = 6 + (hash(i, 11) % Math.max(1, w - 12))
    const py = PLAZA_BACK_ROWS + 2 + (hash(11, i) % Math.max(1, h - PLAZA_BACK_ROWS - 12))
    rect(ctx, px, py, 2, 1, C.sakuraMid)
  }
}
