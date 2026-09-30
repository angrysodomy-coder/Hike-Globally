import { ArrowRight, CalendarDays, Gauge, Headphones, Mountain, ShieldCheck, Sparkles, Timer, Users } from 'lucide-react'

/* ------------------------------------------------------------------
   The left rail: price, a glowing bordered booking box, and the
   on-this-page index. Sticky on desktop; it collapses to a full-width
   card above the article on tablets and phones.
   ------------------------------------------------------------------ */

const SECTIONS = [
  ['highlights', 'Trip highlights'],
  ['overview', 'Trek overview'],
  ['itinerary-outline', 'Day-to-day outline'],
  ['booking', 'Booking calendar'],
  ['itinerary', 'Full itinerary'],
  ['inclusions', 'Includes & excludes'],
  ['essential-information', 'Essential information'],
  ['route-map', 'Route map'],
  ['packing-list', 'Packing list'],
  ['faqs', 'FAQs'],
]

function scrollToBooking() {
  const target = document.getElementById('booking')
  if (!target) return
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  target.classList.add('is-flashed')
  window.setTimeout(() => target.classList.remove('is-flashed'), 1400)
}

export default function TripPriceRail({ trip, nextDeparture, onBook }) {
  const listPrice = Math.round(trip.price * 1.18)

  return (
    <aside className="tsp-rail" aria-label="Price and booking">
      <div className="tsp-rail__sticky">
        <div className="tsp-priceCard">
          <span className="tsp-priceCard__glow" aria-hidden="true" />
          <div className="tsp-priceCard__body">
            <p className="tsp-priceCard__tag">
              <Sparkles size={13} aria-hidden="true" /> {trip.availability}
            </p>

            <p className="tsp-priceCard__from">From</p>
            <p className="tsp-priceCard__price">
              <span className="tsp-priceCard__amount">${trip.price.toLocaleString()}</span>
              <span className="tsp-priceCard__unit">/ person</span>
            </p>
            <p className="tsp-priceCard__compare">
              <s>${listPrice.toLocaleString()}</s>
              <em>Save ${(listPrice - trip.price).toLocaleString()} booking direct</em>
            </p>

            <dl className="tsp-priceCard__facts">
              <div><dt><Timer size={14} aria-hidden="true" /> Duration</dt><dd>{trip.duration}</dd></div>
              <div><dt><Gauge size={14} aria-hidden="true" /> Grade</dt><dd>{trip.difficulty}</dd></div>
              <div><dt><Mountain size={14} aria-hidden="true" /> High point</dt><dd>{trip.elevation}</dd></div>
              <div><dt><Users size={14} aria-hidden="true" /> Group</dt><dd>Max 8 travellers</dd></div>
              <div><dt><CalendarDays size={14} aria-hidden="true" /> Next date</dt><dd>{nextDeparture}</dd></div>
            </dl>

            <button className="tsp-bookBtn tsp-bookBtn--rail" type="button" onClick={scrollToBooking}>
              <span className="tsp-bookBtn__shine" aria-hidden="true" />
              <span className="tsp-bookBtn__label">Book now<small>Choose your departure date</small></span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>

            <button className="tsp-rail__secondary" type="button" onClick={() => onBook?.(trip)}>
              <Headphones size={15} aria-hidden="true" /> Talk to a trip designer
            </button>

            <ul className="tsp-priceCard__trust">
              <li><ShieldCheck size={14} aria-hidden="true" /> 20% deposit · balance 45 days out</li>
              <li><ShieldCheck size={14} aria-hidden="true" /> Free date changes up to 60 days</li>
              <li><ShieldCheck size={14} aria-hidden="true" /> Guaranteed departures, no group top-ups</li>
            </ul>
          </div>
        </div>

        <nav className="tsp-rail__index" aria-label="On this page">
          <p>On this page</p>
          <ol>
            {SECTIONS.map(([id, label]) => (
              <li key={id}><a href={`#${id}`}>{label}</a></li>
            ))}
          </ol>
        </nav>
      </div>
    </aside>
  )
}
