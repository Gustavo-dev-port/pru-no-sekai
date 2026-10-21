// Sprites do Correio Pombo do Amor (mesma escala de 4px do resto do jogo).
import { PIXEL_COLORS } from '../palette'
import type { LetterRarity } from '../../data/loveLetters'

/** Envelope: 16×17. Fechado ocupa as 12 linhas de baixo; aberto mostra a aba em pé. */
export const ENVELOPE_WIDTH = 16
export const ENVELOPE_HEIGHT = 17

export const ENVELOPE_CLOSED = [
  ...Array<string>(5).fill('................'),
  'kkkkkkkkkkkkkkkk',
  'kOuuuuuuuuuuuuOk',
  'kuOuuuuuuuuuuOuk',
  'kuuOuuuuuuuuOuuk',
  'kuuuOuuuuuuOuuuk',
  'kuuuuOXXXXOuuuuk',
  'kuuuuuXXXXuuuuuk',
  'kuuuOuXXXXuOuuuk',
  'kuuOuuuuuuuuOuuk',
  'kuOuuuuuuuuuuOuk',
  'kOuuuuuuuuuuuuOk',
  'kkkkkkkkkkkkkkkk',
] as const

export const ENVELOPE_OPEN = [
  '.......kk.......',
  '......kuuk......',
  '.....kuuuuk.....',
  '....kuuXXuuk....',
  '...kuuuXXuuuk...',
  '..kuuuuuuuuuuk..',
  'kkkkkkkkkkkkkkkk',
  'kOOwwwwwwwwwwOOk',
  'kOOwwwwwwwwwwOOk',
  'kuOwwwwwwwwwwOuk',
  'kuuOwwwwwwwwOuuk',
  'kuuuOuuuuuuOuuuk',
  'kuuOuuuuuuuuOuuk',
  'kuOuuuuuuuuuuOuk',
  'kOuuuuuuuuuuuuOk',
  'kkkkkkkkkkkkkkkk',
  '................',
] as const

/** Cor do lacre por raridade. */
export const SEAL_COLORS: Record<LetterRarity, Record<string, string>> = {
  comum: { X: PIXEL_COLORS.sakuraDark },
  rara: { X: PIXEL_COLORS.violet },
  lendaria: { X: PIXEL_COLORS.gold },
}

/** Envelope ainda bloqueado: tons acinzentados. */
export const LOCKED_COLORS: Record<string, string> = { u: '#ece6ef', O: '#cfc7d6', X: '#b9b3c6', k: '#8a7f8f' }

/** Caixa de correio japonesa (vermelha, com 〒), 10×16. */
export const POSTBOX = {
  width: 10,
  height: 16,
  grid: [
    '..kkkkkk..',
    '.krrrrrrk.',
    'krrrrrrrrk',
    'kqrrrrrrrk',
    'kqkkkkkkrk',
    'kqrrrrrrrk',
    'kqrwwwwrrk',
    'kqrwRRwrrk',
    'kqrwwRwrrk',
    'kqrrrrrrrk',
    'kqrrrrrrrk',
    'kqrrrrrrrk',
    'kkkkkkkkkk',
    '...kKKk...',
    '...kKKk...',
    '..kkkkkk..',
  ],
} as const

/* ---------- Ícones das cartas (8×8), versão pixel dos emojis da coleção ---------- */
export const LETTER_ICONS: Record<string, readonly string[]> = {
  '💌': ['kkkkkkkk', 'kOuuuuOk', 'kuOuuOuk', 'kuuSSuuk', 'kuSssSuk', 'kuuSSuuk', 'kkkkkkkk', '........'],
  '🏡': ['...kk...', '..kssk..', '.kssssk.', 'kkkkkkkk', '.kuuuuk.', '.kLuOOk.', '.kuuOOk.', 'aaaaaaaa'],
  '⚔️': ['G......G', '.G....G.', '..G..G..', '...GG...', '...GG...', '..y..y..', '.k....k.', 'k......k'],
  '🌸': ['...s....', '..sss...', 'sssysss.', '.sssss..', '..s.s...', '.ss.ss..', '........', '........'],
  '🌙': ['..yyyy..', '.yyLL..l', 'yyL.....', 'yyL.....', 'yyL.....', '.yyL..y.', '..yyyy..', '........'],
  '👑': ['........', 'y..y..y.', 'yy.y.yy.', 'yyyyyyy.', 'yryyyry.', 'yyyyyyy.', '........', '........'],
  '🪺': ['........', '..kk.kk.', '.kwwkwwk', '.kwwkwwk', 'OOOOOOOO', 'MOMOMOMO', '.MOMOMO.', '..MMMM..'],
  '🍟': ['.y.y.y..', '.y.yyy..', 'yyyyyyy.', 'rrrrrrr.', 'rryyyrr.', 'rrrrrrr.', '.rrrrr..', '........'],
  '💕': ['.SS.SS..', 'SssSssS.', 'SsssssS.', '.SsssS..', '..SsSs.s', '...S.sss', '......s.', '........'],
  '❤️': ['.RR.RR..', 'RqrRrrR.', 'RrrrrrR.', '.RrrrR..', '..RrR...', '...R....', '........', '........'],
}
