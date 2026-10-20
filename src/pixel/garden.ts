import { PIXEL_COLORS as C } from './palette'

// Cenário do portão desenhado proceduralmente em um canvas de baixa
// resolução (1 pixel do canvas = 4px de CSS). O tamanho do canvas acompanha a
// tela, mas os objetos têm tamanho FIXO em pixels: no celular aparece o miolo
// (torii + Fuji), no desktop aparecem mais árvores e lanternas.

type Ctx = CanvasRenderingContext2D

export interface GardenLayout {
  /** Centro do vão do torii, em pixels do canvas (alvo do zoom de entrada). */
  focusX: number
  focusY: number
}

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

function disk(ctx: Ctx, cx: number, cy: number, r: number, color: string) {
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35)
    rect(ctx, cx - half, cy + dy, half * 2 + 1, 1, color)
  }
}

/** Ruído determinístico: o mesmo cenário sempre, sem Math.random. */
function hash(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) % 1000
}

function sky(ctx: Ctx, w: number, horizon: number) {
  const bands = ['#ffc9d9', '#ffd5e1', '#ffe1e8', '#ffecee', '#fff4ef']
  const bandH = horizon / bands.length
  for (let y = 0; y < horizon; y++) {
    const i = Math.min(bands.length - 1, Math.floor(y / bandH))
    rect(ctx, 0, y, w, 1, bands[i])
    // pontilhado (dithering) nas 2 linhas de transição entre faixas
    const intoBand = y - i * bandH
    if (i > 0 && intoBand < 2) {
      for (let x = (y + (intoBand < 1 ? 0 : 1)) % 2; x < w; x += 2) rect(ctx, x, y, 1, 1, bands[i - 1])
    }
  }
}

function cloud(ctx: Ctx, x: number, y: number, len: number) {
  rect(ctx, x + 3, y - 2, len - 8, 2, C.white)
  rect(ctx, x, y, len, 3, C.white)
  rect(ctx, x + 1, y + 3, len - 2, 1, '#ffe9ef')
}

function fuji(ctx: Ctx, cx: number, horizon: number) {
  const peak = horizon - 50
  for (let y = peak; y < horizon; y++) {
    const d = y - peak
    const half = 3 + Math.floor(d * 1.7)
    rect(ctx, cx - half, y, half + 1, 1, C.mountain)
    rect(ctx, cx + 1, y, half, 1, C.mountainShade)
    // neve com borda serrilhada
    for (let x = -half; x <= half; x++) {
      const snowy = d < 9 || (d < 13 && (x + d * 3 + 40) % 6 < 3)
      if (snowy) rect(ctx, cx + x, y, 1, 1, x > 0 ? C.snowShade : C.white)
    }
  }
}

function hills(ctx: Ctx, w: number, horizon: number) {
  for (let x = 0; x < w; x++) {
    const top = horizon - 6 + Math.round(3 * Math.sin(x / 9) + 2 * Math.sin(x / 4.3))
    rect(ctx, x, top, 1, horizon - top, C.sage)
    rect(ctx, x, top, 1, 1, C.sageLight)
  }
}

function ground(ctx: Ctx, w: number, h: number, horizon: number) {
  const mid = horizon + Math.floor((h - horizon) * 0.45)
  for (let y = horizon; y < h; y++) {
    const dark = y > mid || (y === mid && true)
    rect(ctx, 0, y, w, 1, dark ? '#c3d8b6' : C.sageLight)
    if (y === mid - 1) for (let x = y % 2; x < w; x += 2) rect(ctx, x, y, 1, 1, '#c3d8b6')
  }
  for (let y = horizon + 1; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = hash(x, y)
      if (n < 22) rect(ctx, x, y, 1, 1, C.sage)
      else if (n < 25) rect(ctx, x, y, 1, 1, C.sakuraMid)
    }
  }
}

function path(ctx: Ctx, cx: number, top: number, h: number) {
  for (let y = top; y < h; y++) {
    const half = 7 + Math.floor((y - top) * 0.35)
    rect(ctx, cx - half, y, half * 2 + 1, 1, '#f6e6c8')
    rect(ctx, cx - half, y, 1, 1, C.paperLine)
    rect(ctx, cx + half, y, 1, 1, C.paperLine)
    const row = Math.floor((y - top) / 5)
    if ((y - top) % 5 === 4) rect(ctx, cx - half, y, half * 2 + 1, 1, C.paperLine)
    else {
      const offset = row % 2 === 0 ? 0 : 5
      for (let x = -half + offset; x < half; x += 10) rect(ctx, cx + x, y, 1, 1, C.paperLine)
    }
  }
}

