import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDown, ArrowUpRight, MapPin } from 'lucide-react'
import Noise from '../Noise'
import { trips } from '../../data/content'

gsap.registerPlugin(ScrollTrigger)

function MaskLine({ children, delay = 0, italic = false }) {
  return (
    <span className="tp-hero__line">
      <motion.span
        className={italic ? 'tp-hero__line-inner tp-hero__line-inner--italic' : 'tp-hero__line-inner'}
        initial={{ y: '112%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 1.05, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  )
}

export default function TripsHero({ onBook }) {
  const rootRef = useRef(null)
  const mediaRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.to(mediaRef.current, {
        yPercent: 16,
        scale: 1.12,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
      gsap.to(contentRef.current, {
        yPercent: -14,
        opacity: 0.1,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: '70% top',
          scrub: true,
        },
      })
    })
    return () => mm.revert()
  }, [])

  const minDays = Math.min(...trips.map((t) => t.durationDays))
  const maxDays = Math.max(...trips.map((t) => t.durationDays))

  return (
    <section className="tp-hero" ref={rootRef} aria-labelledby="tp-title">
      <div className="tp-hero__media" ref={mediaRef} aria-hidden="true">
        <img src="/images/trip-hero.jpg" alt="" decoding="async" />
      </div>
      <div className="tp-hero__wash" aria-hidden="true" />
      <Noise patternSize={160} patternScaleX={1.4} patternScaleY={0.8} patternRefreshInterval={2} patternAlpha={20} style={{ zIndex: 2 }} />
      <div className="tp-hero__vignette" aria-hidden="true" />

      <div className="tp-hero__top shell" aria-hidden="true">
        <span className="tp-hero__coord"><MapPin size={13} /> 27.99° N — 86.93° E</span>
        <span className="tp-hero__page">The Collection · 2026 Departures</span>
      </div>

      <div className="tp-hero__content shell" ref={contentRef}>
        <motion.p
          className="tp-hero__eyebrow"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
        >
          <span className="tp-hero__eyebrow-dot" aria-hidden="true" />
          Eight journeys, hand-built
        </motion.p>

        <h1 id="tp-title" className="tp-hero__title">
          <MaskLine delay={0.25}>Eight journeys.</MaskLine>
          <MaskLine delay={0.4} italic>One horizon.</MaskLine>
        </h1>

        <motion.p
          className="tp-hero__copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
        >
          Fifteen days to the icefall at Everest. Eight above the cloud on a golden ridge.
          Fourteen inside an ochre kingdom the monsoon forgot. Every departure is small,
          local-led, and paced for wonder — not for ticks.
        </motion.p>

        <motion.div
          className="tp-hero__ctas"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: 'easeOut' }}
        >
          <a className="button button--light" href="#tp-collection">
            <span>Browse the collection</span><ArrowDown size={17} aria-hidden="true" />
          </a>
          <button className="button button--ghost" type="button" onClick={onBook}>
            <span>Plan a private journey</span><ArrowUpRight size={17} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.dl
          className="tp-hero__meta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.05, ease: 'easeOut' }}
        >
          <div><dt>Journeys</dt><dd>{String(trips.length).padStart(2, '0')}</dd></div>
          <div><dt>Regions</dt><dd>05</dd></div>
          <div><dt>Days on trail</dt><dd>{minDays}–{maxDays}</dd></div>
          <div><dt>Group size</dt><dd>≤ 8</dd></div>
        </motion.dl>
      </div>

      <motion.a
        href="#tp-signature"
        className="tp-hero__scroll"
        aria-label="Scroll to the signature journey"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
      >
        <span>Scroll</span>
        <i aria-hidden="true"><ArrowDown size={15} /></i>
      </motion.a>
    </section>
  )
}
