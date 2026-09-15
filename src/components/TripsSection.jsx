import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { trips } from '../data/content'
import Reveal from './Reveal'

const defaultFilters = {
  query: '',
  destination: '',
  type: '',
  difficulty: '',
  duration: '',
  price: '',
  season: '',
}

function monthToSeason(month = '') {
  const value = month.toLowerCase()
  if (/december|january|february/.test(value)) return 'Winter'
  if (/march|april|may/.test(value)) return 'Spring'
  if (/june|july|august/.test(value)) return 'Summer'
  if (/september|october|november/.test(value)) return 'Autumn'
  return ''
}

function TripCard({ trip, index, onBook }) {
  return (
    <Reveal as="article" className="trip-card" delay={(index % 2) * 90}>
      <div className="trip-card__image">
        <img
          src={trip.image}
          alt={trip.alt}
          loading="lazy"
          decoding="async"
          style={{ objectPosition: trip.imagePosition }}
        />
        <span className="trip-card__index">0{index + 1}</span>
        <span className="trip-card__availability"><i /> {trip.availability}</span>
        <button type="button" className="trip-card__image-cta" onClick={() => onBook(trip)} aria-label={`View ${trip.title}`}>
          <ArrowUpRight size={22} aria-hidden="true" />
        </button>
      </div>
      <div className="trip-card__body">
        <div className="trip-card__location">{trip.location}</div>
        <h3>{trip.title}</h3>
        <p className="trip-card__description">{trip.description}</p>
        <div className="trip-card__meta">
          <span><small>Duration</small>{trip.duration}</span>
          <span><small>Difficulty</small>{trip.difficulty}</span>
          <span><small>From</small><strong>${trip.price.toLocaleString()}</strong></span>
        </div>
        <button className="trip-card__link" type="button" onClick={() => onBook(trip)}>
          <span>View this trip</span><ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
    </Reveal>
  )
}

function FilterSelect({ label, name, value, onChange, children }) {
  return (
    <label className="filter-select">
      <span>{label}</span>
      <select name={name} value={value} onChange={onChange}>
        {children}
      </select>
      <ChevronDown size={14} aria-hidden="true" />
    </label>
  )
}

