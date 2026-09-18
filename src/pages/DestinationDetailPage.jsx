import { useMemo } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Compass, MapPin, RefreshCw, Sparkles } from 'lucide-react'
import { useDestination } from '../services/payload/destinations'
import { useTrips } from '../services/payload/trips'
import { Link, usePageMeta } from '../lib/router'
import Reveal from '../components/Reveal'

export default function DestinationDetailPage({ slug, onBook }) {
  const { destination, loading, error, notFound, refetch } = useDestination(slug)
  const { trips: allTrips } = useTrips()

  usePageMeta({
    title: destination ? `${destination.name} Nepal — Hike Globally` : 'Destination — Hike Globally',
    description: destination?.metaDescription || destination?.description || 'Himalayan region exploration.',
  })

  // Filter trips belonging to this region
  const regionTrips = useMemo(() => {
    if (!destination) return []
    const slugName = destination.slug?.toLowerCase() || ''
    const destName = destination.name?.toLowerCase() || ''
    return allTrips.filter((t) => {
      const tripDest = (t.destination || '').toLowerCase()
      const tripLoc = (t.location || '').toLowerCase()
      if (slugName === 'eastern' || destName.includes('eastern')) {
        return tripDest.includes('everest') || tripLoc.includes('khumbu')
      }
      if (slugName === 'western' || destName.includes('western')) {
        return tripDest.includes('annapurna') || tripDest.includes('mustang') || tripLoc.includes('annapurna')
      }
      if (slugName === 'central' || destName.includes('central')) {
        return tripDest.includes('langtang') || tripDest.includes('kathmandu') || tripLoc.includes('langtang')
      }
      if (slugName === 'mid-west' || destName.includes('mid-west')) {
        return tripDest.includes('dolpo') || tripLoc.includes('rara')
      }
      if (slugName === 'far-west' || destName.includes('far-west')) {
        return tripLoc.includes('api') || tripLoc.includes('khaptad')
      }
      return tripDest.includes(slugName) || tripLoc.includes(slugName)
    })
  }, [destination, allTrips])

  if (loading) {
    return (
      <main className="destination-detail-page section-pad">
        <div className="shell">
          <div className="detail-skeleton">
            <div className="skeleton-bar skeleton-bar--short" />
            <div className="skeleton-bar skeleton-bar--title" />
            <div className="skeleton-hero" />
          </div>
        </div>
      </main>
    )
  }

  if (notFound || (!destination && !loading && !error)) {
    return (
      <main className="destination-detail-page section-pad">
        <div className="shell text-center">
          <p className="eyebrow"><span>404</span> Region Not Found</p>
          <h2>This region lies beyond our map.</h2>
          <p className="detail-error__desc">
            The destination you are searching for may be mapped under another name.
          </p>
          <div className="detail-error__actions">
            <Link href="/destinations" className="button button--primary">
              <ArrowLeft size={16} /> All Destinations
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (error && !destination) {
    return (
      <main className="destination-detail-page section-pad">
        <div className="shell text-center">
          <p className="eyebrow">Connection Notice</p>
          <h2>Unable to reach the destination records</h2>
          <button type="button" className="button button--primary" onClick={() => refetch()}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="destination-detail-page">
      {/* Hero */}
      <section className="detail-hero">
        <div className="detail-hero__media" aria-hidden="true">
          <img
            src={destination.image}
            alt={destination.alt || destination.name}
            style={{ objectPosition: destination.imagePosition }}
          />
          <div className="detail-hero__shade" />
        </div>

        <div className="shell detail-hero__inner">
          <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/destinations">
              <ArrowLeft size={15} /> All Destinations
            </Link>
          </nav>

          <p className="eyebrow">
            <span>Region {destination.number}</span> {destination.kicker}
          </p>
          <h1 className="detail-hero__title">{destination.name} <em>Nepal</em></h1>

          <div className="detail-hero__meta">
            <div className="meta-pill">
              <CalendarDays size={15} />
              <span>Best Season: {destination.bestTimeToVisit}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Description & Attractions */}
      <section className="detail-overview section-pad">
        <div className="shell">
          <div className="detail-grid">
            <div className="detail-grid__main">
              <Reveal>
                <p className="eyebrow"><span>01</span> The Region</p>
                <h2>A distinct realm in the <em>Himalayan chain.</em></h2>
              </Reveal>

              <Reveal delay={80}>
                <div className="detail-prose">
                  <p>{destination.description}</p>
                </div>
              </Reveal>

              {destination.attractions && destination.attractions.length > 0 && (
                <section className="destination-attractions">
                  <Reveal>
                    <p className="eyebrow"><span>02</span> Highlights</p>
                    <h3>Landmarks & <em>Sanctuaries</em></h3>
                  </Reveal>

                  <div className="attractions-list">
                    {destination.attractions.map((item, idx) => (
                      <div key={idx} className="attraction-card">
                        <h4>{item.title}</h4>
                        {item.description && <p>{item.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Journeys in this region */}
              <section className="destination-trips section-pad">
                <Reveal>
                  <p className="eyebrow"><span>03</span> Hand-built routes</p>
                  <h3>Journeys in <em>{destination.name}</em></h3>
                </Reveal>

                {regionTrips.length > 0 ? (
                  <div className="destination-trips-grid">
                    {regionTrips.map((trip) => (
                      <article key={trip.id} className="dest-trip-card">
                        <div className="dest-trip-card__media">
                          <img src={trip.image} alt={trip.alt || trip.title} />
                          <span>{trip.type}</span>
                        </div>
                        <div className="dest-trip-card__body">
                          <small><MapPin size={12} /> {trip.location}</small>
                          <h4>{trip.title}</h4>
                          <p>{trip.highlight || trip.shortDescription}</p>
                          <div className="dest-trip-card__foot">
                            <span>From <strong>${trip.price.toLocaleString()}</strong></span>
                            <div className="dest-trip-card__links">
                              <Link href={`/trips/${trip.slug || trip.id}`} className="inline-link">
                                Details <ArrowRight size={14} />
                              </Link>
                              <button
                                type="button"
                                className="button button--small"
                                onClick={() => onBook?.(trip)}
                              >
                                Plan
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="private-expedition-notice">
                    <p>
                      We craft private custom expeditions throughout {destination.name}. Our local designers arrange
                      exclusive wilderness logistics, specialized permits, and experienced Sherpa leadership.
                    </p>
                    <button
                      type="button"
                      className="button button--primary"
                      onClick={() => onBook?.({ title: `${destination.name} Private Expedition`, region: destination.name })}
                    >
                      Enquire for a private expedition <ArrowRight size={17} />
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
