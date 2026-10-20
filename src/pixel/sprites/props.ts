// Objetos do mundo, todos na mesma escala do pombo (1 pixel = 4px de CSS).

/** Lanterna de papel (chōchin). Rosa: recolor { r: 's', R: 'S' } via cores. */
export const LANTERN = {
  width: 8,
  height: 14,
  grid: [
    '...kk...',
    '..KKKK..',
    '.rrrrrr.',
    'rrLLLLrr',
    'RRRRRRRR',
    'rLLLLLLr',
    'rLLLLLLr',
    'RRRRRRRR',
    'rrLLLLrr',
    '.rrrrrr.',
    '..KKKK..',
    '...yy...',
    '...yy...',
    '....y...',
  ],
} as const

/** Pétala de sakura caindo. */
export const PETAL = {
  width: 3,
  height: 3,
  grid: ['ss.', 'sls', '.s.'],
} as const

/** Caixa de omikuji (御籤): madeira laqueada vermelha com etiqueta. */
export const OMIKUJI_BOX = {
  width: 16,
  height: 24,
  grid: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '...kkkkkkkkkk...',
    '..kKKKKKKKKKKk..',
    '..kKKKKkkKKKKk..',
    '..kkkkkkkkkkkk..',
    '..kqrRrrrrRrrk..',
    '..kqrRuuuuRrrk..',
    '..kqrRuRRuRrrk..',
    '..kqrRuuuuRrrk..',
    '..kqrRuRRuRrrk..',
    '..kqrRuuuuRrrk..',
    '..kqrRuRRuRrrk..',
    '..kqrRuuuuRrrk..',
    '..kqrRrrrrRrrk..',
    '..kqrRrrrrRrrk..',
    '..kqrRrrrrRrrk..',
    '.kkkkkkkkkkkkkk.',
    '.kKKKKKKKKKKKKk.',
    '.kkkkkkkkkkkkkk.',
    '..zzzzzzzzzzzz..',
  ],
} as const

/** Palitinho numerado que sai pelo furo da caixa. */
export const OMIKUJI_STICK = {
  width: 16,
  height: 24,
  grid: [
    '.......kk.......',
    '......krrk......',
    '......kook......',
    '......kook......',
    '......kook......',
    '......kook......',
    '......kook......',
  ],
} as const

/** Nó de cordão vermelho que pendura as ema. */
export const EMA_KNOT = {
  width: 12,
  height: 7,
  grid: ['.....rr.....', '....r..r....', '...r....r...', '.rrr.kk.rrr.', 'rr..kOOk..rr', '....kOOk....', '.....kk.....'],
} as const

/** Rabinho do balão de fala, em degraus. */
export const BUBBLE_TAIL = {
  width: 7,
  height: 4,
  grid: ['kuuuuuk', '.kuuuk.', '..kuk..', '...k...'],
} as const
