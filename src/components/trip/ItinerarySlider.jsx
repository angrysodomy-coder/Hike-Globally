import { useEffect, useRef, useState } from 'react'

/* Three-up itinerary gallery. It keeps the same auto-advancing controls as
   the original slider, while showing three photographs at once on larger
   screens. If a day has more than three photographs, the track advances by
   one image so the next photograph gently enters the frame. */
export default function ItinerarySlider({ images, active }) {
  const [index, setIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(3)
  const [paused, setPaused] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)')
    const updateVisibleCount = () => setVisibleCount(media.matches ? 1 : 3)
    updateVisibleCount()
    media.addEventListener?.('change', updateVisibleCount)
    return () => media.removeEventListener?.('change', updateVisibleCount)
  }, [])

  const lastIndex = Math.max(0, images.length - visibleCount)

  useEffect(() => {
    setIndex((current) => Math.min(current, lastIndex))
    setSelectedIndex((current) => Math.min(current, images.length - 1))
  }, [lastIndex, images.length])

  useEffect(() => {
    if (!active || paused || images.length <= visibleCount) return undefined
    if (typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    timer.current = window.setInterval(() => {
      setIndex((current) => (current >= lastIndex ? 0 : current + 1))
    }, 5000)
    return () => window.clearInterval(timer.current)
  }, [active, paused, images.length, visibleCount, lastIndex])

  useEffect(() => {
    if (!active) {
      setIndex(0)
      setSelectedIndex(0)
    }
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
        <div
          className="tsp-slider__track"
          style={{ '--tsp-slide-count': visibleCount, '--tsp-slide-index': index }}
        >
          {images.map((image, imageIndex) => (
            <figure
              key={image.src + imageIndex}
              className={`tsp-slider__slide ${imageIndex === selectedIndex ? 'is-active' : ''}`}
              aria-hidden={imageIndex < index || imageIndex >= index + visibleCount}
            >
              <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
            </figure>
          ))}
        </div>
        <span className="tsp-slider__counter" aria-hidden="true">{index + 1}–{Math.min(index + visibleCount, images.length)} / {images.length}</span>
      </div>

      <div className="tsp-slider__dots" aria-label="Photographs from this day">
        {images.map((image, slideIndex) => (
          <button
            key={`dot-${image.src}-${slideIndex}`}
            type="button"
            aria-current={slideIndex === selectedIndex}
            aria-label={`Show photograph ${slideIndex + 1} of ${images.length}`}
            className={slideIndex === selectedIndex ? 'is-active' : ''}
            onClick={() => {
              setSelectedIndex(slideIndex)
              setIndex(Math.min(slideIndex, lastIndex))
            }}
          >
            <i aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}
