import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, ArrowUpRight, CalendarDays, Footprints, ShieldCheck } from 'lucide-react'
import { destinationRegions } from '../../data/content'
import Reveal from '../Reveal'

gsap.registerPlugin(ScrollTrigger)

const PIN_QUERY = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'

export default function RegionRail({ onExplore, onBook }) {
  const rootRef = useRef(null)
  const pinRef = useRef(null)
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const fillRef = useRef(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add(PIN_QUERY, () => {
      const track = trackRef.current
      const viewport = viewportRef.current
      const pin = pinRef.current
      if (!track || !viewport || !pin) return undefined

      const distance = () => track.scrollWidth - viewport.clientWidth

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          anticipatePin: 1,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (fillRef.current) fillRef.current.style.transform = `scaleX(${self.progress})`
            setActive(Math.round(self.progress * (destinationRegions.length - 1)))
          },
        },
      })

      const parallax = destinationRegions.map((region, i) => {
        const panel = track.children[i]
        const img = panel?.querySelector('.dp-rail__img')
        if (!img) return null
        return gsap.fromTo(
          img,
          { xPercent: -9, scale: 1.12 },
          {
            xPercent: 9,
            scale: 1.12,
            ease: 'none',
            scrollTrigger: {
              trigger: panel,
              containerAnimation: tween,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          },
        )
      })

      return () => {
        parallax.forEach((t) => t && t.scrollTrigger && t.scrollTrigger.kill())
        tween.scrollTrigger && tween.scrollTrigger.kill()
      }
    })
    return () => mm.revert()
  }, [])

  const scrollToRegion = (index) => {
    const trigger = ScrollTrigger.getAll().find((t) => t.trigger === pinRef.current)
    if (trigger) {
      const ratio = destinationRegions.length > 1 ? index / (destinationRegions.length - 1) : 0
      window.scrollTo({ top: trigger.start + ratio * (trigger.end - trigger.start), behavior: 'smooth' })
      return
    }
    const panel = trackRef.current?.children[index]
    panel?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  return (
    <section id="dp-rail" className="dp-rail" ref={rootRef} aria-labelledby="dp-rail-title">
      <div className="dp-rail__intro shell">
        <Reveal>
          <p className="eyebrow eyebrow--light"><span>01</span> The five regions</p>
          <h2 id="dp-rail-title">A country of <em>worlds.</em></h2>
        </Reveal>
        <Reveal className="dp-rail__intro-aside" delay={110}>
          <p>Scroll sideways through Nepal’s five trekking worlds. Each one is a different climate, culture and colour of mountain.</p>
        </Reveal>
      </div>

      <div className="dp-rail__pin" ref={pinRef}>
      <div className="dp-rail__viewport" ref={viewportRef}>
        <div className="dp-rail__track" ref={trackRef}>
          {destinationRegions.map((region, index) => (
            <article key={region.id} className={`dp-rail__panel ${index === active ? 'is-active' : ''}`}>
              <div className="dp-rail__media">
                <img className="dp-rail__img" src={region.image} alt={region.alt} style={{ objectPosition: region.imagePosition }} loading={index > 1 ? 'lazy' : 'eager'} decoding="async" />
                <span className="dp-rail__shade" aria-hidden="true" />
              </div>
              <div className="dp-rail__body">
                <div className="dp-rail__meta-row">
                  <span className="dp-rail__index">0{index + 1}</span>
                  <span className="dp-rail__mood">{region.mood}</span>
                </div>
                <h3 className="dp-rail__title">{region.title} <em>Nepal</em></h3>
                <p className="dp-rail__range">{region.range}</p>
                <p className="dp-rail__desc">{region.description}</p>
                <div className="dp-rail__facts">
                  <span><Footprints size={15} /> {region.days}</span>
                  <span><ShieldCheck size={15} /> {region.permit}</span>
                  <span><CalendarDays size={15} /> {region.best}</span>
                </div>
                <div className="dp-rail__ctas">
                  <button type="button" className="dp-rail__explore" onClick={() => onExplore(region.id)}>
                    <span>View journeys</span><ArrowRight size={16} aria-hidden="true" />
                  </button>
                  <button type="button" className="dp-rail__book" onClick={onBook}>
                    <span>Private trip</span><ArrowUpRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="dp-rail__bar shell" aria-hidden="true">
        <span className="dp-rail__line"><i ref={fillRef} /></span>
        <div className="dp-rail__nav">
          {destinationRegions.map((region, index) => (
            <button key={region.id} type="button" className={index === active ? 'is-active' : ''} onClick={() => scrollToRegion(index)} aria-label={`Go to ${region.title} region`}>
              {region.title}
            </button>
          ))}
        </div>
      </div>
      </div>
    </section>
  )
}
