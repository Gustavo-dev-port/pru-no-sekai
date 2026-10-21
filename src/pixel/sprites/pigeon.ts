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

/** Rei Pombo: coroa dourada com joias. */
export const HAT_KING: PigeonAccessory = {
  top: -3,
  onHead: true,
  grid: [
    '.....y..y..y............',
    '.....yy.y.yy............',
    '.....yyyyyyy............',
    '.....yryyyry............',
  ],
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

/* ---------- Expressões ----------
   Remendos sobre a cabeça (mesmas coordenadas de PIGEON_HEAD): cobrem o olho
   original e desenham o novo. Acompanham a cabeça no bob e na bicada. */
export type PigeonExpression = 'normal' | 'feliz' | 'surpreso' | 'satisfeito'

const ROW = '........................'

export const PIGEON_EXPRESSIONS: Record<Exclude<PigeonExpression, 'normal'>, readonly string[]> = {
  /** Olhinhos fechados para cima (^). Usada ao bicar. */
  feliz: [ROW, ROW, ROW, ROW, '....GeeG................', '....eGGe................'],
  /** Olho arregalado: branco 3×3 com a pupila no meio. */
  surpreso: [ROW, ROW, ROW, '....www.................', '....wew.................', '....www.................'],
  /** Olho fechado em traço + bochecha maior. */
  satisfeito: [
    ROW,
    ROW,
    ROW,
    ROW,
    '....GGGG................',
    '....eeee................',
    ROW,
    '......cccc..............',
  ],
}

/** Asa bem aberta para cima: quadro de "voo" na chegada e na invasão. */
export const PIGEON_WING_OPEN = [
  ...Array<string>(4).fill(ROW),
  '...................kk...',
  '................kkhhk...',
  '..............kkhhhhk...',
  '............kkhhhhhhk...',
  '...........khhddhhddk...',
  '..........khhddhhddk....',
  '..........khhhhhhhk.....',
  '...........kkkkkkk......',
] as const

/** "!" de susto, desenhado acima da cabeça (linhas negativas: fora do canvas). */
export const PIGEON_EXCLAIM: PigeonAccessory = {
  top: -10,
  onHead: true,
  grid: [
    '...............kkk......',
    '...............kyk......',
    '...............kyk......',
    '...............kyk......',
    '...............kkk......',
    '...............kyk......',
    '...............kkk......',
  ],
}

/* ---------- Variações de cor dos pombos comuns ----------
   Trocam só as cores das penas (g/G/h/d e o pescoço n/p). O desenho é o
   mesmo pombo base, então todos continuam "do mesmo jogo". */
export type PigeonVariant = 'classico' | 'shiro' | 'canela' | 'sumi'

export const PIGEON_VARIANTS: Record<PigeonVariant, Record<string, string> | undefined> = {
  classico: undefined,
  shiro: { g: '#ffffff', G: '#f1edf5', h: '#ddd6e6', d: '#b9afc8', n: '#bfe0d3', p: '#d6c8ec' },
  canela: { g: '#f6e8da', G: '#dcbc9c', h: '#c69c77', d: '#8e6638' },
  sumi: { g: '#cdc6d8', G: '#8a819b', h: '#6d6584', d: '#4c4562' },
}