function sakuraTree(ctx: Ctx, x: number, base: number) {
  rect(ctx, x - 1, base - 24, 3, 24, C.trunk)
  rect(ctx, x + 1, base - 24, 1, 24, C.trunkDark)
  for (let i = 0; i < 7; i++) rect(ctx, x + 2 + i, base - 15 - i, 2, 1, C.trunk)
  for (let i = 0; i < 6; i++) rect(ctx, x - 2 - i, base - 18 - i, 2, 1, C.trunk)

  const cy = base - 30
  for (const [dx, dy, r] of [
    [0, 2, 12],
    [-10, 7, 9],
    [11, 6, 10],
  ]) disk(ctx, x + dx, cy + dy, r, C.sakuraDark)
  for (const [dx, dy, r] of [
    [0, 0, 12],
    [-10, 5, 9],
    [11, 4, 10],
  ]) disk(ctx, x + dx, cy + dy, r, C.sakuraMid)
  for (const [dx, dy, r] of [
    [-2, -3, 9],
    [-11, 2, 6],
    [8, 0, 7],
  ]) disk(ctx, x + dx, cy + dy, r, C.sakura)
  for (const [dx, dy, r] of [
    [-4, -6, 3],
    [6, -2, 3],
    [-12, 0, 2],
  ]) disk(ctx, x + dx, cy + dy, r, C.sakuraLight)
  for (let i = 0; i < 40; i++) {
    const px = x - 20 + (hash(i, x) % 41)
    const py = cy - 12 + (hash(x, i) % 24)
    if (hash(px, py) < 400) rect(ctx, px, py, 1, 1, C.white)
  }
}

function stoneLantern(ctx: Ctx, x: number, base: number) {
  rect(ctx, x - 4, base - 2, 9, 2, C.stoneDark)
  rect(ctx, x - 1, base - 9, 3, 7, C.stone)
  rect(ctx, x - 3, base - 11, 7, 2, C.stoneDark)
  rect(ctx, x - 2, base - 16, 5, 5, C.stone)
  rect(ctx, x - 1, base - 15, 3, 3, C.glow)
  rect(ctx, x - 4, base - 18, 9, 2, C.stoneDark)
  rect(ctx, x - 3, base - 19, 7, 1, C.stoneDark)
  rect(ctx, x, base - 21, 1, 2, C.stoneDark)
}

/** Retorna o topo das colunas do torii. */
function torii(ctx: Ctx, cx: number, groundY: number) {
  const top = groundY - 40
  for (const side of [-1, 1]) {
    const x = side < 0 ? cx - 19 : cx + 16
    rect(ctx, x, top, 4, 40, C.torii)
    rect(ctx, x, top, 1, 40, C.toriiLight)
    rect(ctx, x + 3, top, 1, 40, C.toriiDark)
    rect(ctx, x - 1, groundY - 3, 6, 3, C.lacquer)
  }
  // nuki (viga de baixo)
  rect(ctx, cx - 24, top + 9, 49, 3, C.torii)
  rect(ctx, cx - 24, top + 11, 49, 1, C.toriiDark)
  // shimaki (faixa vermelha sob o topo)
  rect(ctx, cx - 26, top, 53, 2, C.torii)
  rect(ctx, cx - 26, top + 1, 53, 1, C.toriiDark)
  // kasagi (topo laqueado com pontas curvas)
  rect(ctx, cx - 28, top - 3, 57, 3, C.lacquer)
  rect(ctx, cx - 28, top - 3, 57, 1, C.lacquerLight)
  rect(ctx, cx - 31, top - 5, 4, 2, C.lacquer)
  rect(ctx, cx + 28, top - 5, 4, 2, C.lacquer)
  rect(ctx, cx - 30, top - 4, 3, 1, C.lacquer)
  rect(ctx, cx + 28, top - 4, 3, 1, C.lacquer)
  // gakuzuka (placa central) com moldura dourada
  rect(ctx, cx - 4, top + 2, 9, 8, C.gold)
  rect(ctx, cx - 3, top + 3, 7, 6, C.lacquer)
  rect(ctx, cx - 1, top + 4, 3, 1, C.gold)
  rect(ctx, cx, top + 5, 1, 1, C.gold)
  rect(ctx, cx - 1, top + 7, 3, 1, C.gold)
  return top
}

export function drawGarden(ctx: Ctx, w: number, h: number): GardenLayout {
  ctx.imageSmoothingEnabled = false
  const cx = Math.floor(w / 2)
  const horizon = Math.round(h * 0.6)
  const groundY = horizon + 8

  sky(ctx, w, horizon)
  disk(ctx, cx + 30, horizon - 64, 8, '#ffb8c9')
  cloud(ctx, cx - 46, horizon - 72, 22)
  cloud(ctx, cx + 34, horizon - 44, 16)
  cloud(ctx, cx - 96, horizon - 50, 18)
  cloud(ctx, cx + 82, horizon - 84, 24)
  fuji(ctx, cx, horizon)
  hills(ctx, w, horizon)
  ground(ctx, w, h, horizon)
  path(ctx, cx, groundY - 1, h)

  const treeOffset = Math.max(42, Math.round(w * 0.32))
  sakuraTree(ctx, cx - treeOffset, horizon + 12)
  sakuraTree(ctx, cx + treeOffset, horizon + 12)
  if (w > 220) {
    sakuraTree(ctx, cx - treeOffset - 46, horizon + 6)
    sakuraTree(ctx, cx + treeOffset + 46, horizon + 6)
  }

  stoneLantern(ctx, cx - 30, groundY + 8)
  stoneLantern(ctx, cx + 30, groundY + 8)

  const top = torii(ctx, cx, groundY)

  // pétalas caídas no chão
  for (let i = 0; i < 30; i++) {
    const x = hash(i, 7) % w
    const y = groundY + (hash(7, i) % Math.max(1, h - groundY))
    rect(ctx, x, y, 2, 1, C.sakuraMid)
  }

  return { focusX: cx, focusY: top + 22 }
}
