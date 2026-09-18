import { useCallback, useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { destinations } from '../data/content'
import Reveal from './Reveal'

/* Pointer parallax only where a precise hover exists, and never against
   reduced-motion preferences (CSS kills the rest globally). */
const HOVERABLE_QUERY = '(hover: hover) and (pointer: fine)'
const MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const PARALLAX_DEPTH = 14 // px of image travel at the card edges

function DestinationCard({ item, index }) {
  const cardRef = useRef(null)
  const frameRef = useRef(null)
  const pointRef = useRef({ x: 0, y: 0 })
  const trackingRef = useRef(false)
  const queriesRef = useRef(null)

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
  }, [])

  const applyParallax = useCallback(() => {
    frameRef.current = null
    const card = cardRef.current
    if (!card) return
    const { x, y } = pointRef.current
    card.style.setProperty('--px', `${(x * -PARALLAX_DEPTH).toFixed(1)}px`)
    card.style.setProperty('--py', `${(y * -PARALLAX_DEPTH).toFixed(1)}px`)
  }, [])

  const handlePointerEnter = () => {
    if (!queriesRef.current) {
      queriesRef.current = {
        hoverable: window.matchMedia(HOVERABLE_QUERY),
        reduced: window.matchMedia(MOTION_QUERY),
      }
    }
    trackingRef.current = queriesRef.current.hoverable.matches && !queriesRef.current.reduced.matches
  }

  const handlePointerMove = (event) => {
    if (!trackingRef.current || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    pointRef.current = {
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
    }
    if (!frameRef.current) frameRef.current = requestAnimationFrame(applyParallax)
  }

  const handlePointerLeave = () => {
    trackingRef.current = false
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    const card = cardRef.current
    if (!card) return
    card.style.setProperty('--px', '0px')
    card.style.setProperty('--py', '0px')
  }

  return (
    <Reveal
      as="article"
      className={`destination-slot destination-slot--${item.tile}`}
      delay={80 + (index % 3) * 90}
    >
      <div
        ref={cardRef}
        className={`destination-card destination-card--${item.size}`}
        data-destination={item.id}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className="destination-card__media" aria-hidden="true">
          <img
            src={item.image}
            alt=""
            loading="lazy"
            decoding="async"
            style={{ objectPosition: item.imagePosition }}
          />
        </div>
        <span className="destination-card__shade" aria-hidden="true" />
        <span className="destination-card__index" aria-hidden="true">{item.number}</span>
        <div className="destination-card__content">
          <p className="destination-card__kicker">{item.kicker}</p>
          <h3>{item.title} <em>Nepal</em></h3>
          <p className="destination-card__text">{item.description}</p>
          <a className="destination-card__cta" href="#trips" aria-label={`Explore ${item.title} Nepal`}>
            <span>Explore</span>
            <i aria-hidden="true"><ArrowRight size={14} /></i>
          </a>
        </div>
      </div>
    </Reveal>
  )
}

export default function DestinationsSection() {
  return (
    <section id="destinations" className="destinations-section section-pad" aria-labelledby="destinations-title">
      <div className="shell">
        <div className="section-intro section-intro--destinations">
          <Reveal>
            <p className="eyebrow"><span>00</span> Explore by region</p>
            <h2 id="destinations-title">Choose Your <em>Destination</em></h2>
          </Reveal>
          <Reveal className="section-intro__aside" delay={110}>
            <p>Five ways into the Himalaya — from the untrampled far west to the Sherpa high road of the east. Pick a region, and the journey takes shape around it.</p>
          </Reveal>
        </div>

        <div className="destination-grid">
          {destinations.map((item, index) => (
            <DestinationCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
