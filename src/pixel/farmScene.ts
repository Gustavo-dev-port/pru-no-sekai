import { disk, hash, rect, type Ctx } from './garden'
import { PIXEL_COLORS as C } from './palette'

// Fundo da Fazendinha (1 pixel = 4px): céu, cerca, galpãozinho e grama.
// Os canteiros são botões por cima deste fundo.

export function drawFarm(ctx: Ctx, w: number, h: number) {
  ctx.imageSmoothingEnabled = false
  // céu em faixas com pontilhado
  rect(ctx, 0, 0, w, 6, C.sakuraLight)
  rect(ctx, 0, 6, w, 6, '#fff0f3')
  for (let x = 0; x < w; x += 2) rect(ctx, x, 6, 1, 1, C.sakuraLight)
  // colinas ao fundo
  for (let x = 0; x < w; x++) {
    const top = 9 + Math.round(2 * Math.sin(x / 7))
    rect(ctx, x, top, 1, 14 - top, C.sage)
  }
  // grama
  rect(ctx, 0, 14, w, h - 14, C.sageLight)
  for (let y = 15; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = hash(x, y)
      if (n < 30) rect(ctx, x, y, 1, 1, C.sage)
      else if (n < 33) rect(ctx, x, y, 1, 1, C.white)
      else if (n < 35) rect(ctx, x, y, 1, 1, C.sakuraMid)
    }
  }
  // cerca de madeira
  rect(ctx, 0, 11, w, 1, C.woodDark)
  rect(ctx, 0, 13, w, 1, C.woodDark)
  for (let x = 2; x < w; x += 6) {
    rect(ctx, x, 9, 2, 6, C.wood)
    rect(ctx, x + 1, 9, 1, 6, C.woodDark)
  }
  // galpãozinho no canto direito
  const sx = w - 16
  rect(ctx, sx, 4, 12, 2, C.toriiDark)
  rect(ctx, sx - 1, 6, 14, 2, C.torii)
  rect(ctx, sx, 8, 12, 7, C.wood)
  rect(ctx, sx + 4, 10, 4, 5, C.woodDark)
  rect(ctx, sx + 1, 9, 2, 2, C.glow)
  // arbusto de sakura no canto esquerdo
  disk(ctx, 5, 10, 4, C.sakuraMid)
  disk(ctx, 4, 9, 2, C.sakura)
}
