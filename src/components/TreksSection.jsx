import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Mountain } from 'lucide-react'
import { treks } from '../data/content'
import Reveal from './Reveal'

export default function TreksSection({ onBook }) {
  const railRef = useRef(null)
  const frameRef = useRef(null)
  const dragRef = useRef({ active: false, captured: false, pointerId: null, startX: 0, startScroll: 0, distance: 0 })
  const [active, setActive] = useState(0)
  const [dragging, setDragging] = useState(false)

  const updateActive = () => {
    frameRef.current = null
    const rail = railRef.current
    if (!rail) return
    const cards = [...rail.querySelectorAll('.trek-story')]
    const target = rail.scrollLeft + rail.clientWidth * 0.18
    let nearestIndex = 0
    let nearestDistance = Infinity
    cards.forEach((card, index) => {
      const distance = Math.abs(card.offsetLeft - target)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })
    setActive(nearestIndex)
  }

  const handleScroll = () => {
    if (!frameRef.current) frameRef.current = requestAnimationFrame(updateActive)
  }

  const move = (direction) => {
    const rail = railRef.current
    if (!rail) return
    const next = Math.max(0, Math.min(treks.length - 1, active + direction))
    rail.querySelectorAll('.trek-story')[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    setActive(next)
  }

  /* Mouse drag-to-scroll for the rail. Touch keeps its native behaviour.
     Pointer capture engages only past the movement threshold so plain clicks
     on the card CTAs are never retargeted to the rail. */
  const handlePointerDown = (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const rail = railRef.current
    if (!rail) return
    dragRef.current = {
      active: true,
      captured: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: rail.scrollLeft,
      distance: 0,
    }
  }

  const handlePointerMove = (event) => {
    const drag = dragRef.current
    if (!drag.active) return
    const rail = railRef.current
    if (!rail) return
    const dx = event.clientX - drag.startX
    drag.distance = Math.max(drag.distance, Math.abs(dx))
    if (drag.distance > 6) {
      if (!drag.captured) {
        drag.captured = true
        setDragging(true)
        try {
          rail.setPointerCapture(drag.pointerId)
        } catch {
          /* Pointer capture is best-effort; dragging still works without it. */
        }
      }
      rail.scrollLeft = drag.startScroll - dx
    }
  }

  const endPointerDrag = () => {
    const drag = dragRef.current
    if (!drag.active) return
    drag.active = false
    if (drag.captured) {
      drag.captured = false
      setDragging(false)
      const rail = railRef.current
      if (rail && drag.pointerId !== null) {
        try {
          if (rail.hasPointerCapture?.(drag.pointerId)) rail.releasePointerCapture(drag.pointerId)
        } catch {
          /* Nothing to release — safe to ignore. */
        }
      }
    }
    /* Keep the travelled distance briefly so the follow-up click (if any) can
       be suppressed; a real click resets it synchronously below. */
    if (drag.distance <= 6) {
      drag.distance = 0
    } else {
      window.setTimeout(() => {
        dragRef.current.distance = 0
      }, 150)
    }
  }

  const handleClickCapture = (event) => {
    if (dragRef.current.distance > 6) {
      event.preventDefault()
      event.stopPropagation()
      dragRef.current.distance = 0
    }
  }

  return (
    <section id="treks" className="treks-section section-pad" aria-labelledby="treks-title">
      <div className="treks-section__top shell">
        <Reveal>
          <p className="eyebrow eyebrow--light"><span>02</span> Go further</p>
          <h2 id="treks-title">Trails worth<br /><em>taking.</em></h2>
        </Reveal>
        <Reveal className="treks-section__aside" delay={100}>
          <p>Five iconic routes. Each one shaped by altitude, culture and the quiet thrill of taking the long way.</p>
          <div className="trek-controls">
            <span aria-live="polite"><strong>0{active + 1}</strong> / 0{treks.length}</span>
            <button type="button" onClick={() => move(-1)} disabled={active === 0} aria-label="Previous trek"><ArrowLeft size={19} /></button>
            <button type="button" onClick={() => move(1)} disabled={active === treks.length - 1} aria-label="Next trek"><ArrowRight size={19} /></button>
          </div>
        </Reveal>
      </div>

      <div
        className={`trek-rail${dragging ? ' is-dragging' : ''}`}
        ref={railRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointerDrag}
        onPointerCancel={endPointerDrag}
        onPointerLeave={endPointerDrag}
        onClickCapture={handleClickCapture}
        onDragStart={(event) => event.preventDefault()}
        aria-label="Popular trek stories"
        tabIndex="0"
      >
        <div className="trek-rail__spacer" aria-hidden="true" />
        {treks.map((trek, index) => (
          <article className={`trek-story ${active === index ? 'is-active' : ''}`} key={trek.id}>
            <img
              src={trek.image}
              alt={trek.alt}
              loading="lazy"
              decoding="async"
              draggable={false}
              style={{ objectPosition: trek.imagePosition }}
            />
            <div className="trek-story__shade" aria-hidden="true" />
            <span className="trek-story__number">{trek.number}</span>
            <div className="trek-story__region"><Mountain size={15} aria-hidden="true" /> {trek.region}</div>
            <div className="trek-story__content">
              <div>
                <h3>{trek.title}</h3>
                <p>{trek.description}</p>
              </div>
              <dl>
                <div><dt>Duration</dt><dd>{trek.duration}</dd></div>
                <div><dt>Difficulty</dt><dd>{trek.difficulty}</dd></div>
                <div><dt>High point</dt><dd>{trek.elevation}</dd></div>
                <div><dt>From</dt><dd>${trek.price.toLocaleString()}</dd></div>
              </dl>
              <button className="trek-story__cta" type="button" onClick={() => onBook(trek)}>
                <span>Explore the trek</span><ArrowUpRight size={19} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
        <div className="trek-rail__end" aria-hidden="true">
          <span>Not sure where to begin?</span>
          <button type="button" onClick={() => onBook()}>Talk to a trip designer <ArrowRight size={17} /></button>
        </div>
      </div>

      <div className="trek-progress shell" aria-hidden="true">
        <span><i style={{ transform: `scaleX(${(active + 1) / treks.length})` }} /></span>
        <p>Drag or use arrows to explore</p>
      </div>
    </section>
  )
}
