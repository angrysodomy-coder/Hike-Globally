import React from 'react'

import type { ItineraryShowcaseBlock, Media } from '@/payload-types'

import { CMSImage } from '@/components/CMSImage'
import { metres } from '@/components/TripPage/format'
import { lexicalToPlainText } from '@/hooks/populateReadingTime'

type Row = {
  altitudeMetres?: null | number
  body?: null | string
  image?: Media | null | number
  title: string
  walkingHours?: null | string
}

/**
 * Shows a handful of itinerary days as a teaser, in two modes.
 *
 * In `trip` mode it reads the real itinerary off the related trip, so the
 * marketing page cannot drift from the actual product. Day bodies are rich
 * text there and plain text in `manual` mode, so the former is flattened to
 * a one-line summary rather than rendered — this is a teaser, and the full
 * copy lives on the trip page.
 */
export function ItineraryShowcaseBlockComponent({
  days,
  heading,
  intro,
  source,
  trip,
}: ItineraryShowcaseBlock) {
  let rows: Row[] = []

  if (source === 'trip' && typeof trip === 'object' && trip?.itinerary?.length) {
    rows = trip.itinerary.slice(0, 6).map((day) => ({
      altitudeMetres: day.altitudeMetres,
      body: lexicalToPlainText(day.body).slice(0, 180),
      image: day.gallery?.[0],
      title: day.title,
      walkingHours: day.walkingHours,
    }))
  } else {
    rows = (days ?? []) as Row[]
  }

  if (!rows.length) return null

  return (
    <section className="blk-itinerary section-pad">
      <div className="shell">
        {heading ? <h2>{heading}</h2> : null}
        {intro ? <p className="blk-intro">{intro}</p> : null}

        <ol className="blk-itinerary__list">
          {rows.map((row, i) => (
            <li key={i}>
              <span aria-hidden="true" className="blk-itinerary__num">
                {String(i + 1).padStart(2, '0')}
              </span>

              {row.image ? (
                <div className="blk-itinerary__media">
                  <CMSImage resource={row.image} sizes="(max-width: 768px) 100vw, 260px" />
                </div>
              ) : null}

              <div className="blk-itinerary__copy">
                <h3>{row.title}</h3>
                <p className="blk-itinerary__meta">
                  {typeof row.altitudeMetres === 'number' ? metres(row.altitudeMetres) : null}
                  {row.walkingHours ? <i aria-hidden="true" /> : null}
                  {row.walkingHours}
                </p>
                {row.body ? <p>{row.body}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
