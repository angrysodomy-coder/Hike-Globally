import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Clock3, Gauge, Mountain, Search, Sparkles } from 'lucide-react'
import { trips } from '../../data/content'
import Reveal from '../Reveal'

const EASE = [0.22, 1, 0.36, 1]

const REGIONS = ['All', ...new Set(trips.map((t) => t.destination))]
const DIFFICULTIES = ['All', 'Easy', 'Moderate', 'Challenging']
const SEASONS = ['All', 'Spring', 'Summer', 'Autumn', 'Winter']

const SORTS = [
  { id: 'featured', label: 'Featured first' },
  { id: 'price-asc', label: 'Price · low to high' },
  { id: 'price-desc', label: 'Price · high to low' },
  { id: 'duration-asc', label: 'Duration · shortest first' },
  { id: 'duration-desc', label: 'Duration · longest first' },
]

const SORTERS = {
  featured: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  'duration-asc': (a, b) => a.durationDays - b.durationDays,
  'duration-desc': (a, b) => b.durationDays - a.durationDays,
}

function TripCard({ trip, index, onBook }) {
  return (
    <motion.article
      className="tp-card"
      layout
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.25, ease: 'easeIn' } }}
      transition={{ duration: 0.55, delay: Math.min(index, 5) * 0.05, ease: EASE }}
      aria-label={trip.title}
    >
      <div className="tp-card__media">
        <img
          src={trip.image}
          alt={trip.alt}
          loading="lazy"
          decoding="async"
          style={{ objectPosition: trip.imagePosition }}
        />
        <div className="tp-card__shade" aria-hidden="true" />
        <span className="tp-card__tag"><i aria-hidden="true" />{trip.availability}</span>
        <span className="tp-card__price">from <strong>${trip.price.toLocaleString()}</strong></span>
      </div>

      <div className="tp-card__body">
        <p className="tp-card__loc">
          <Sparkles size={12} aria-hidden="true" />
          {trip.location} · {trip.type}
        </p>
        <h3 className="tp-card__title">{trip.title}</h3>
        <p className="tp-card__moment">“{trip.highlight}”</p>
        <div className="tp-card__meta">
          <span><Clock3 size={14} aria-hidden="true" />{trip.duration}</span>
          <span><Gauge size={14} aria-hidden="true" />{trip.difficulty}</span>
          <span><Mountain size={14} aria-hidden="true" />{trip.elevation}</span>
        </div>
        <div className="tp-card__foot">
          <span className="tp-card__dep">
            <small>Departures</small>
            <strong>{trip.departures}</strong>
          </span>
          <button className="tp-card__go" type="button" onClick={() => onBook(trip)}>
            View journey <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.article>
  )
}

export default function TripCollection({ onBook }) {
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [season, setSeason] = useState('All')
  const [sort, setSort] = useState('featured')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = trips.filter((t) => {
      if (region !== 'All' && t.destination !== region) return false
      if (difficulty !== 'All' && t.difficulty !== difficulty) return false
      if (season !== 'All' && !t.seasons.includes(season)) return false
      if (q && !`${t.title} ${t.location} ${t.destination} ${t.description} ${t.highlight}`.toLowerCase().includes(q)) return false
      return true
    })
    return [...list].sort(SORTERS[sort] || SORTERS.featured)
  }, [query, region, difficulty, season, sort])

  const filtersActive = query.trim() !== '' || region !== 'All' || difficulty !== 'All' || season !== 'All'

  const clearAll = () => {
    setQuery('')
    setRegion('All')
    setDifficulty('All')
    setSeason('All')
  }

  return (
    <section id="tp-collection" className="tp-collection" aria-labelledby="tp-collection-title">
      <div className="shell">
        <div className="section-intro">
          <Reveal>
            <p className="eyebrow"><span>02</span> The collection</p>
            <h2 id="tp-collection-title">Eight ways into the <em>Himalaya.</em></h2>
          </Reveal>
          <Reveal className="section-intro__aside" delay={110}>
            <p>
              Filter by mountain, effort or season — every journey below is a complete
              small-group departure: two leaders, family-run lodges, every permit and meal
              handled before your first step.
            </p>
          </Reveal>
        </div>

        <Reveal>
          <div className="tp-controls" role="search" aria-label="Search the collection">
            <label className="tp-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a journey, a region, a feeling…"
                aria-label="Search journeys"
              />
            </label>
            <label className="tp-sort">
              <span>Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort journeys">
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="tp-chips" role="group" aria-label="Filter by region">
            <span className="tp-chips__label">Region</span>
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                className={region === r ? 'is-active' : ''}
                aria-pressed={region === r}
                onClick={() => setRegion(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="tp-chips">
            <span className="tp-chips__label">Effort</span>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                className={difficulty === d ? 'is-active' : ''}
                aria-pressed={difficulty === d}
                onClick={() => setDifficulty(d)}
              >
                {d === 'All' ? 'Any effort' : d}
              </button>
            ))}
            <span className="tp-chips__label">Season</span>
            {SEASONS.map((s) => (
              <button
                key={s}
                type="button"
                className={season === s ? 'is-active' : ''}
                aria-pressed={season === s}
                onClick={() => setSeason(s)}
              >
                {s === 'All' ? 'Any season' : s}
              </button>
            ))}
          </div>

          <p className="tp-count" aria-live="polite">
            <span>
              Showing <strong>{filtered.length}</strong> of <strong>{trips.length}</strong> journeys
              {filtersActive ? ', filtered' : ''}
            </span>
            {filtersActive && (
              <button type="button" className="tp-count__clear" onClick={clearAll}>
                Clear all filters
              </button>
            )}
          </p>
        </Reveal>

        {filtered.length > 0 ? (
          <motion.div className="tp-grid" layout>
            <AnimatePresence mode="popLayout">
              {filtered.map((trip, index) => (
                <TripCard key={trip.id} trip={trip} index={index} onBook={onBook} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="tp-empty">
            <p className="eyebrow"><span>—</span> Nothing on this line</p>
            <h3>No journeys match that combination.</h3>
            <p>
              The Himalaya is bigger than our calendar — if you can describe it, we can
              route it. Private journeys start from a conversation, not a catalogue.
            </p>
            <div className="tp-empty__actions">
              <button className="button button--outline" type="button" onClick={clearAll}>
                <span>Clear all filters</span>
              </button>
              <button className="button button--dark" type="button" onClick={() => onBook()}>
                <span>Build it with us</span><ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
