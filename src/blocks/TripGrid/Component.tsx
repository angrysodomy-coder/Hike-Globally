import React from 'react'

import type { Trip, TripGridBlock } from '@/payload-types'

import { TripCard } from '@/components/cards/TripCard'
import { getPayloadClient } from '@/lib/payload'

/**
 * An ASYNC server component. It fetches its own data rather than having the
 * page pass it down — the page cannot know what any given block needs, and
 * prop-drilling through `RenderBlocks` would force every page query to
 * over-fetch for blocks that may not be present.
 *
 * In `manual` mode the trips are already populated by the page's `depth: 3`,
 * so there is no second query at all.
 */
export async function TripGridBlockComponent({
  filters,
  heading,
  intro,
  source,
  trips,
}: TripGridBlock) {
  let docs: Trip[] = []

  if (source === 'manual') {
    docs = (trips ?? []).filter((t): t is Trip => typeof t === 'object')
  } else {
    const payload = await getPayloadClient()
    const and: Record<string, unknown>[] = [{ _status: { equals: 'published' } }]

    if (filters?.destinations?.length) {
      and.push({
        destination: {
          in: filters.destinations.map((d) => (typeof d === 'object' ? d.id : d)),
        },
      })
    }
    if (filters?.difficulty?.length) and.push({ difficulty: { in: filters.difficulty } })
    if (filters?.seasons?.length) and.push({ seasons: { in: filters.seasons } })
    if (filters?.featuredOnly) and.push({ featured: { equals: true } })

    const result = await payload.find({
      collection: 'trips',
      depth: 1,
      limit: filters?.limit ?? 6,
      overrideAccess: false,
      sort: '-featured',
      where: { and } as never,
    })

    docs = result.docs
  }

  if (!docs.length) return null

  return (
    <section className="blk-tripGrid section-pad">
      <div className="shell">
        {heading ? <h2>{heading}</h2> : null}
        {intro ? <p className="blk-intro">{intro}</p> : null}

        <div className="blk-tripGrid__grid">
          {docs.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </div>
    </section>
  )
}
