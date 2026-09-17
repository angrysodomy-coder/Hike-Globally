import { useEffect, useRef } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import { tripStats } from '../../data/content'

function Counter({ value }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || !inView) return undefined
    if (reduced) {
      el.textContent = value.toLocaleString()
      return undefined
    }
    const controls = animate(0, value, {
      duration: 1.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { el.textContent = Math.round(v).toLocaleString() },
    })
    return () => controls.stop()
  }, [inView, value, reduced])

  return <span className="tp-stats__value-num" ref={ref}>0</span>
}

export default function TripStats() {
  return (
    <section className="tp-stats" aria-label="Hike Globally journeys in numbers">
      <div className="shell tp-stats__grid">
        {tripStats.map((stat, index) => (
          <div className="tp-stats__cell" key={stat.label} style={{ '--i': index }}>
            <p className="tp-stats__value">
              <Counter value={stat.value} />
              {stat.suffix && <span className="tp-stats__suffix">{stat.suffix}</span>}
            </p>
            <h3>{stat.label}</h3>
            <p className="tp-stats__note">{stat.note}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
