import React from 'react'

import type { Trip, TripRailBlock } from '@/payload-types'

import { TripCard } from '@/components/cards/TripCard'
import { getPayloadClient } from '@/lib/payload'

/**
 * Horizontal scroll rail. CSS scroll-snap rather than a JS carousel: it is
 * natively swipeable, keyboard scrollable, and ships no JavaScript.
 *
 * `auto` mode respects the `showInTrekRail` / `railOrder` fields on Trips,
 * which is how the legacy Vite rail was curated.
 */
export async function TripRailBlockComponent({
  heading,
  intro,
  limit,
  source,
  trips,
}: TripRailBlock) {
  let docs: Trip[] = []

  if (source === 'manual') {
    docs = (trips ?? []).filter((t): t is Trip => typeof t === 'object')
  } else {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'trips',
      depth: 1,
      limit: limit ?? 8,
      overrideAccess: false,
      sort: 'railOrder',
      where: { and: [{ _status: { equals: 'published' } }, { showInTrekRail: { equals: true } }] },
    })
    docs = result.docs
  }

  if (!docs.length) return null

  return (
    <section className="blk-tripRail section-pad">
      <div className="shell">
        {heading ? <h2>{heading}</h2> : null}
        {intro ? <p className="blk-intro">{intro}</p> : null}
      </div>

      <ul className="blk-tripRail__track">
        {docs.map((trip) => (
          <li key={trip.id}>
            <TripCard sizes="(max-width: 768px) 80vw, 380px" trip={trip} />
          </li>
        ))}
      </ul>
    </section>
  )
}
