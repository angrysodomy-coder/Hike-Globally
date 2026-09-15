import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { trips } from '../data/content'
import Reveal from './Reveal'

const MOBILE_QUERY = '(max-width: 1023px)'
const MOTION_QUERY = '(prefers-reduced-motion: reduce)'
/* Cards visible side by side on desktop. Must match the `--rail-card-w`
   formula in src/styles.css: (shell - (PER_VIEW_DESKTOP - 1) * gap) / PER_VIEW_DESKTOP. */
export const PER_VIEW_DESKTOP = 3

function TripCard({ trip, index, onBook }) {
  return (
    <Reveal as="article" className="trip-card trip-card--rail" delay={(index % PER_VIEW_DESKTOP) * 80}>
      <div className="trip-card__image">
        <img
          src={trip.image}
          alt={trip.alt}
          loading="lazy"
          decoding="async"
          style={{ objectPosition: trip.imagePosition }}
        />
        <span className="trip-card__index">0{index + 1}</span>
        <span className="trip-card__availability"><i /> {trip.availability}</span>
        <button type="button" className="trip-card__image-cta" onClick={() => onBook(trip)} aria-label={`View ${trip.title}`}>
          <ArrowUpRight size={22} aria-hidden="true" />
        </button>
      </div>
      <div className="trip-card__body">
        <div className="trip-card__location">{trip.location}</div>
        <h3>{trip.title}</h3>
        <p className="trip-card__description">{trip.description}</p>
        <div className="trip-card__meta">
          <span><small>Duration</small>{trip.duration}</span>
          <span><small>Difficulty</small>{trip.difficulty}</span>
          <span><small>From</small><strong>${trip.price.toLocaleString()}</strong></span>
        </div>
        <button className="trip-card__link" type="button" onClick={() => onBook(trip)}>
          <span>View this trip</span><ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
    </Reveal>
  )
}

