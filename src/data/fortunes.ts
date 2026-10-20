// Coleção 01 do Oráculo dos Pombos. O texto fica em fortunes.json
// (o mesmo formato entregue pelo dono do projeto); aqui ele ganha tipos e o
// nível de sorte é extraído do kanji em "type".
import raw from './fortunes.json'

export type FortuneIcon = 'heart' | 'sun' | 'bird' | 'flower' | 'palette' | 'sparkles'

/** Do melhor para o "pior" (que aqui é sempre fofo). */
export type Luck = 'daikichi' | 'chukichi' | 'kichi' | 'shokichi' | 'suekichi' | 'kyo'

export interface Fortune {
  id: string
  /** Texto original, ex.: "大吉 · Grande sorte" */
  type: string
  category: string
  icon: FortuneIcon
  title: string
  body: string
  extra: string
}

export interface ParsedFortune extends Fortune {
  luck: Luck
  kanji: string
  luckLabel: string
}

const LUCK_BY_KANJI: Record<string, Luck> = {
  大吉: 'daikichi',
  中吉: 'chukichi',
  吉: 'kichi',
  小吉: 'shokichi',
  末吉: 'suekichi',
  凶: 'kyo',
}

export function parseFortune(f: Fortune): ParsedFortune {
  const [kanji, luckLabel = ''] = f.type.split('·').map((s) => s.trim())
  const luck = LUCK_BY_KANJI[kanji]
  if (!luck) throw new Error(`Previsão ${f.id}: classificação desconhecida "${f.type}"`)
  return { ...f, luck, kanji, luckLabel }
}

export const FORTUNES: readonly ParsedFortune[] = (raw as Fortune[]).map(parseFortune)
