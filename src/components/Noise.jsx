import { useEffect, useRef } from 'react'

// Film-grain noise overlay (ReactBits "Noise" recipe), sized to its parent
// element instead of the viewport so it can live inside a single section.
// https://reactbits.dev/animations/noise
export default function Noise({
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha = 15,
  className = '',
}) {
  const grainRef = useRef(null)

  useEffect(() => {
    const canvas = grainRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let frame = 0
    let animationId = null

    const patternCanvas = document.createElement('canvas')
    patternCanvas.width = patternSize
    patternCanvas.height = patternSize
    const patternCtx = patternCanvas.getContext('2d')
    const patternData = patternCtx.createImageData(patternSize, patternSize)
    const patternPixelDataLength = patternSize * patternSize * 4

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }

    const updatePattern = () => {
      for (let i = 0; i < patternPixelDataLength; i += 4) {
        const value = Math.random() * 255
        patternData.data[i] = value
        patternData.data[i + 1] = value
        patternData.data[i + 2] = value
        patternData.data[i + 3] = patternAlpha
      }
      patternCtx.putImageData(patternData, 0, 0)
    }

    const drawGrain = () => {
      if (!canvas.width || !canvas.height) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(patternScaleX, patternScaleY)
      const pattern = ctx.createPattern(patternCanvas, 'repeat')
      ctx.fillStyle = pattern
      ctx.fillRect(0, 0, canvas.width / patternScaleX, canvas.height / patternScaleY)
      ctx.restore()
    }

    const loop = () => {
      if (frame % patternRefreshInterval === 0) {
        updatePattern()
        drawGrain()
      }
      frame += 1
      animationId = window.requestAnimationFrame(loop)
    }

    const redraw = () => drawGrain()
    const observer = new ResizeObserver(redraw)
    if (canvas.parentElement) observer.observe(canvas.parentElement)
    window.addEventListener('resize', resize)

    resize()

    if (reducedMotion) {
      // Render a single static grain frame instead of animating.
      updatePattern()
      drawGrain()
    } else {
      animationId = window.requestAnimationFrame(loop)
    }

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', resize)
      if (animationId) window.cancelAnimationFrame(animationId)
    }
  }, [patternSize, patternScaleX, patternScaleY, patternRefreshInterval, patternAlpha])

  return <canvas className={`noise ${className}`.trim()} ref={grainRef} aria-hidden="true" />
}
