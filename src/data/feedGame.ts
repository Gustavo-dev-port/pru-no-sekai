// Módulo 3 — Alimente o Pombo. Tudo o que é ajustável no minijogo fica aqui:
// quando cada pombo chega, as falas de cada etapa, a invasão e onde cada
// pombo fica no jardim.
import type { PigeonExpression, PigeonVariant } from '../pixel/sprites/pigeon'

export interface FeedStage {
  /** A partir de quantos grãos esta etapa começa. */
  minGrains: number
  /** Quantos pombos do grupo principal estão no jardim. */
  pigeons: number
  message: string
}

/** Etapas em ordem crescente de grãos. */
export const FEED_STAGES: readonly FeedStage[] = [
  { minGrains: 0, pigeons: 1, message: 'Um pombo solitário te observa. Ele parece ter fome. E opiniões.' },
  { minGrains: 1, pigeons: 1, message: 'Ele gostou. Ele gostou MUITO. Os olhinhos até fecharam.' },
  { minGrains: 3, pigeons: 2, message: 'Chegou um amigo. Coincidência? Pombos não acreditam em coincidências.' },
  { minGrains: 6, pigeons: 3, message: 'Agora são três. Eles estão fazendo uma reunião sobre você.' },
  { minGrains: 10, pigeons: 5, message: 'Um pequeno grupo se formou. Alguém trouxe um banquinho.' },
  { minGrains: 15, pigeons: 8, message: 'Aglomeração! A notícia do milho grátis se espalhou pelo bairro.' },
]

/** Com quantos grãos começa a invasão. */
export const INVASION_AT = 20

/** Uma delas é sorteada a cada invasão (nunca a mesma da anterior). */
export const INVASION_MESSAGES = [
  'Você chamou reforços.',
  'Agora não há mais volta.',
  'Os pombos avisaram os primos.',
  'Pru, você agora é líder espiritual de uma revolta de pombos.',
  'Os pombos declararam este jardim território da Grande Pru.',
] as const

/** Fala depois da invasão, se continuar alimentando. */
export const AFTER_INVASION_MESSAGE = 'Os pombos exigem mais milho. É um protesto pacífico, mas firme.'

export const RESET_MESSAGE = 'Todos os pombos foram embora. Por enquanto.'

/* ---------- Lugares dos pombos no jardim ----------
   x: centro do pombo, em % da largura (a tela ainda garante, em px, que o
   pombo inteiro e o grão caibam na praça). y: linha dos pés, em % da altura;
   sempre ≥ 55 para nenhum pombo cobrir a plaquinha nem a cerca.
   Os primeiros 8 são o grupo principal (chegam aos poucos, nesta ordem).
   O resto chega de uma vez na invasão. */
export interface PigeonSlot {
  x: number
  y: number
  variant: PigeonVariant
  flip: boolean
  /** Cara do pombo quando está parado (os invasores chegam com caras variadas). */
  expression?: PigeonExpression
}

export const MAIN_SLOTS: readonly PigeonSlot[] = [
  { x: 50, y: 74, variant: 'classico', flip: false },
  { x: 24, y: 60, variant: 'shiro', flip: true },
  { x: 77, y: 62, variant: 'canela', flip: false },
  { x: 34, y: 90, variant: 'sumi', flip: true },
  { x: 68, y: 92, variant: 'classico', flip: true },
  { x: 16, y: 82, variant: 'canela', flip: true },
  { x: 84, y: 82, variant: 'shiro', flip: false },
  { x: 52, y: 57, variant: 'sumi', flip: false },
]

const VARIANTS: PigeonVariant[] = ['classico', 'shiro', 'canela', 'sumi']
const INVADER_FACES: PigeonExpression[] = ['surpreso', 'feliz', 'normal', 'surpreso', 'satisfeito', 'feliz']

/** 18 pombos extras da invasão, espalhados de forma fixa (sem Math.random). */
export const INVASION_SLOTS: readonly PigeonSlot[] = Array.from({ length: 18 }, (_, i) => ({
  x: 12 + ((i * 37) % 77),
  y: 56 + ((i * 23) % 41),
  variant: VARIANTS[(i * 3 + 1) % VARIANTS.length],
  flip: i % 3 !== 0,
  expression: INVADER_FACES[i % INVADER_FACES.length],
}))

/**
 * Durante a invasão, os grãos vão para pombos da frente (pés abaixo desta
 * linha, em %), que não ficam escondidos atrás dos outros.
 */
export const FRONT_ROW_Y = 72
