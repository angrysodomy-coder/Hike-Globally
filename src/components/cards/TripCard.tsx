import { Clock3, Gauge, Mountain } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import type { Trip } from '@/payload-types'

import { CMSImage } from '@/components/CMSImage'
import { metres, money, titleCase } from '@/components/TripPage/format'

/**
 * Exactly the fields this card reads — nothing more.
 *
 * Typed as a `Pick` rather than `Trip` on purpose. The list queries use
 * `select` to avoid dragging 17 itinerary days of rich text into a grid of
 * cards, so they return partial documents. Demanding a full `Trip` here would
 * force those queries to over-fetch; this way the compiler enforces the
 * contract in the other direction — add a field to the card and the query
 * stops compiling until its `select` includes it.
 */
export type TripCardData = Pick<
  Trip,
  | 'basePrice'
  | 'cardImage'
  | 'currency'
  | 'destination'
  | 'difficulty'
  | 'durationDays'
  | 'featured'
  | 'id'
  | 'maxAltitudeMetres'
  | 'slug'
  | 'summary'
  | 'title'
>

/**
 * One trip card, shared by the trip grid, the rail and the inline tripCard
 * Lexical block — so a price or badge change lands in all three at once.
 *
 * `sizes` is a prop, not a constant: the same card is 33vw in a grid and
 * ~380px in a rail, and `next/image` cannot work that out on its own.
 */
export function TripCard({
  sizes = '(max-width: 768px) 86vw, (max-width: 1200px) 45vw, 30vw',
  trip,
  variant = 'vertical',
}: {
  sizes?: string
  trip: TripCardData
  variant?: 'full' | 'horizontal' | 'vertical'
}) {
  const destination = typeof trip.destination === 'object' ? trip.destination : null

  return (
    <article className={`card-trip card-trip--${variant}`}>
      <Link className="card-trip__link" href={`/trips/${trip.slug}`}>
        <div className="card-trip__media">
          <CMSImage resource={trip.cardImage} sizes={sizes} />
          {trip.featured ? <span className="card-trip__badge">Featured</span> : null}
        </div>

        <div className="card-trip__body">
          {destination ? <p className="card-trip__kicker">{destination.title}</p> : null}
          <h3 className="card-trip__title">{trip.title}</h3>
          {trip.summary ? <p className="card-trip__summary">{trip.summary}</p> : null}

          <ul className="card-trip__facts">
            <li>
              <Clock3 aria-hidden="true" size={13} /> {trip.durationDays} days
            </li>
            <li>
              <Gauge aria-hidden="true" size={13} /> {titleCase(trip.difficulty)}
            </li>
            <li>
              <Mountain aria-hidden="true" size={13} /> {metres(trip.maxAltitudeMetres)}
            </li>
          </ul>

          <p className="card-trip__price">
            <small>From</small> {money(trip.basePrice, trip.currency)}
          </p>
        </div>
      </Link>
    </article>
  )
}