export default function TripsSection({ discovery, onBook }) {
  const [filters, setFilters] = useState(defaultFilters)
  const [sort, setSort] = useState('featured')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!discovery?.key) return
    setFilters({
      ...defaultFilters,
      destination: discovery.destination || '',
      type: ['Trek', 'Cultural'].includes(discovery.type) ? discovery.type : '',
      season: monthToSeason(discovery.when),
    })
    setShowAll(true)
  }, [discovery])

  const filteredTrips = useMemo(() => {
    const matched = trips.filter((trip) => {
      const searchable = `${trip.title} ${trip.location} ${trip.description}`.toLowerCase()
      const matchesQuery = !filters.query || searchable.includes(filters.query.toLowerCase())
      const matchesDestination = !filters.destination || trip.destination === filters.destination
      const matchesType = !filters.type || trip.type === filters.type
      const matchesDifficulty = !filters.difficulty || trip.difficulty === filters.difficulty
      const matchesSeason = !filters.season || trip.seasons.includes(filters.season)
      const matchesDuration = !filters.duration
        || (filters.duration === 'short' && trip.durationDays <= 11)
        || (filters.duration === 'medium' && trip.durationDays >= 12 && trip.durationDays <= 15)
        || (filters.duration === 'long' && trip.durationDays >= 16)
      const matchesPrice = !filters.price
        || (filters.price === 'under-1200' && trip.price < 1200)
        || (filters.price === '1200-1700' && trip.price >= 1200 && trip.price <= 1700)
        || (filters.price === 'over-1700' && trip.price > 1700)
      return matchesQuery && matchesDestination && matchesType && matchesDifficulty && matchesSeason && matchesDuration && matchesPrice
    })

    return [...matched].sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price
      if (sort === 'duration') return a.durationDays - b.durationDays
      return Number(b.featured) - Number(a.featured)
    })
  }, [filters, sort])

  const hasFilters = Object.values(filters).some(Boolean)
  const visibleTrips = showAll || hasFilters ? filteredTrips : filteredTrips.slice(0, 4)

  const updateFilter = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
    setShowAll(true)
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
    setSort('featured')
    setShowAll(false)
  }

  return (
    <section id="trips" className="trips-section section-pad" aria-labelledby="trips-title">
      <div className="shell">
        <div className="section-intro section-intro--trips">
          <Reveal>
            <p className="eyebrow"><span>01</span> Curated journeys</p>
            <h2 id="trips-title">Where will you<br /><em>go next?</em></h2>
          </Reveal>
          <Reveal className="section-intro__aside" delay={110}>
            <p>From unforgettable mountain adventures to immersive cultural journeys, discover trips designed around the places worth experiencing.</p>
            <button className="inline-link" type="button" onClick={() => setShowAll((value) => !value)}>
              <span>{showAll ? 'Show selected journeys' : 'View all trips'}</span><ArrowUpRight size={17} aria-hidden="true" />
            </button>
          </Reveal>
        </div>

        <Reveal className="trip-filters" delay={80}>
          <label className="trip-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Search trips</span>
            <input
              type="search"
              name="query"
              value={filters.query}
              onChange={updateFilter}
              placeholder="Search trips"
              autoComplete="off"
            />
            {filters.query && (
              <button type="button" onClick={() => setFilters((current) => ({ ...current, query: '' }))} aria-label="Clear search">
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </label>

          <div className="trip-filters__primary">
            <FilterSelect label="Destination" name="destination" value={filters.destination} onChange={updateFilter}>
              <option value="">All regions</option>
              {[...new Set(trips.map((trip) => trip.destination))].map((value) => <option key={value} value={value}>{value}</option>)}
            </FilterSelect>
            <FilterSelect label="Trip type" name="type" value={filters.type} onChange={updateFilter}>
              <option value="">All experiences</option>
              <option value="Trek">Trekking</option>
              <option value="Cultural">Culture & discovery</option>
            </FilterSelect>
            <FilterSelect label="Difficulty" name="difficulty" value={filters.difficulty} onChange={updateFilter}>
              <option value="">All levels</option>
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Challenging">Challenging</option>
            </FilterSelect>
          </div>

          <button
            type="button"
            className={`all-filters-button ${advancedOpen ? 'is-active' : ''}`}
            onClick={() => setAdvancedOpen((open) => !open)}
            aria-expanded={advancedOpen}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            <span>All filters</span>
            {hasFilters && <i>{Object.values(filters).filter(Boolean).length}</i>}
          </button>
        </Reveal>

        <div
          className={`advanced-filters ${advancedOpen ? 'advanced-filters--open' : ''}`}
          aria-hidden={!advancedOpen}
          inert={!advancedOpen}
        >
          <div className="advanced-filters__inner">
            <FilterSelect label="Duration" name="duration" value={filters.duration} onChange={updateFilter}>
              <option value="">Any duration</option>
              <option value="short">Up to 11 days</option>
              <option value="medium">12–15 days</option>
              <option value="long">16+ days</option>
            </FilterSelect>
            <FilterSelect label="Price" name="price" value={filters.price} onChange={updateFilter}>
              <option value="">Any price</option>
              <option value="under-1200">Under $1,200</option>
              <option value="1200-1700">$1,200–$1,700</option>
              <option value="over-1700">Over $1,700</option>
            </FilterSelect>
            <FilterSelect label="Best season" name="season" value={filters.season} onChange={updateFilter}>
              <option value="">Any season</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Autumn">Autumn</option>
              <option value="Winter">Winter</option>
            </FilterSelect>
            <button type="button" className="clear-filters" onClick={clearFilters} disabled={!hasFilters}>
              Clear filters
            </button>
          </div>
        </div>

        <div className="trip-results-bar" aria-live="polite">
          <span><strong>{filteredTrips.length}</strong> {filteredTrips.length === 1 ? 'journey' : 'journeys'} found</span>
          {hasFilters && <span className="filters-applied"><Check size={14} aria-hidden="true" /> Filters applied</span>}
          <label>
            <span>Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="duration">Shortest first</option>
            </select>
            <ChevronDown size={13} aria-hidden="true" />
          </label>
        </div>

        {visibleTrips.length > 0 ? (
          <div className="trip-grid">
            {visibleTrips.map((trip, index) => (
              <TripCard key={trip.id} trip={trip} index={index} onBook={onBook} />
            ))}
          </div>
        ) : (
          <div className="empty-trips">
            <p className="eyebrow">The trail continues</p>
            <h3>No exact match—yet.</h3>
            <p>Try widening your filters, or let our team craft the journey you have in mind.</p>
            <button className="button button--dark" type="button" onClick={clearFilters}>See all journeys <ArrowRight size={17} /></button>
          </div>
        )}

        {!showAll && !hasFilters && filteredTrips.length > 4 && (
          <Reveal className="trips-section__more">
            <button type="button" className="button button--outline" onClick={() => setShowAll(true)}>
              Explore all {filteredTrips.length} journeys <ArrowRight size={17} aria-hidden="true" />
            </button>
          </Reveal>
        )}
      </div>
    </section>
  )
}
