import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { trips } from '../data/content'
import Reveal from './Reveal'

const MOBILE_QUERY = '(max-width: 1023px)'
const MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const PER_VIEW_DESKTOP = 4

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
    <Reveal as="article" className="trip-card trip-card--rail" delay={(index % PER_VIEW_DESKTOP) * 80}>
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

function TripsRail({ list, onBook }) {
  const outerRef = useRef(null)
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const fillRef = useRef(null)
  const frameRef = useRef(null)
  const stateRef = useRef({ mode: 'rail', distance: 0, pages: 1 })

  const [mode, setMode] = useState('rail')
  const [pages, setPages] = useState(1)
  const [activePage, setActivePage] = useState(0)

  const update = useCallback(() => {
    frameRef.current = null
    const outer = outerRef.current
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!outer || !viewport || !track) return

    const { mode: currentMode, distance, pages: pageTotal } = stateRef.current
    let progress = 0

    if (currentMode === 'pin') {
      const total = outer.offsetHeight - window.innerHeight
      const top = outer.getBoundingClientRect().top
      progress = total > 0 ? Math.min(1, Math.max(0, -top / total)) : 0
      track.style.transform = `translate3d(${(-progress * distance).toFixed(2)}px, 0, 0)`
    } else {
      const max = viewport.scrollWidth - viewport.clientWidth
      progress = max > 0 ? Math.min(1, Math.max(0, viewport.scrollLeft / max)) : 0
    }

    if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress})`

    const centerX = window.innerWidth / 2
    for (const card of track.children) {
      const rect = card.getBoundingClientRect()
      if (rect.right < -120 || rect.left > window.innerWidth + 120) continue
      const t = Math.max(-1, Math.min(1, (rect.left + rect.width / 2 - centerX) / window.innerWidth))
      card.style.setProperty('--img-x', `${(t * -24).toFixed(1)}px`)
    }

    const page = Math.round(progress * (pageTotal - 1))
    setActivePage((previous) => (previous === page ? previous : page))
  }, [])

  const schedule = useCallback(() => {
    if (!frameRef.current) frameRef.current = requestAnimationFrame(update)
  }, [update])

  const measure = useCallback(() => {
    const outer = outerRef.current
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!outer || !viewport || !track) return

    const isMobile = window.matchMedia(MOBILE_QUERY).matches
    const reduced = window.matchMedia(MOTION_QUERY).matches
    const distance = Math.max(0, track.scrollWidth - viewport.clientWidth)
    const shouldPin = !isMobile && !reduced && distance > 8
    const pageTotal = Math.max(1, Math.ceil(list.length / (isMobile ? 1 : PER_VIEW_DESKTOP)))

    stateRef.current = { mode: shouldPin ? 'pin' : 'rail', distance, pages: pageTotal }
    outer.classList.toggle('is-pin', shouldPin)
    outer.classList.toggle('is-rail', !shouldPin)
    outer.style.height = shouldPin ? `calc(100svh + ${Math.round(distance)}px)` : ''
    if (!shouldPin) track.style.transform = ''
    setMode(shouldPin ? 'pin' : 'rail')
    setPages(pageTotal)
    setActivePage((previous) => Math.min(previous, pageTotal - 1))
    schedule()
  }, [list.length, schedule])

  useLayoutEffect(() => {
    measure()
    const track = trackRef.current
    if (!track) return undefined
    const observer = new ResizeObserver(() => measure())
    observer.observe(track)
    const mobileQuery = window.matchMedia(MOBILE_QUERY)
    const motionQuery = window.matchMedia(MOTION_QUERY)
    mobileQuery.addEventListener('change', measure)
    motionQuery.addEventListener('change', measure)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      observer.disconnect()
      mobileQuery.removeEventListener('change', measure)
      motionQuery.removeEventListener('change', measure)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', schedule)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [measure, schedule])

  const goToPage = (index) => {
    const { mode: currentMode, pages: pageTotal } = stateRef.current
    const clamped = Math.max(0, Math.min(pageTotal - 1, index))
    const ratio = pageTotal > 1 ? clamped / (pageTotal - 1) : 0
    if (currentMode === 'pin') {
      const outer = outerRef.current
      const total = outer.offsetHeight - window.innerHeight
      const start = outer.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: start + ratio * total, behavior: 'smooth' })
    } else {
      const viewport = viewportRef.current
      const max = viewport.scrollWidth - viewport.clientWidth
      viewport.scrollTo({ left: ratio * max, behavior: 'smooth' })
    }
  }

  return (
    <div className="trips-scroll is-rail" ref={outerRef} data-mode={mode}>
      <div className="trips-scroll__pin">
        <div
          className="trips-scroll__viewport"
          ref={viewportRef}
          onScroll={schedule}
          tabIndex={0}
          aria-label="Curated journeys, scrolls horizontally"
        >
          <div className="trips-scroll__track" ref={trackRef}>
            {list.map((trip, index) => (
              <TripCard key={trip.id} trip={trip} index={index} onBook={onBook} />
            ))}
          </div>
        </div>

        <div className="trips-scroll__bar shell">
          <div className="trips-scroll__dots" role="group" aria-label="Journey sets">
            {Array.from({ length: pages }, (_, index) => (
              <button
                key={index}
                type="button"
                className={index === activePage ? 'is-active' : ''}
                onClick={() => goToPage(index)}
                aria-label={`Go to journeys set ${index + 1} of ${pages}`}
                aria-current={index === activePage}
              />
            ))}
          </div>
          <span className="trips-scroll__line" aria-hidden="true"><i ref={fillRef} /></span>
          <p className="trips-scroll__hint">Scroll to explore</p>
          <div className="trips-controls">
            <span aria-live="polite"><strong>0{activePage + 1}</strong> / 0{pages}</span>
            <button type="button" onClick={() => goToPage(activePage - 1)} disabled={activePage === 0} aria-label="Previous journeys">
              <ArrowLeft size={19} />
            </button>
            <button type="button" onClick={() => goToPage(activePage + 1)} disabled={activePage === pages - 1} aria-label="Next journeys">
              <ArrowRight size={19} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TripsSection({ discovery, onBook }) {
  const [filters, setFilters] = useState(defaultFilters)
  const [sort, setSort] = useState('featured')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    if (!discovery?.key) return
    setFilters({
      ...defaultFilters,
      destination: discovery.destination || '',
      type: ['Trek', 'Cultural'].includes(discovery.type) ? discovery.type : '',
      season: monthToSeason(discovery.when),
    })
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

  const updateFilter = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
    setSort('featured')
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
            <p>From unforgettable mountain adventures to immersive cultural journeys, discover trips designed around the places worth experiencing. Scroll sideways through the collection.</p>
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
      </div>

      {filteredTrips.length > 0 ? (
        <TripsRail list={filteredTrips} onBook={onBook} />
      ) : (
        <div className="shell">
          <div className="empty-trips">
            <p className="eyebrow">The trail continues</p>
            <h3>No exact match—yet.</h3>
            <p>Try widening your filters, or let our team craft the journey you have in mind.</p>
            <button className="button button--dark" type="button" onClick={clearFilters}>See all journeys <ArrowRight size={17} /></button>
          </div>
        </div>
      )}
    </section>
  )
}
