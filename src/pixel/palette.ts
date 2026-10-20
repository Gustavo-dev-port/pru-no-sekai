// Paleta única de toda a pixel art (sprites SVG e cenário em canvas).
// Cada sprite é escrito como texto: um caractere = um pixel, "." = vazio.
// Mudar uma cor aqui muda essa cor em todo o jogo.

export const PIXEL_COLORS = {
  // contorno e texto: ameixa escura, nunca preto puro
  ink: '#4a3b42',
  lacquer: '#3a3036',
  lacquerLight: '#5a4c55',
  white: '#fffbf3',
  cream: '#fdf3e1',
  paperLine: '#ead3a8',

  // pombo
  pigeonLight: '#e6e1ee',
  pigeon: '#bab3c9',
  pigeonWing: '#9d95b0',
  pigeonDark: '#6f6786',
  neckGreen: '#6cb59b',
  neckPurple: '#9b7fc1',
  beak: '#ec8fa6',
  blush: '#ffa3bf',

  // santuário
  torii: '#e0533d',
  toriiLight: '#ef7a63',
  toriiDark: '#a8352a',
  gold: '#e8c46a',
  glow: '#ffd98a',
  wood: '#ecd2a0',
  woodDark: '#c79a5b',
  stone: '#bdb4ad',
  stoneDark: '#9a918b',
  trunk: '#8b5e4a',
  trunkDark: '#6e4637',

  // sakura
  sakuraLight: '#ffe4ec',
  sakura: '#ffc9d9',
  sakuraMid: '#ffa3bf',
  sakuraDark: '#f08fb0',

  // natureza
  sage: '#b9cfae',
  sageLight: '#cfe0c4',
  sageDark: '#86a878',
  mountain: '#c9d9c0',
  mountainShade: '#b3c8a8',
  snowShade: '#e9eef0',

  // acessórios
  blue: '#5b7fb8',
  blueDark: '#3d5d93',
  violet: '#8a6cc2',
  bag: '#c79a5b',
  bagDark: '#8e6638',

  shadow: 'rgba(74, 59, 66, 0.16)',
} as const

/** Caractere do sprite → cor. */
export const SPRITE_PALETTE: Record<string, string> = {
  k: PIXEL_COLORS.ink,
  e: PIXEL_COLORS.ink,
  K: PIXEL_COLORS.lacquer,
  w: PIXEL_COLORS.white,
  u: PIXEL_COLORS.cream,
  g: PIXEL_COLORS.pigeonLight,
  G: PIXEL_COLORS.pigeon,
  h: PIXEL_COLORS.pigeonWing,
  d: PIXEL_COLORS.pigeonDark,
  n: PIXEL_COLORS.neckGreen,
  p: PIXEL_COLORS.neckPurple,
  b: PIXEL_COLORS.beak,
  c: PIXEL_COLORS.blush,
  r: PIXEL_COLORS.torii,
  q: PIXEL_COLORS.toriiLight,
  R: PIXEL_COLORS.toriiDark,
  y: PIXEL_COLORS.gold,
  L: PIXEL_COLORS.glow,
  o: PIXEL_COLORS.wood,
  O: PIXEL_COLORS.woodDark,
  s: PIXEL_COLORS.sakuraMid,
  l: PIXEL_COLORS.sakuraLight,
  S: PIXEL_COLORS.sakuraDark,
  a: PIXEL_COLORS.sage,
  A: PIXEL_COLORS.sageDark,
  B: PIXEL_COLORS.blue,
  D: PIXEL_COLORS.blueDark,
  v: PIXEL_COLORS.violet,
  m: PIXEL_COLORS.bag,
  M: PIXEL_COLORS.bagDark,
  z: PIXEL_COLORS.shadow,
}
