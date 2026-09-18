import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Clock,
  Compass,
  Footprints,
  MapPin,
  Mountain,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useTrip } from '../services/payload/trips'
import { Link, usePageMeta } from '../lib/router'
import Reveal from '../components/Reveal'

export default function TripDetailPage({ slug, onBook }) {
  const { trip, loading, error, notFound, refetch } = useTrip(slug)

  usePageMeta({
    title: trip ? `${trip.title} — Hike Globally` : 'Journey — Hike Globally',
    description: trip?.metaDescription || trip?.description || 'Himalayan journey details.',
  })

  if (loading) {
    return (
      <main className="trip-detail-page trip-detail-page--loading section-pad">
        <div className="shell">
          <div className="detail-skeleton">
            <div className="skeleton-bar skeleton-bar--short" />
            <div className="skeleton-bar skeleton-bar--title" />
            <div className="skeleton-hero" />
            <div className="skeleton-grid">
              <div className="skeleton-bar" />
              <div className="skeleton-bar" />
              <div className="skeleton-bar" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (notFound || (!trip && !loading && !error)) {
    return (
      <main className="trip-detail-page trip-detail-page--404 section-pad">
        <div className="shell text-center">
          <p className="eyebrow"><span>404</span> Route Not Found</p>
          <h2>This journey is off the map.</h2>
          <p className="detail-error__desc">
            The journey you are looking for may have concluded or moved to a new route.
          </p>
          <div className="detail-error__actions">
            <Link href="/trips" className="button button--primary">
              <ArrowLeft size={16} /> View all journeys
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (error && !trip) {
    return (
      <main className="trip-detail-page trip-detail-page--error section-pad">
        <div className="shell text-center">
          <p className="eyebrow">Connection Notice</p>
          <h2>Unable to load journey details</h2>
          <p className="detail-error__desc">
            We had difficulty reaching the expedition server. Please try refreshing.
          </p>
          <button type="button" className="button button--primary" onClick={() => refetch()}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="trip-detail-page">
      {/* Detail Hero */}
      <section className="detail-hero">
        <div className="detail-hero__media" aria-hidden="true">
          <img
            src={trip.image}
            alt={trip.alt || trip.title}
            style={{ objectPosition: trip.imagePosition || 'center center' }}
          />
          <div className="detail-hero__shade" />
        </div>

        <div className="shell detail-hero__inner">
          <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/trips">
              <ArrowLeft size={15} /> All Journeys
            </Link>
            <span aria-hidden="true">/</span>
            <span>{trip.destination}</span>
          </nav>

          <p className="eyebrow">
            <span>{trip.type}</span> {trip.location}
          </p>
          <h1 className="detail-hero__title">{trip.title}</h1>

          <div className="detail-hero__meta">
            <div className="meta-pill">
              <Clock size={15} />
              <span>{trip.duration}</span>
            </div>
            <div className="meta-pill">
              <Mountain size={15} />
              <span>{trip.difficulty}</span>
            </div>
            <div className="meta-pill">
              <Compass size={15} />
              <span>Max {trip.elevation}</span>
            </div>
            {trip.price > 0 && (
              <div className="meta-pill meta-pill--price">
                <span>From <strong>${trip.price.toLocaleString()}</strong></span>
              </div>
            )}
          </div>

          <div className="detail-hero__cta">
            <button
              type="button"
              className="button button--primary"
              onClick={() => onBook?.(trip)}
            >
              Plan this journey <ArrowRight size={17} />
            </button>
            <span className="detail-hero__avail">
              <i aria-hidden="true" /> {trip.availability}
            </span>
          </div>
        </div>
      </section>

      {/* Overview & Highlights */}
      <section className="detail-overview section-pad">
        <div className="shell">
          <div className="detail-grid">
            <div className="detail-grid__main">
              <Reveal>
                <p className="eyebrow"><span>01</span> The Expedition</p>
                <h2>An honest passage through the <em>Himalaya.</em></h2>
              </Reveal>

              {trip.highlight && (
                <Reveal delay={80}>
                  <blockquote className="detail-highlight-quote">
                    <Sparkles size={20} aria-hidden="true" />
                    <p>“{trip.highlight}”</p>
                  </blockquote>
                </Reveal>
              )}

              <Reveal delay={120}>
                <div className="detail-prose">
                  <p>{trip.description}</p>
                </div>
              </Reveal>

              {/* Day-by-Day Itinerary */}
              {trip.itinerary && trip.itinerary.length > 0 && (
                <section className="detail-itinerary">
                  <Reveal>
                    <p className="eyebrow"><span>02</span> Route & Rhythm</p>
                    <h3>Day-by-Day <em>Itinerary</em></h3>
                  </Reveal>

                  <div className="itinerary-timeline">
                    {trip.itinerary.map((dayItem, index) => (
                      <Reveal
                        as="article"
                        key={dayItem.day || index}
                        className="itinerary-node"
                        delay={(index % 4) * 50}
                      >
                        <div className="itinerary-node__marker">
                          <span>{String(dayItem.day || index + 1).padStart(2, '0')}</span>
                        </div>
                        <div className="itinerary-node__content">
                          <h4>{dayItem.title}</h4>
                          {dayItem.description && <p>{dayItem.description}</p>}
                          <div className="itinerary-node__meta">
                            {dayItem.altitude && (
                              <span>
                                <Mountain size={13} /> {dayItem.altitude}
                              </span>
                            )}
                            {dayItem.accommodation && (
                              <span>
                                <Footprints size={13} /> {dayItem.accommodation}
                              </span>
                            )}
                            {dayItem.meals && (
                              <span>
                                <ShieldCheck size={13} /> {dayItem.meals}
                              </span>
                            )}
                          </div>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </section>
              )}

              {/* Inclusions & Exclusions */}
              <section className="detail-inclusions">
                <Reveal>
                  <p className="eyebrow"><span>03</span> What is covered</p>
                  <h3>Standards & <em>Inclusions</em></h3>
                </Reveal>

                <div className="inclusions-grid">
                  {trip.inclusions && trip.inclusions.length > 0 && (
                    <div className="inclusions-box">
                      <h4><CheckCircle2 size={16} /> What’s included</h4>
                      <ul>
                        {trip.inclusions.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {trip.exclusions && trip.exclusions.length > 0 && (
                    <div className="exclusions-box">
                      <h4><XCircle size={16} /> What’s not included</h4>
                      <ul>
                        {trip.exclusions.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Sticky Sidebar */}
            <aside className="detail-sidebar">
              <div className="detail-card-sticky">
                <div className="detail-card-sticky__head">
                  <span className="detail-card-sticky__eyebrow">Guided Small Group</span>
                  <div className="detail-card-sticky__price">
                    <span>From</span>
                    <strong>${trip.price ? trip.price.toLocaleString() : '890'}</strong>
                    <small>per person</small>
                  </div>
                </div>

                <ul className="detail-specs-list">
                  <li>
                    <MapPin size={16} />
                    <div>
                      <small>Destination</small>
                      <span>{trip.location}</span>
                    </div>
                  </li>
                  <li>
                    <Clock size={16} />
                    <div>
                      <small>Duration</small>
                      <span>{trip.duration}</span>
                    </div>
                  </li>
                  <li>
                    <Mountain size={16} />
                    <div>
                      <small>Grade</small>
                      <span>{trip.difficulty}</span>
                    </div>
                  </li>
                  <li>
                    <Calendar size={16} />
                    <div>
                      <small>Departures</small>
                      <span>{trip.departures}</span>
                    </div>
                  </li>
                  <li>
                    <Users size={16} />
                    <div>
                      <small>Group Size</small>
                      <span>Small group (2–10 max)</span>
                    </div>
                  </li>
                </ul>

                <button
                  type="button"
                  className="button button--primary detail-sidebar__book"
                  onClick={() => onBook?.(trip)}
                >
                  Enquire about this journey <ArrowRight size={17} />
                </button>

                <p className="detail-sidebar__guarantee">
                  <ShieldCheck size={14} /> Locally led · 100% financial guarantee · Flexible dates
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
