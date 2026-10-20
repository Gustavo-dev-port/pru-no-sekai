import { useEffect, useRef } from 'react'
import { drawGarden } from '../pixel/garden'

/** Tamanho de 1 pixel do cenário em px de CSS (o mesmo dos sprites). */
const PX = 4

/**
 * Canvas do jardim. O canvas tem o tamanho da tela dividido por 4 e é
 * ampliado sem suavização, então todo pixel do cenário mede exatamente 4px.
 * Também ajusta o ponto de origem do zoom para o vão do torii.
 */
export function PixelGarden() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const frame = canvas?.parentElement
    if (!canvas || !frame) return

    const draw = () => {
      const w = Math.ceil(frame.clientWidth / PX)
      const h = Math.ceil(frame.clientHeight / PX)
      if (!w || !h) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = w
      canvas.height = h
      canvas.style.width = `${w * PX}px`
      canvas.style.height = `${h * PX}px`
      const { focusX, focusY } = drawGarden(ctx, w, h)
      // canvas centrado na horizontal e preso embaixo (ver .pixel-garden)
      const left = (frame.clientWidth - w * PX) / 2
      const topOffset = frame.clientHeight - h * PX
      frame.style.transformOrigin = `${left + focusX * PX}px ${topOffset + focusY * PX}px`
    }

    draw()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', draw)
      return () => window.removeEventListener('resize', draw)
    }
    const observer = new ResizeObserver(draw)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  return <canvas ref={canvasRef} className="pixel-garden" aria-hidden="true" />
}
