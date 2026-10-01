import {
  ArrowRight,
  CalendarDays,
  Gauge,
  Mountain,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
} from 'lucide-react'
import React from 'react'

import type { Departure, Trip } from '@/payload-types'

import { longDate, metres, money, nights, titleCase } from './format'

const SECTIONS: [string, string][] = [
  ['highlights', 'Trip highlights'],
  ['overview', 'Trek overview'],
  ['itinerary-outline', 'Day-to-day outline'],
  ['booking', 'Departure dates'],
  ['itinerary', 'Full itinerary'],
  ['inclusions', 'Includes & excludes'],
  ['essential-information', 'Essential information'],
  ['route-map', 'Route map'],
  ['packing-list', 'Packing list'],
  ['faqs', 'FAQs'],
]

/**
 * Sticky left rail: price, booking CTA, and the on-this-page index.
 *
 * A pure server component. The Vite version used onClick + smooth scroll;
 * here the CTA is a plain `#booking` anchor, which needs no JavaScript, works
 * before hydration, and still animates because `scroll-behavior: smooth` is
 * set in CSS. Availability text is derived from live departure rows rather
 * than a hand-typed field, so it cannot go stale.
 */
export function TripPriceRail({
  departures,
  trip,
}: {
  departures: Departure[]
  trip: Trip
}) {
  const next = departures[0]
  const seatsLeft = departures.reduce((sum, d) => sum + (d.spotsRemaining ?? 0), 0)

  const availability =
    departures.length === 0
      ? 'Private departures only'
      : seatsLeft <= 4
        ? `Only ${seatsLeft} places left this season`
        : `${departures.length} departures open`

  const deposit = trip.depositPercent
    ? money((trip.basePrice * trip.depositPercent) / 100, trip.currency)
    : null

  return (
    <aside aria-label="Price and booking" className="tsp-rail">
      <div className="tsp-rail__sticky">
        <div className="tsp-priceCard">
          <span aria-hidden="true" className="tsp-priceCard__glow" />
          <div className="tsp-priceCard__body">
            <p className="tsp-priceCard__tag">
              <Sparkles aria-hidden="true" size={13} /> {availability}
            </p>

            <p className="tsp-priceCard__from">From</p>
            <p className="tsp-priceCard__price">
              <span className="tsp-priceCard__amount">{money(trip.basePrice, trip.currency)}</span>
              <span className="tsp-priceCard__unit">/ person</span>
            </p>
            {deposit ? (
              <p className="tsp-priceCard__compare">
                <em>{deposit} deposit secures your place</em>
              </p>
            ) : null}

            <dl className="tsp-priceCard__facts">
              <div>
                <dt>
                  <Timer aria-hidden="true" size={14} /> Duration
                </dt>
                <dd>{nights(trip.durationDays)}</dd>
              </div>
              <div>
                <dt>
                  <Gauge aria-hidden="true" size={14} /> Grade
                </dt>
                <dd>{titleCase(trip.difficulty)}</dd>
              </div>
              <div>
                <dt>
                  <Mountain aria-hidden="true" size={14} /> High point
                </dt>
                <dd>{metres(trip.maxAltitudeMetres)}</dd>
              </div>
              <div>
                <dt>
                  <Users aria-hidden="true" size={14} /> Group
                </dt>
                <dd>Max {trip.groupSizeMax} travellers</dd>
              </div>
              <div>
                <dt>
                  <CalendarDays aria-hidden="true" size={14} /> Next date
                </dt>
                <dd>{longDate(next?.startDate)}</dd>
              </div>
            </dl>

            <a className="tsp-bookBtn tsp-bookBtn--rail" href="#booking">
              <span aria-hidden="true" className="tsp-bookBtn__shine" />
              <span className="tsp-bookBtn__label">
                Book now<small>Choose your departure date</small>
              </span>
              <ArrowRight aria-hidden="true" size={18} />
            </a>

            <p className="tsp-priceCard__trust">
              <ShieldCheck aria-hidden="true" size={14} /> Free cancellation up to 45 days before
              departure
            </p>
          </div>
        </div>

        <nav aria-label="On this page" className="tsp-rail__index">
          <p>On this page</p>
          <ol>
            {SECTIONS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`}>{label}</a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </aside>
  )
}
