import { useEffect, useRef } from 'react'

export default function Noise({
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha = 15,
  className = '',
  style = {},
}) {
  const grainRef = useRef(null)

  useEffect(() => {
    const canvas = grainRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let frame = 0
    let animationId
    // Keep the internal resolution high; patternSize influences the visual via the scaling trick
    const canvasSize = 1024
    // Actually we use canvasSize for buffer, but patternSize affects pixel density via scaling
    const resize = () => {
      if (!canvas) return
      canvas.width = canvasSize
      canvas.height = canvasSize
    }

    const drawGrain = () => {
      const imageData = ctx.createImageData(canvasSize, canvasSize)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255
        data[i] = value
        data[i + 1] = value
        data[i + 2] = value
        data[i + 3] = patternAlpha
      }
      ctx.putImageData(imageData, 0, 0)
    }

    const loop = () => {
      if (frame % patternRefreshInterval === 0) {
        drawGrain()
      }
      frame++
      animationId = window.requestAnimationFrame(loop)
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resize()
    drawGrain()
    if (!reduced) {
      loop()
    }

    const onResize = () => resize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      if (animationId) window.cancelAnimationFrame(animationId)
    }
  }, [patternSize, patternScaleX, patternScaleY, patternRefreshInterval, patternAlpha])

  // The outer wrapper handles scaleX/Y and patternSize via CSS transform
  // patternSize influences the visual grain size via CSS scaling of the canvas
  // We keep canvas 100vw/vh and apply scale transform
  return (
    <div
      className={`noise-wrapper ${className}`}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 2,
        ...style,
      }}
    >
      <canvas
        ref={grainRef}
        className="noise-overlay"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          imageRendering: 'pixelated',
          // scale to achieve patternScaleX/Y effect and patternSize density
          // We use transform to stretch grain anisotropically
          transform: `scale(${patternScaleX}, ${patternScaleY})`,
          transformOrigin: '0 0',
          // Adjust opacity via canvas alpha already, but ensure coverage when scaled
          // If scale <1 we need larger canvas, so we make it bigger
          minWidth: `${100 * Math.max(1, 1 / patternScaleX)}%`,
          minHeight: `${100 * Math.max(1, 1 / patternScaleY)}%`,
        }}
      />
      {/* Second layer for subtle extra texture when patternSize small */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 ${patternSize} ${patternSize}' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
          opacity: 0.3,
          mixBlendMode: 'soft-light',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