function TripsRail({ list, onBook }) {
  const outerRef = useRef(null)
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const fillRef = useRef(null)
  const frameRef = useRef(null)
  const stateRef = useRef({ mode: 'rail', distance: 0, pages: 1 })

  const [mode, setMode] = useState('rail')
  const [pages, setPages] = useState(1)
  const [activePage, setActivePage] = useState(0)

  const update = useCallback(() => {
    frameRef.current = null
    const outer = outerRef.current
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!outer || !viewport || !track) return

    const { mode: currentMode, distance, pages: pageTotal } = stateRef.current
    let progress = 0

    if (currentMode === 'pin') {
      const total = outer.offsetHeight - window.innerHeight
      const top = outer.getBoundingClientRect().top
      progress = total > 0 ? Math.min(1, Math.max(0, -top / total)) : 0
      track.style.transform = `translate3d(${(-progress * distance).toFixed(2)}px, 0, 0)`
    } else {
      const max = viewport.scrollWidth - viewport.clientWidth
      progress = max > 0 ? Math.min(1, Math.max(0, viewport.scrollLeft / max)) : 0
    }

    if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress})`

    const centerX = window.innerWidth / 2
    for (const card of track.children) {
      const rect = card.getBoundingClientRect()
      if (rect.right < -120 || rect.left > window.innerWidth + 120) continue
      const t = Math.max(-1, Math.min(1, (rect.left + rect.width / 2 - centerX) / window.innerWidth))
      card.style.setProperty('--img-x', `${(t * -24).toFixed(1)}px`)
    }

    const page = Math.round(progress * (pageTotal - 1))
    setActivePage((previous) => (previous === page ? previous : page))
  }, [])

  const schedule = useCallback(() => {
    if (!frameRef.current) frameRef.current = requestAnimationFrame(update)
  }, [update])

  const measure = useCallback(() => {
    const outer = outerRef.current
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!outer || !viewport || !track) return

    const isMobile = window.matchMedia(MOBILE_QUERY).matches
    const reduced = window.matchMedia(MOTION_QUERY).matches
    const distance = Math.max(0, track.scrollWidth - viewport.clientWidth)
    const shouldPin = !isMobile && !reduced && distance > 8
    const pageTotal = Math.max(1, Math.ceil(list.length / (isMobile ? 1 : PER_VIEW_DESKTOP)))

    stateRef.current = { mode: shouldPin ? 'pin' : 'rail', distance, pages: pageTotal }
    outer.classList.toggle('is-pin', shouldPin)
    outer.classList.toggle('is-rail', !shouldPin)
    outer.style.height = shouldPin ? `calc(100svh + ${Math.round(distance)}px)` : ''
    if (!shouldPin) track.style.transform = ''
    setMode(shouldPin ? 'pin' : 'rail')
    setPages(pageTotal)
    setActivePage((previous) => Math.min(previous, pageTotal - 1))
    schedule()
  }, [list.length, schedule])

  useLayoutEffect(() => {
    measure()
    const track = trackRef.current
    if (!track) return undefined
    const observer = new ResizeObserver(() => measure())
    observer.observe(track)
    const mobileQuery = window.matchMedia(MOBILE_QUERY)
    const motionQuery = window.matchMedia(MOTION_QUERY)
    mobileQuery.addEventListener('change', measure)
    motionQuery.addEventListener('change', measure)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      observer.disconnect()
      mobileQuery.removeEventListener('change', measure)
      motionQuery.removeEventListener('change', measure)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', schedule)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [measure, schedule])

  const goToPage = (index) => {
    const { mode: currentMode, pages: pageTotal } = stateRef.current
    const clamped = Math.max(0, Math.min(pageTotal - 1, index))
    const ratio = pageTotal > 1 ? clamped / (pageTotal - 1) : 0
    if (currentMode === 'pin') {
      const outer = outerRef.current
      const total = outer.offsetHeight - window.innerHeight
      const start = outer.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: start + ratio * total, behavior: 'smooth' })
    } else {
      const viewport = viewportRef.current
      const max = viewport.scrollWidth - viewport.clientWidth
      viewport.scrollTo({ left: ratio * max, behavior: 'smooth' })
    }
  }

  return (
    <div className="trips-scroll is-rail" ref={outerRef} data-mode={mode}>
      <div className="trips-scroll__pin">
        <div
          className="trips-scroll__viewport"
          ref={viewportRef}
          onScroll={schedule}
          tabIndex={0}
          aria-label="Curated journeys, scrolls horizontally"
        >
          <div className="trips-scroll__track" ref={trackRef}>
            {list.map((trip, index) => (
              <TripCard key={trip.id} trip={trip} index={index} onBook={onBook} />
            ))}
          </div>
        </div>

        <div className="trips-scroll__bar shell">
          <div className="trips-scroll__dots" role="group" aria-label="Journey sets">
            {Array.from({ length: pages }, (_, index) => (
              <button
                key={index}
                type="button"
                className={index === activePage ? 'is-active' : ''}
                onClick={() => goToPage(index)}
                aria-label={`Go to journeys set ${index + 1} of ${pages}`}
                aria-current={index === activePage}
              />
            ))}
          </div>
          <span className="trips-scroll__line" aria-hidden="true"><i ref={fillRef} /></span>
          <p className="trips-scroll__hint">Scroll to explore</p>
          <div className="trips-controls">
            <span aria-live="polite"><strong>0{activePage + 1}</strong> / 0{pages}</span>
            <button type="button" onClick={() => goToPage(activePage - 1)} disabled={activePage === 0} aria-label="Previous journeys">
              <ArrowLeft size={19} />
            </button>
            <button type="button" onClick={() => goToPage(activePage + 1)} disabled={activePage === pages - 1} aria-label="Next journeys">
              <ArrowRight size={19} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TripsSection({ onBook }) {
  return (
    <section id="trips" className="trips-section section-pad" aria-labelledby="trips-title">
      <div className="shell">
        <div className="section-intro section-intro--trips">
          <Reveal>
            <p className="eyebrow"><span>01</span> Curated journeys</p>
            <h2 id="trips-title">Popular <em>Treks</em></h2>
          </Reveal>
          <Reveal className="section-intro__aside" delay={110}>
            <p>From unforgettable mountain adventures to immersive cultural journeys, discover trips designed around the places worth experiencing. Scroll sideways through the collection.</p>
          </Reveal>
        </div>
      </div>

      <TripsRail list={trips} onBook={onBook} />
    </section>
  )
}
