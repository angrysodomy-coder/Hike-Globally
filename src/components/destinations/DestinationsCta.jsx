import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from '../../lib/router'

gsap.registerPlugin(ScrollTrigger)

export default function DestinationsCta({ onBook }) {
  const rootRef = useRef(null)
  const mediaRef = useRef(null)

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        mediaRef.current,
        { scale: 1.18, yPercent: -6 },
        {
          scale: 1.02,
          yPercent: 0,
          ease: 'none',
          scrollTrigger: { trigger: rootRef.current, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    })
    return () => mm.revert()
  }, [])

  return (
    <section className="dp-cta" ref={rootRef} aria-labelledby="dp-cta-title">
      <div className="dp-cta__media" ref={mediaRef} aria-hidden="true">
        <img src="/images/dest-lodge.webp" alt="" loading="lazy" decoding="async" />
      </div>
      <div className="dp-cta__wash" aria-hidden="true" />

      <div className="shell dp-cta__content">
        <motion.p
          className="eyebrow eyebrow--light"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span>07</span> The lights are on
        </motion.p>
        <motion.h2
          id="dp-cta-title"
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Somewhere up there,<br /><em>a lodge is waiting for you.</em>
        </motion.h2>
        <motion.p
          className="dp-cta__copy"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          Tell us the landscape that calls you and we’ll shape the days around it —
          privately, and at your pace.
        </motion.p>
        <motion.div
          className="dp-cta__actions"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <button className="button button--light" type="button" onClick={onBook}>
            <span>Start planning</span><ArrowUpRight size={17} aria-hidden="true" />
          </button>
          <Link className="button button--ghost" href="/">
            <span>Back to journeys</span><ArrowRight size={17} aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
