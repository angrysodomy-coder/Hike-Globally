import { useEffect, useRef, useState } from 'react'

/* Three photographs inside an itinerary day, auto-advancing every five
   seconds while the accordion holding them is open and on screen.
   Pauses on hover/focus and for `prefers-reduced-motion`. */
export default function ItinerarySlider({ images, active }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (!active || paused || images.length < 2) return undefined
    if (typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    timer.current = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length)
    }, 5000)
    return () => window.clearInterval(timer.current)
  }, [active, paused, images.length])

  useEffect(() => {
    if (!active) setIndex(0)
  }, [active])

  return (
    <div
      className="tsp-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="tsp-slider__stage">
        {images.map((image, imageIndex) => (
          <figure
            key={image.src + imageIndex}
            className={`tsp-slider__slide ${imageIndex === index ? 'is-active' : ''}`}
            aria-hidden={imageIndex !== index}
          >
            <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
          </figure>
        ))}
        <span className="tsp-slider__counter" aria-hidden="true">{index + 1} / {images.length}</span>
      </div>

      <div className="tsp-slider__dots" aria-label="Photographs from this day">
        {images.map((image, imageIndex) => (
          <button
            key={`dot-${image.src}-${imageIndex}`}
            type="button"
            aria-current={imageIndex === index}
            aria-label={`Show photograph ${imageIndex + 1} of ${images.length}`}
            className={imageIndex === index ? 'is-active' : ''}
            onClick={() => setIndex(imageIndex)}
          >
            <i aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}
