import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { craftSteps } from '../../data/content'
import Reveal from '../Reveal'

const EASE = [0.22, 1, 0.36, 1]

const STEP_IMAGES = [
  '/images/dest-craft-guide.webp',
  '/images/dest-valley.webp',
  '/images/dest-lodge.webp',
  '/images/region-eastern.webp',
]

export default function CraftSection() {
  const [active, setActive] = useState(0)
  const blocksRef = useRef([])

  useEffect(() => {
    if (typeof window.IntersectionObserver !== 'function') return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(Number(entry.target.dataset.step))
          }
        })
      },
      { threshold: 0.55 },
    )
    blocksRef.current.forEach((node) => node && observer.observe(node))
    return () => observer.disconnect()
  }, [])

  const current = craftSteps[active]

  return (
    <section className="dp-craft" aria-labelledby="dp-craft-title">
      <div className="shell dp-craft__grid">
        <div className="dp-craft__sticky">
          <Reveal>
            <p className="eyebrow eyebrow--light"><span>03</span> The Hike Globally way</p>
            <h2 id="dp-craft-title">Built by hand,<br /><em>led by heart.</em></h2>
          </Reveal>

          <div className="dp-craft__current">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.number}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <span className="dp-craft__num" aria-hidden="true">{current.number}</span>
                <h3>{current.title}</h3>
                <p>{current.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <ol className="dp-craft__steps" aria-label="How we build a journey">
            {craftSteps.map((step, index) => (
              <li key={step.number}>
                <button type="button" className={index === active ? 'is-active' : ''} onClick={() => setActive(index)}>
                  <span>{step.number}</span>
                  {step.title}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="dp-craft__scroll">
          {craftSteps.map((step, index) => (
            <div
              key={step.number}
              className="dp-craft__block"
              data-step={index}
              ref={(node) => { blocksRef.current[index] = node }}
            >
              <figure className={index % 2 === 1 ? 'dp-craft__figure dp-craft__figure--offset' : 'dp-craft__figure'}>
                <img src={STEP_IMAGES[index]} alt="" loading="lazy" decoding="async" />
                <figcaption>{step.title}</figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
