import { useEffect, useRef } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import { destinationStats } from '../../data/content'

function Counter({ value }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || !inView) return undefined
    if (reduced) {
      el.textContent = String(value)
      return undefined
    }
    const controls = animate(0, value, {
      duration: 1.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { el.textContent = String(Math.round(v)) },
    })
    return () => controls.stop()
  }, [inView, value, reduced])

  return <span className="dp-stats__value-num" ref={ref}>0</span>
}

export default function StatsBand() {
  return (
    <section className="dp-stats" aria-label="Hike Globally in numbers">
      <div className="dp-stats__bg" aria-hidden="true">
        <img src="/images/dest-valley.webp" alt="" loading="lazy" decoding="async" />
      </div>
      <div className="dp-stats__wash" aria-hidden="true" />
      <div className="shell dp-stats__grid">
        {destinationStats.map((stat, index) => (
          <div className="dp-stats__cell" key={stat.label} style={{ '--i': index }}>
            <p className="dp-stats__value">
              <Counter value={stat.value} />
              <span className="dp-stats__suffix">{stat.suffix}</span>
            </p>
            <h3>{stat.label}</h3>
            <p className="dp-stats__note">{stat.note}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
