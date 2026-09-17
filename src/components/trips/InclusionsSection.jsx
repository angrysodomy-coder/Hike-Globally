import { ArrowRight } from 'lucide-react'
import { tripInclusions } from '../../data/content'
import Reveal from '../Reveal'

export default function InclusionsSection({ onBook }) {
  return (
    <section id="tp-includes" className="tp-includes" aria-labelledby="tp-includes-title">
      <div className="shell">
        <div className="section-intro">
          <Reveal>
            <p className="eyebrow"><span>04</span> Every journey includes</p>
            <h2 id="tp-includes-title">Nothing left to <em>arrange.</em></h2>
          </Reveal>
          <Reveal className="section-intro__aside" delay={110}>
            <p>
              The price is the journey — not a list of add-ons. What follows is the
              floor of every departure, on every route, every season.
            </p>
          </Reveal>
        </div>

        <div className="tp-includes__grid">
          {tripInclusions.map((item, index) => (
            <Reveal key={item.title} delay={(index % 2) * 90}>
              <div className="tp-include">
                <span className="tp-include__num">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="tp-includes__private">
          <h3>Or make it <em>yours.</em></h3>
          <p>
            Private departures run on your dates, at your pace, for families and small
            groups — the same leaders, the same inclusions, none of the compromise.
            This is the work we are proudest of.
          </p>
          <button className="button button--dark" type="button" onClick={onBook}>
            <span>Design a private journey</span><ArrowRight size={17} aria-hidden="true" />
          </button>
        </Reveal>
      </div>
    </section>
  )
}
