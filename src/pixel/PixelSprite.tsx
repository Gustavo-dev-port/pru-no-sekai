import type { ReactElement } from 'react'
import { SPRITE_PALETTE } from './palette'

/** Uma camada de sprite: grade de texto + deslocamento em pixels do sprite. */
export interface SpriteLayer {
  grid: readonly string[]
  dx?: number
  dy?: number
  className?: string
}

interface PixelSpriteProps {
  width: number
  height: number
  layers: readonly SpriteLayer[]
  /** Tamanho de cada pixel do sprite em px de CSS. Padrão do jogo: 4. */
  scale?: number
  /** Troca de cores (ex.: { r: '#ffa3bf' } para uma lanterna rosa). */
  recolor?: Record<string, string>
  title?: string
  className?: string
  /** Mostra só um recorte do sprite (ex.: retrato do rosto). Em pixels do sprite. */
  crop?: { x: number; y: number; w: number; h: number }
}

// Cada linha vira poucos <rect>: pixels vizinhos da mesma cor são unidos.
const cache = new WeakMap<readonly string[], ReactElement[]>()

function rectsFor(grid: readonly string[], recolor?: Record<string, string>): ReactElement[] {
  if (!recolor) {
    const hit = cache.get(grid)
    if (hit) return hit
  }
  const rects: ReactElement[] = []
  grid.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      if (ch === '.' || ch === ' ') {
        x++
        continue
      }
      let end = x + 1
      while (end < row.length && row[end] === ch) end++
      const fill = recolor?.[ch] ?? SPRITE_PALETTE[ch]
      if (fill) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={fill} />)
      x = end
    }
  })
  if (!recolor) cache.set(grid, rects)
  return rects
}

export function PixelSprite({ width, height, layers, scale = 4, recolor, title, className = '', crop }: PixelSpriteProps) {
  const view = crop ?? { x: 0, y: 0, w: width, h: height }
  return (
    <svg
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      width={view.w * scale}
      height={view.h * scale}
      shapeRendering="crispEdges"
      className={`pixel-sprite ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {layers.map((layer, i) => (
        <g
          key={i}
          className={layer.className}
          transform={layer.dx || layer.dy ? `translate(${layer.dx ?? 0} ${layer.dy ?? 0})` : undefined}
        >
          {rectsFor(layer.grid, recolor)}
        </g>
      ))}
    </svg>
  )
}
