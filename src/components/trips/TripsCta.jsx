import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight, Compass } from 'lucide-react'
import { Link } from '../../lib/router'

gsap.registerPlugin(ScrollTrigger)

export default function TripsCta({ onBook }) {
  const rootRef = useRef(null)
  const mediaRef = useRef(null)

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        mediaRef.current,
        { yPercent: 10, scale: 1.1 },
        {
          yPercent: -6,
          scale: 1.04,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      )
    })
    return () => mm.revert()
  }, [])

  return (
    <section className="tp-cta" ref={rootRef} aria-labelledby="tp-cta-title">
      <div className="tp-cta__media" ref={mediaRef} aria-hidden="true">
        <img src="/images/trip-cta.jpg" alt="" loading="lazy" decoding="async" />
      </div>
      <div className="tp-cta__wash" aria-hidden="true" />

      <div className="shell tp-cta__content">
        <motion.p
          className="tp-hero__eyebrow"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <span className="tp-hero__eyebrow-dot" aria-hidden="true" />
          2026 departures
        </motion.p>

        <motion.h2
          id="tp-cta-title"
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          The mountains are patient.
          <br />
          <em>You don’t have to be.</em>
        </motion.h2>

        <motion.p
          className="tp-cta__copy"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          Groups run to eight, and the quiet months fill first. Tell us when you can
          go — we’ll take care of everything between here and the trailhead.
        </motion.p>

        <motion.div
          className="tp-cta__actions"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          <button className="button button--light" type="button" onClick={onBook}>
            <span>Plan my journey</span><ArrowUpRight size={17} aria-hidden="true" />
          </button>
          <Link className="button button--ghost" href="/destinations">
            <span>Explore the regions</span><Compass size={17} aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
