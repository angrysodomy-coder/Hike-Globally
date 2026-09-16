import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDown, ArrowUpRight, MapPin } from 'lucide-react'
import Noise from '../Noise'

gsap.registerPlugin(ScrollTrigger)

function MaskLine({ children, delay = 0, italic = false }) {
  return (
    <span className="dp-hero__line" aria-hidden={false}>
      <motion.span
        className={italic ? 'dp-hero__line-inner dp-hero__line-inner--italic' : 'dp-hero__line-inner'}
        initial={{ y: '112%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 1.05, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  )
}

export default function DestinationsHero({ onBook }) {
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

  return (
    <section className="dp-hero" ref={rootRef} aria-labelledby="dp-title">
      <div className="dp-hero__media" ref={mediaRef} aria-hidden="true">
        <picture>
          <source media="(max-width: 700px)" srcSet="/images/dest-hero-mobile.webp" type="image/webp" />
          <img src="/images/dest-hero-ridge.webp" alt="" decoding="async" />
        </picture>
      </div>
      <div className="dp-hero__wash" aria-hidden="true" />
      <Noise patternSize={160} patternScaleX={1.4} patternScaleY={0.8} patternRefreshInterval={2} patternAlpha={20} style={{ zIndex: 2 }} />
      <div className="dp-hero__vignette" aria-hidden="true" />

      <div className="dp-hero__top shell" aria-hidden="true">
        <span className="dp-hero__coord"><MapPin size={13} /> 27.9881° N — 86.9250° E</span>
        <span className="dp-hero__page">Destinations · Nepal</span>
      </div>

      <div className="dp-hero__content shell" ref={contentRef}>
        <motion.p
          className="dp-hero__eyebrow"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
        >
          <span className="dp-hero__eyebrow-dot" aria-hidden="true" />
          Explore Nepal by region
        </motion.p>

        <h1 id="dp-title" className="dp-hero__title">
          <MaskLine delay={0.25}>Five regions.</MaskLine>
          <MaskLine delay={0.4} italic>One Himalaya.</MaskLine>
        </h1>

        <motion.p
          className="dp-hero__copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
        >
          From the rain-shadow desert of Mustang to the Sherpa high road of the Khumbu —
          choose the landscape that matches the journey you came for.
        </motion.p>

        <motion.div
          className="dp-hero__ctas"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: 'easeOut' }}
        >
          <a className="button button--light" href="#dp-rail">
            <span>Explore the regions</span><ArrowDown size={17} aria-hidden="true" />
          </a>
          <button className="button button--ghost" type="button" onClick={onBook}>
            <span>Plan my journey</span><ArrowUpRight size={17} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.dl
          className="dp-hero__meta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.05, ease: 'easeOut' }}
        >
          <div><dt>Regions</dt><dd>05</dd></div>
          <div><dt>8,000ers</dt><dd>08</dd></div>
          <div><dt>Trail days</dt><dd>320+</dd></div>
          <div><dt>Group size</dt><dd>≤ 8</dd></div>
        </motion.dl>
      </div>

      <motion.a
        href="#dp-rail"
        className="dp-hero__scroll"
        aria-label="Scroll to the region showcase"
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
