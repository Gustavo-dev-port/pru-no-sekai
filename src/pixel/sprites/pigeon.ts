// Pombo base: 24×24 pixels, olhando para a esquerda. O canvas do sprite tem
// 24×28 porque os chapéus sobem até 4 pixels acima da cabeça
// (PIGEON_BASE_Y). Cada parte é uma camada, para animar só o que mexe:
// cabeça (bob), olho (piscada), asa (bater asinhas).
// Todas as variações por função usam ESTE mesmo corpo e cabeça.

export const PIGEON_WIDTH = 24
export const PIGEON_HEIGHT = 28
export const PIGEON_BASE_Y = 4

export const PIGEON_BODY = [
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '....knnnnnnnnk..........',
  '...knnppppnnnnkkkkk.....',
  '...kgnpppnnnnGGGGGkk....',
  '..kgggnnnnnGGGGGGGGGkkkk',
  '..kgggggggGGGGGGGGGGGddk',
  '.kggggggggGGGGGGGGGGGddk',
  '.kgggggggggGGGGGGGGGkkkk',
  '.kgggggggggggGGGGGGGk...',
  '..kgggggggggggGGGGGk....',
  '...kkgggggggggggGkk.....',
  '.....kkkkkkkkkkkk.......',
  '.......b....b...........',
  '......bbb..bbb..........',
  '....zzzzzzzzzzzz........',
] as const

export const PIGEON_HEAD = [
  '........................',
  '......kkkkkk............',
  '....kkGGGGGGkk..........',
  '...kGGGGGGGGGGk.........',
  '...kGewGGGGGGGk.........',
  '.kkkGeeGGGGGGGk.........',
  'kbbwGGGGGGGGGGk.........',
  '.kkkGGGccGGGGGk.........',
  '...kGGGGGGGGGGk.........',
  '....kGGGGGGGGk..........',
] as const

/** Pálpebra: cobre a metade de cima do olho. */
export const PIGEON_BLINK = [
  '........................',
  '........................',
  '........................',
  '........................',
  '.....GG.................',
] as const

export const PIGEON_WING_DOWN = [
  ...Array<string>(13).fill('........................'),
  '..........kkkkkkkk......',
  '.........khhhhhhhhk.....',
  '.........khddhhhddk.....',
  '..........khddhhhddk....',
  '...........kkkkkkkkk....',
] as const

export const PIGEON_WING_UP = [
  ...Array<string>(8).fill('........................'),
  '................kk......',
  '..............kkhhk.....',
  '............kkhhhhk.....',
  '...........khhddhhk.....',
  '..........khhddhhk......',
  '..........kkkkkkk.......',
] as const

/* ---------- Acessórios por função ----------
   `top` = linha do pombo onde a grade começa (negativo = acima da cabeça). */

export interface PigeonAccessory {
  grid: readonly string[]
  top: number
  /** true: acompanha o balanço da cabeça. */
  onHead: boolean
}

/** Guardião: eboshi, o chapéu alto laqueado dos sacerdotes xintoístas. */
export const HAT_GUARDIAN: PigeonAccessory = {
  top: -3,
  onHead: true,
  grid: [
    '........kkk.............',
    '.......kKKKk............',
    '......kKwKKKk...........',
    '.....kKKKKKKKk..........',
    '....kkkkkkkkkkk.........',
  ],
}

/** Vidente: faixa violeta com uma joia dourada e pontas ao vento. */
export const HAT_SEER: PigeonAccessory = {
  top: 3,
  onHead: true,
  grid: ['....vvvyvvvvvv.vv.......', '................vvv.....'],
}

/** Carteiro: boné azul com distintivo dourado. */
export const HAT_MAIL: PigeonAccessory = {
  top: -1,
  onHead: true,
  grid: ['......kkkkkk............', '.....kBBBBBBk...........', '....kBByBBBBBk..........', '.kDDDDDDDDDDDDk.........'],
}

/** Carteiro: bolsa a tiracolo com uma carta aparecendo. */
export const BAG_MAIL: PigeonAccessory = {
  top: 11,
  onHead: false,
  grid: [
    '............M...........',
    '...........M............',
    '..........M.............',
    '.........M..............',
    '....kkkkkk..............',
    '....kmmmmk..............',
    '....kmwwmk..............',
    '....kkkkkk..............',
  ],
}
