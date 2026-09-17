import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { trips, signatureItinerary } from '../../data/content'
import Reveal from '../Reveal'

const EASE = [0.22, 1, 0.36, 1]

export default function SignatureJourney({ onBook }) {
  const everest = trips.find((t) => t.id === 'everest-base-camp')

  return (
    <section id="tp-signature" className="tp-signature" aria-labelledby="tp-signature-title">
      <div className="shell tp-signature__grid">
        <div className="tp-signature__sticky">
          <Reveal>
            <p className="eyebrow"><span>01</span> The signature journey</p>
            <h2 id="tp-signature-title">The one the world came to <em>walk.</em></h2>
            <p className="tp-signature__lede">
              Fifteen days through the heart of the Khumbu — carved mani walls, butter-lamp
              monasteries, the Khumbu glacier, and a final morning at the foot of the highest
              mountain on Earth. Led by Sherpa guides who were born to this trail.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <figure className="tp-signature__figure">
              <img
                src={everest.image}
                alt={everest.alt}
                loading="lazy"
                decoding="async"
                style={{ objectPosition: everest.imagePosition }}
              />
              <figcaption>Khumbu · 5,364 m · Day 10</figcaption>
            </figure>
          </Reveal>

          <Reveal delay={160}>
            <dl className="tp-signature__stats">
              <div><dt>Duration</dt><dd>{everest.duration}</dd></div>
              <div><dt>High point</dt><dd>5,545 m</dd></div>
              <div><dt>Difficulty</dt><dd>{everest.difficulty}</dd></div>
              <div><dt>From</dt><dd>${everest.price.toLocaleString()}</dd></div>
            </dl>
          </Reveal>

          <Reveal className="tp-signature__ctas" delay={200}>
            <button className="button button--dark" type="button" onClick={() => onBook(everest)}>
              <span>Book Everest Base Camp</span><ArrowRight size={17} aria-hidden="true" />
            </button>
            <a className="inline-link" href="#tp-collection">
              Browse all eight
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </Reveal>
        </div>

        <div>
          <Reveal>
            <div className="tp-timeline__head">
              <h3>The route, day by day</h3>
              <span>Eight of the journey’s defining days</span>
            </div>
          </Reveal>

          <ol className="tp-timeline">
            {signatureItinerary.map((beat, index) => (
              <motion.li
                key={beat.day}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: (index % 3) * 0.06, ease: EASE }}
              >
                <span className="tp-timeline__node" aria-label={`Day ${parseInt(beat.day, 10)}`}>{beat.day}</span>
                <div>
                  <div className="tp-timeline__title">
                    <h4>{beat.title}</h4>
                    <span>Day {parseInt(beat.day, 10)} of {everest.durationDays}</span>
                  </div>
                  <p>{beat.body}</p>
                </div>
              </motion.li>
            ))}
          </ol>

          <Reveal className="tp-timeline__close">
            <p>
              Seven more days of the finest trail in the world — with every permit, lodge,
              meal and altitude check already handled.
            </p>
            <button className="button button--outline" type="button" onClick={() => onBook(everest)}>
              <span>Open the full itinerary</span><ArrowRight size={17} aria-hidden="true" />
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
