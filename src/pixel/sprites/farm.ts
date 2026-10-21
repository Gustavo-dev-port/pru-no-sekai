// Sprites da Fazendinha: plantas em 4 estágios (12×14) e ícones do estoque (8×8).
import type { CropId } from '../../data/crops'

export const CROP_SPRITE_WIDTH = 12
export const CROP_SPRITE_HEIGHT = 14

const E = '............'

const STAGE_SEED = [...Array<string>(11).fill(E), '.....A......', '....OOOO....', '...OOOOOO...']

const STAGE_SPROUT = [
  ...Array<string>(8).fill(E),
  '...aa..aa...',
  '....aaaa....',
  '.....AA.....',
  '.....AA.....',
  '....OOOO....',
  '...OOOOOO...',
]

const STAGE_GROWING = [
  ...Array<string>(4).fill(E),
  '.....aa.....',
  '....aAAa....',
  '..aa.AA.aa..',
  '...aaAAaa...',
  '.aa..AA..aa.',
  '..aaaAAaaa..',
  '.....AA.....',
  '.....AA.....',
  '....OOOO....',
  '...OOOOOO...',
]

const READY: Record<CropId, readonly string[]> = {
  milho: [
    '.....a......',
    '.....A......',
    '....yA......',
    '...yyAa.....',
    '...yyAAa....',
    '...yyA.aa...',
    '..ayyA..a...',
    '.aa.yA......',
    'a...AAa.....',
    '....AA.aa...',
    '...aAA...a..',
    '.....AA.....',
    '....OOOO....',
    '...OOOOOO...',
  ],
  arroz: [
    E,
    '..y.....y...',
    '.yy..y..yy..',
    '.y..yy...y..',
    '.y.yy.y..y..',
    '..yA..yyA...',
    '...A...A....',
    '...aA.Aa....',
    '..a.AAA.a...',
    '.....A......',
    '....aAa.....',
    '.....A......',
    '....OOOO....',
    '...OOOOOO...',
  ],
  girassol: [
    '....yyyy....',
    '..yyyyyyyy..',
    '.yyyMMMMyyy.',
    'yyyMMMMMMyyy',
    'yyyMMMMMMyyy',
    '.yyyMMMMyyy.',
    '..yyyyyyyy..',
    '....yyyy....',
    '...aaA......',
    '..aa.A.aa...',
    '.....Aaa....',
    '.....A......',
    '....OOOO....',
    '...OOOOOO...',
  ],
}

export function cropSprite(crop: CropId, stage: 0 | 1 | 2 | 3): readonly string[] {
  if (stage === 3) return READY[crop]
  return stage === 0 ? STAGE_SEED : stage === 1 ? STAGE_SPROUT : STAGE_GROWING
}

/** Ícones 8×8 do estoque. */
export const CROP_ICONS: Record<CropId, readonly string[]> = {
  milho: ['...ya...', '..yyA...', '..yyA.a.', '.ayyAa..', '..yyA...', '..yya...', '...A....', '........'],
  arroz: ['........', '..wwww..', '.wwwwww.', 'kkkkkkkk', 'krrrrrrk', '.krrrrk.', '..kkkk..', '........'],
  girassol: ['..yyy...', '.yMMMy..', 'yMMMMMy.', '.yMMMy..', '..yyy...', '...A....', '..aA....', '...A....'],
}

/** Saquinho de sementes (presente do Pombo-sama). */
export const SEED_POUCH = [
  '..k..k..',
  '...kk...',
  '.kOOOOk.',
  'kOOuuOOk',
  'kOuyyuOk',
  'kOOuuOOk',
  '.kOOOOk.',
  '..kkkk..',
] as const
