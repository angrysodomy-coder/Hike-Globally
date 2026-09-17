import { motion } from 'framer-motion'
import { trips } from '../../data/content'
import Reveal from '../Reveal'

const EASE = [0.22, 1, 0.36, 1]

const SEASONS = [
  { id: 'Spring', months: 'Mar – May' },
  { id: 'Summer', months: 'Jun – Aug' },
  { id: 'Autumn', months: 'Sep – Nov' },
  { id: 'Winter', months: 'Dec – Feb' },
]

function Dot({ state, index }) {
  if (state === 'off') {
    return <span className="tp-matrix__dot tp-matrix__dot--off" aria-label="Off season" />
  }
  return (
    <motion.span
      className={`tp-matrix__dot ${state === 'prime' ? 'tp-matrix__dot--prime' : 'tp-matrix__dot--good'}`}
      initial={{ scale: 0 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.035, ease: EASE }}
      aria-label={state === 'prime' ? 'Prime season' : 'Runs in this season'}
    />
  )
}

export default function SeasonMatrix() {
  return (
    <section id="tp-seasons" className="tp-seasons section-pad" aria-labelledby="tp-seasons-title">
      <div className="shell">
        <div className="section-intro">
          <Reveal>
            <p className="eyebrow"><span>03</span> When to go</p>
            <h2 id="tp-seasons-title">The year, <em>by season.</em></h2>
          </Reveal>
          <Reveal className="section-intro__aside" delay={110}>
            <p>
              Nepal never sleeps — it changes light. Spring blooms, summer holds the
              rain shadow, autumn clears, winter stills. Match your dates to the
              journey, and the mountain does the rest.
            </p>
          </Reveal>
        </div>

        <Reveal>
          <div className="tp-seasons__scroll">
            <div className="tp-matrix" role="table" aria-label="Journey seasons">
              <div className="tp-matrix__row tp-matrix__row--head" role="row">
                <div className="tp-matrix__name" role="columnheader">
                  <span>Journey</span>
                </div>
                {SEASONS.map((s) => (
                  <span className="tp-matrix__season" key={s.id} role="columnheader">
                    {s.id}
                    <small>{s.months}</small>
                  </span>
                ))}
              </div>

              {trips.map((trip, rowIndex) => (
                <div className="tp-matrix__row tp-matrix__row--trip" role="row" key={trip.id}>
                  <div className="tp-matrix__name">
                    <h4>{trip.title}</h4>
                    <span>{trip.location}</span>
                  </div>
                  {SEASONS.map((s, colIndex) => {
                    const state = trip.prime === s.id ? 'prime' : trip.seasons.includes(s.id) ? 'good' : 'off'
                    return (
                      <span className="tp-matrix__cell" role="cell" key={s.id}>
                        <Dot state={state} index={rowIndex * 4 + colIndex} />
                      </span>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="tp-matrix__legend" aria-hidden="true">
            <span><i className="tp-matrix__dot tp-matrix__dot--prime" /> Prime season — our lead dates</span>
            <span><i className="tp-matrix__dot tp-matrix__dot--good" /> Runs in this season</span>
            <span><i className="tp-matrix__dot tp-matrix__dot--off" /> Off season</span>
          </div>
          <p style={{ marginTop: 14, color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
            A full departure calendar, with exact dates and remaining places, travels with every enquiry.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
