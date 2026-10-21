import { useEffect, useRef } from 'react'

const PX = 4

interface PixelCanvasProps {
  /** Desenha em pixels do canvas (1 = 4px de CSS). */
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
  className?: string
}

/**
 * Canvas de fundo que acompanha o tamanho do elemento pai, sempre com
 * pixels de exatamente 4px. Ancorado no canto de cima à esquerda; o pai
 * deve ter `position: relative` e `overflow: hidden`.
 */
export function PixelCanvas({ draw, className = '' }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const frame = canvas?.parentElement
    if (!canvas || !frame) return

    const render = () => {
      const w = Math.ceil(frame.clientWidth / PX)
      const h = Math.ceil(frame.clientHeight / PX)
      if (!w || !h) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = w
      canvas.height = h
      canvas.style.width = `${w * PX}px`
      canvas.style.height = `${h * PX}px`
      draw(ctx, w, h)
    }

    render()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', render)
      return () => window.removeEventListener('resize', render)
    }
    const observer = new ResizeObserver(render)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [draw])

  return <canvas ref={canvasRef} className={`pixel-canvas ${className}`} aria-hidden="true" />
}
