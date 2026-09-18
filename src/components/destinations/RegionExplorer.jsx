import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, CalendarDays, Footprints, Gauge, MapPin, Sparkles } from 'lucide-react'
import { destinationRegions, trips as staticTrips } from '../../data/content'
import { useTrips } from '../../services/payload/trips'
import Reveal from '../Reveal'

const EASE = [0.22, 1, 0.36, 1]

function ExplorerTripCard({ trip, onBook }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="dp-explore__trip"
    >
      <div className="dp-explore__trip-media">
        <img src={trip.image} alt={trip.alt} style={{ objectPosition: trip.imagePosition }} loading="lazy" decoding="async" />
        <span className="dp-explore__trip-type">{trip.type}</span>
      </div>
      <div className="dp-explore__trip-body">
        <p className="dp-explore__trip-loc"><MapPin size={13} /> {trip.location}</p>
        <h4>{trip.title}</h4>
        <div className="dp-explore__trip-meta">
          <span><Footprints size={14} /> {trip.duration}</span>
          <span><Gauge size={14} /> {trip.difficulty}</span>
        </div>
        <div className="dp-explore__trip-foot">
          <span className="dp-explore__price"><small>From</small> ${trip.price.toLocaleString()}</span>
          <button type="button" onClick={() => onBook(trip)} aria-label={`Plan ${trip.title}`}>
            Plan <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.article>
  )
}

export default function RegionExplorer({ selected, onSelect, onBook, trips: propTrips }) {
  const { trips: liveTrips } = useTrips()
  const trips = propTrips || liveTrips || staticTrips
  const region = destinationRegions.find((r) => r.id === selected) || null
  const list = useMemo(() => {
    if (!region) return trips
    return region.trips.map((id) => trips.find((t) => t.id === id || t.slug === id)).filter(Boolean)
  }, [region, trips])

  return (
    <section id="dp-explorer" className="dp-explorer section-pad" aria-labelledby="dp-explorer-title">
      <div className="shell">
        <div className="section-intro section-intro--explorer">
          <Reveal>
            <p className="eyebrow"><span>02</span> Region explorer</p>
            <h2 id="dp-explorer-title">Find your <em>line.</em></h2>
          </Reveal>
          <Reveal className="section-intro__aside" delay={110}>
            <p>Filter the collection by region. Each journey below is locally led, small-group and paced for the altitude it climbs.</p>
          </Reveal>
        </div>

        <div className="dp-explorer__chips" role="tablist" aria-label="Filter journeys by region">
          <button
            type="button"
            role="tab"
            aria-selected={!region}
            className={region ? '' : 'is-active'}
            onClick={() => onSelect(null)}
          >
            All regions
          </button>
          {destinationRegions.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={region?.id === r.id}
              className={region?.id === r.id ? 'is-active' : ''}
              onClick={() => onSelect(r.id)}
            >
              {r.title}
            </button>
          ))}
        </div>

        <div className="dp-explorer__layout">
          <AnimatePresence mode="wait">
            <motion.aside
              key={region ? region.id : 'all'}
              className="dp-explorer__panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              {region ? (
                <>
                  <p className="dp-explorer__panel-mood"><Sparkles size={15} /> {region.mood}</p>
                  <h3>{region.title} <em>Nepal</em></h3>
                  <p className="dp-explorer__panel-desc">{region.description}</p>
                  <ul className="dp-explorer__highlights">
                    {region.highlights.map((h) => <li key={h}>{h}</li>)}
                  </ul>
                  <div className="dp-explorer__panel-facts">
                    <span><Footprints size={14} /> {region.days}</span>
                    <span><CalendarDays size={14} /> {region.best}</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="dp-explorer__panel-mood"><Sparkles size={15} /> The whole country</p>
                  <h3>Every <em>journey.</em></h3>
                  <p className="dp-explorer__panel-desc">
                    Eight signature routes across five regions — from first-timer ridges to high,
                    glacier-carved passes. Pick a region chip to narrow the field.
                  </p>
                  <ul className="dp-explorer__highlights">
                    <li>Small groups of eight or fewer</li>
                    <li>Locally owned lodges throughout</li>
                    <li>Contingency days built in</li>
                  </ul>
                </>
              )}
            </motion.aside>
          </AnimatePresence>

          <motion.div layout className="dp-explorer__grid" aria-live="polite">
            <AnimatePresence mode="popLayout">
              {list.length ? (
                list.map((trip) => <ExplorerTripCard key={trip.id} trip={trip} onBook={onBook} />)
              ) : (
                <motion.div key="private" layout className="dp-explorer__private" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h4>Private expeditions only</h4>
                  <p>This region is too wild for scheduled departures. We run it privately, on your dates, with a dedicated local team.</p>
                  <button type="button" onClick={onBook}>
                    <span>Design this journey</span><ArrowRight size={16} aria-hidden="true" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
