import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Quote } from 'lucide-react'
import { destinationVoices } from '../../data/content'

const EASE = [0.22, 1, 0.36, 1]

export default function VoicesSection() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = destinationVoices.length

  useEffect(() => {
    if (paused) return undefined
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return undefined
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), 6500)
    return () => window.clearInterval(timer)
  }, [paused, count])

  const voice = destinationVoices[index]

  return (
    <section
      className="dp-voices"
      aria-labelledby="dp-voices-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="shell dp-voices__inner">
        <p className="eyebrow eyebrow--light"><span>05</span> Voices from the trail</p>
        <h2 id="dp-voices-title" className="sr-only">What travellers say</h2>
        <Quote className="dp-voices__quote" aria-hidden="true" />

        <div className="dp-voices__stage">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <p>“{voice.quote}”</p>
              <footer>
                <strong>{voice.name}</strong>
                <span>{voice.detail}</span>
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        <div className="dp-voices__controls">
          <div className="dp-voices__dots" role="group" aria-label="Choose testimonial">
            {destinationVoices.map((v, i) => (
              <button
                key={v.name}
                type="button"
                className={i === index ? 'is-active' : ''}
                aria-label={`Show testimonial ${i + 1} of ${count}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <div className="dp-voices__arrows">
            <button type="button" onClick={() => setIndex((index - 1 + count) % count)} aria-label="Previous testimonial"><ArrowLeft size={18} /></button>
            <button type="button" onClick={() => setIndex((index + 1) % count)} aria-label="Next testimonial"><ArrowRight size={18} /></button>
          </div>
        </div>
      </div>
    </section>
  )
}
