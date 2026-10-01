import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import { cache } from 'react'

import type { Where } from 'payload'

import type { Departure, Trip } from '@/payload-types'

import { getPayloadClient } from '@/lib/payload'

/**
 * React `cache()` dedupes identical calls within ONE request. The trip page
 * calls this from both `generateMetadata` and the component body; without it
 * that is two identical database round trips per render.
 *
 * Note `overrideAccess: draft` — access control is only bypassed when an
 * authenticated editor is previewing. For everyone else `publishedOrAuthenticated`
 * pins the query to published documents, so an unpublished trip 404s rather
 * than leaking.
 */
export const getTripBySlug = cache(async (slug: string): Promise<null | Trip> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'trips',
    // depth 2: trip → destination / media → the media document's own fields.
    depth: 2,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: { slug: { equals: slug } },
  })

  return result.docs[0] ?? null
})

/**
 * Upcoming, publicly bookable departures for one trip.
 *
 * A separate query rather than the `join` field on Trips, for two reasons:
 * it filters to future non-private non-cancelled dates (the join returns
 * everything), and it keeps availability on its own cache tag so selling the
 * last seat does not invalidate the trip's editorial content.
 */
export const getTripDepartures = cache(async (tripId: number | string): Promise<Departure[]> => {
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'departures',
    depth: 0,
    limit: 60,
    overrideAccess: false,
    sort: 'startDate',
    where: {
      and: [
        { trip: { equals: tripId } },
        { isPrivate: { not_equals: true } },
        { status: { not_equals: 'cancelled' } },
        { startDate: { greater_than_equal: new Date().toISOString() } },
      ],
    },
  })

  return result.docs
})

export type TripListFilters = {
  destination?: string
  difficulty?: string[]
  limit?: number
  page?: number
  search?: string
  seasons?: string[]
  sort?: '-durationDays' | '-price' | '-publishedAt' | 'durationDays' | 'price'
}

/**
 * The /trips index. Tagged `trips`, so one trip edit invalidates every filter
 * permutation at once without anyone having to enumerate them.
 *
 * Written as a standalone function on purpose: when Payload declares
 * `cacheComponents` compatible, swapping `unstable_cache` for `'use cache'` +
 * `cacheTag()` is a ten-line diff here rather than a refactor (§11.4).
 */
export const getTrips = async (filters: TripListFilters = {}) => {
  const {
    destination,
    difficulty,
    limit = 12,
    page = 1,
    search,
    seasons,
    sort = '-publishedAt',
  } = filters

  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()

      const and: Where[] = [{ _status: { equals: 'published' } }]
      if (destination) and.push({ 'destination.slug': { equals: destination } })
      if (difficulty?.length) and.push({ difficulty: { in: difficulty } })
      if (seasons?.length) and.push({ seasons: { in: seasons } })
      if (search) and.push({ or: [{ title: { like: search } }, { summary: { like: search } }] })

      return payload.find({
        collection: 'trips',
        depth: 1,
        limit,
        overrideAccess: false,
        page,
        /**
         * `select` is the single biggest performance lever on a list page.
         * Without it Payload returns every field — including 17 itinerary days
         * of rich text per trip — to render a grid of cards.
         */
        select: {
          title: true,
          slug: true,
          basePrice: true,
          cardImage: true,
          currency: true,
          destination: true,
          difficulty: true,
          durationDays: true,
          featured: true,
          highlight: true,
          maxAltitudeMetres: true,
          seasons: true,
          summary: true,
        },
        sort,
        where: { and },
      })
    },
    ['trips-index', JSON.stringify(filters)],
    { revalidate: 3600, tags: ['trips'] },
  )()
}

/** Slugs for `generateStaticParams`. Published only — drafts have no public URL. */
export const getAllTripSlugs = async (): Promise<string[]> => {
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'trips',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: { slug: true },
    where: { _status: { equals: 'published' } },
  })

  return result.docs.map((doc) => doc.slug).filter(Boolean)
}
