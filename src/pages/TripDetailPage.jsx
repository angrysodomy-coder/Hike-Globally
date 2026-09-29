import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Clock3, Gauge, Mountain } from 'lucide-react'
import { tripInclusions, signatureItinerary } from '../data/content'
import { getTripBySlug } from '../data/tripDetails'
import { Link, usePageMeta } from '../lib/router'
import Reveal from '../components/Reveal'

/* ------------------------------------------------------------------
   TripDetailPage — the standalone page every trip package resolves to
   (`/trips/<slug>`). Booking stays a deliberate second step: the page
   presents the journey, and the "Book this journey" CTAs open the
   booking drawer via `onBook`.
   ------------------------------------------------------------------ */

function NotFound() {
  usePageMeta({ title: 'Journey not found — Hike Globally' })
  return (
    <main id="main-content" className="trip-detail trip-detail--missing">
      <div className="shell">
        <p className="eyebrow"><span>—</span> Off the map</p>
        <h1>We couldn’t find that journey.</h1>
        <p>The trail you followed doesn’t match any of our current departures.</p>
        <Link className="button button--dark" href="/trips">
          <span>Browse all journeys</span><ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </main>
  )
}

export default function TripDetailPage({ slug, onBook }) {
  const trip = getTripBySlug(slug)

  usePageMeta({
    title: trip ? `${trip.title} — Hike Globally` : 'Journey not found — Hike Globally',
    description: trip?.description,
  })

  if (!trip) return <NotFound />

  const showItinerary = trip.id === 'everest-base-camp'

  return (
    <main id="main-content" className="trip-detail">
      {/* ---------- Hero ---------- */}
      <section className="trip-detail__hero" aria-labelledby="trip-detail-title">
        <div className="trip-detail__hero-media" aria-hidden="true">
          <img src={trip.image} alt="" style={{ objectPosition: trip.imagePosition }} />
        </div>
        <div className="trip-detail__hero-inner shell">
          <Link className="trip-detail__back" href="/trips">
            <ArrowLeft size={15} aria-hidden="true" /> All journeys
          </Link>
          <p className="eyebrow eyebrow--light"><span>{trip.type}</span> {trip.location}</p>
          <h1 id="trip-detail-title">{trip.title}</h1>
          <p className="trip-detail__standfirst">{trip.description}</p>
          <dl className="trip-detail__stats">
            <div><dt><Clock3 size={14} aria-hidden="true" /> Duration</dt><dd>{trip.duration}</dd></div>
            <div><dt><Gauge size={14} aria-hidden="true" /> Difficulty</dt><dd>{trip.difficulty}</dd></div>
            <div><dt><Mountain size={14} aria-hidden="true" /> High point</dt><dd>{trip.elevation}</dd></div>
            <div><dt><CalendarDays size={14} aria-hidden="true" /> From</dt><dd>${trip.price.toLocaleString()}</dd></div>
          </dl>
        </div>
      </section>

      {/* ---------- Overview + booking rail ---------- */}
      <section className="trip-detail__body section-pad">
        <div className="shell trip-detail__grid">
          <div className="trip-detail__overview">
            <Reveal>
              <p className="eyebrow"><span>01</span> The journey</p>
              <h2>The moment this trip is built around.</h2>
              <blockquote className="trip-detail__highlight">“{trip.highlight}”</blockquote>
              <p className="trip-detail__copy">{trip.description}</p>
              <p className="trip-detail__copy">
                Like every Hike Globally departure, this journey runs with two leaders, never
                more than eight travellers, family-run lodges chosen on foot, and every permit,
                meal and altitude check handled before your first step.
              </p>
            </Reveal>

            <Reveal>
              <dl className="trip-detail__facts">
                <div><dt>Best seasons</dt><dd>{trip.seasons.join(' · ')}</dd></div>
                <div><dt>Prime window</dt><dd>{trip.prime}</dd></div>
                <div><dt>Departures</dt><dd>{trip.departures}</dd></div>
                <div><dt>Region</dt><dd>{trip.destination}</dd></div>
                <div><dt>Style</dt><dd>{trip.type}</dd></div>
                <div><dt>Group size</dt><dd>Max 8 travellers</dd></div>
              </dl>
            </Reveal>

            {showItinerary && (
              <Reveal className="trip-detail__itinerary">
                <p className="eyebrow"><span>02</span> Day by day</p>
                <h2>Eight defining days of the route.</h2>
                <ol>
                  {signatureItinerary.map((beat) => (
                    <li key={beat.day}>
                      <span aria-label={`Day ${parseInt(beat.day, 10)}`}>{beat.day}</span>
                      <div>
                        <h3>{beat.title}</h3>
                        <p>{beat.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Reveal>
            )}
          </div>

          <aside className="trip-detail__aside">
            <div className="trip-detail__card">
              <p className="trip-detail__card-price"><small>From</small>${trip.price.toLocaleString()}<span> / person</span></p>
              <p className="trip-detail__card-avail"><i aria-hidden="true" /> {trip.availability}</p>
              <dl>
                <div><dt>Duration</dt><dd>{trip.duration}</dd></div>
                <div><dt>Departures</dt><dd>{trip.departures}</dd></div>
                <div><dt>Difficulty</dt><dd>{trip.difficulty}</dd></div>
              </dl>
              <button className="button button--dark" type="button" onClick={() => onBook(trip)}>
                <span>Book this journey</span><ArrowRight size={17} aria-hidden="true" />
              </button>
              <button className="trip-detail__ask" type="button" onClick={() => onBook()}>
                Ask a trip designer <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            </div>
          </aside>
        </div>
      </section>

      {/* ---------- Inclusions ---------- */}
      <section className="trip-detail__inclusions section-pad" aria-labelledby="trip-detail-inclusions">
        <div className="shell">
          <Reveal>
            <p className="eyebrow"><span>{showItinerary ? '03' : '02'}</span> Included, always</p>
            <h2 id="trip-detail-inclusions">Every departure, handled end to end.</h2>
          </Reveal>
          <div className="trip-detail__inclusion-grid">
            {tripInclusions.map((item, index) => (
              <Reveal key={item.title} delay={(index % 3) * 80}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="trip-detail__cta">
        <div className="shell">
          <Reveal>
            <h2>Ready to walk {trip.title}?</h2>
            <p>Tell us your dates and your pace — we’ll shape the rest around you.</p>
            <div className="trip-detail__cta-actions">
              <button className="button button--dark" type="button" onClick={() => onBook(trip)}>
                <span>Start planning</span><ArrowRight size={17} aria-hidden="true" />
              </button>
              <Link className="inline-link" href="/trips">
                Browse other journeys <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
