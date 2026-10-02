import React from 'react'
import type { Payload, TypedUser } from 'payload'

import { DashboardClient, type DashboardData } from './DashboardClient'

/**
 * Custom admin dashboard (replaces Payload's default at /admin).
 *
 * Rendered as a React Server Component, so it can pull live numbers straight
 * from the Local API — no client fetches, no loading spinners — and hand them
 * to DashboardClient which adds the motion layer (count-ups, charts, bars).
 */

type DashboardViewProps = {
  payload?: Payload
  user?: (TypedUser & { name?: string; email?: string }) | null
}

const DAY = 86_400_000

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export const CustomDashboard: React.FC<DashboardViewProps> = async ({ payload, user }) => {
  const now = new Date()
  const today = startOfToday()
  const d30 = new Date(today.getTime() - 30 * DAY)
  const d60 = new Date(today.getTime() - 60 * DAY)

  const empty: DashboardData = {
    userName: user?.name || user?.email || 'friend',
    now: now.toISOString(),
    series: Array.from({ length: 30 }, () => 0),
    seriesDates: Array.from({ length: 30 }, (_, i) => new Date(d30.getTime() + i * DAY).toISOString()),
    inquiries30: 0,
    inquiriesPrev30: 0,
    statusCounts: { new: 0, contacted: 0, quoted: 0, converted: 0, closed: 0 },
    totalInquiries: 0,
    publishedTrips: 0,
    draftTrips: 0,
    publishedPosts: 0,
    draftPosts: 0,
    destinations: 0,
    mediaCount: 0,
    testimonials: 0,
    recentInquiries: [],
    upcomingDepartures: [],
    upcomingCount: 0,
    seatsBooked: 0,
    dbError: false,
  }

  if (!payload) {
    return <DashboardClient data={empty} />
  }

  // Counts (cheap aggregate queries) — note `count` has no `draft` option, so
  // draft totals come from a `find` with `draft: true` and limit 1, reading
  // `totalDocs` off the pagination envelope.
  const countResults = await Promise.allSettled([
    ...(['new', 'contacted', 'quoted', 'converted', 'closed'] as const).map((status) =>
      payload.count({ collection: 'inquiries', where: { status: { equals: status } } }),
    ),
    payload.find({ collection: 'trips', limit: 1 }), // published total (draft: false is the default)
    payload.find({
      collection: 'trips',
      where: { _status: { equals: 'draft' } },
      draft: true,
      limit: 1,
    }),
    payload.find({ collection: 'posts', limit: 1 }),
    payload.find({
      collection: 'posts',
      where: { _status: { equals: 'draft' } },
      draft: true,
      limit: 1,
    }),
    payload.count({ collection: 'destinations' }),
    payload.count({ collection: 'media' }),
    payload.count({ collection: 'testimonials' }),
  ])

  // Finds that carry documents: the 60-day inquiry window and every trip
  // (for flattening departure dates).
  const findResults = await Promise.allSettled([
    payload.find({
      collection: 'inquiries',
      where: { createdAt: { greater_than_equal: d60.toISOString() } },
      sort: '-createdAt',
      limit: 1000,
      pagination: false,
      depth: 1,
      select: { name: true, email: true, trip: true, status: true, createdAt: true },
    }),
    payload.find({
      collection: 'trips',
      limit: 200,
      pagination: false,
      sort: 'title',
      select: { title: true, slug: true, departures: true, currency: true, basePrice: true },
    }),
  ])

  const [
    stNew,
    stContacted,
    stQuoted,
    stConverted,
    stClosed,
    tripsPub,
    tripsDraft,
    postsPub,
    postsDraft,
    destCount,
    mediaCount,
    testimonialCount,
  ] = countResults

  const [inquiriesRes, tripsRes] = findResults

  const data: DashboardData = { ...empty }

  const statusValues = [stNew, stContacted, stQuoted, stConverted, stClosed]
  const statusKeys = ['new', 'contacted', 'quoted', 'converted', 'closed'] as const
  statusKeys.forEach((key, i) => {
    if (statusValues[i].status === 'fulfilled') {
      data.statusCounts[key] = statusValues[i].value.totalDocs ?? 0
    }
  })
  data.totalInquiries = statusKeys.reduce((sum, key) => sum + (data.statusCounts[key] ?? 0), 0)

  const totalOf = (r: (typeof countResults)[number]): number | null =>
    r.status === 'fulfilled' ? (r.value.totalDocs ?? null) : null
  if (totalOf(tripsPub) != null) data.publishedTrips = totalOf(tripsPub)!
  if (totalOf(tripsDraft) != null) data.draftTrips = totalOf(tripsDraft)!
  if (totalOf(postsPub) != null) data.publishedPosts = totalOf(postsPub)!
  if (totalOf(postsDraft) != null) data.draftPosts = totalOf(postsDraft)!
  if (destCount.status === 'fulfilled') data.destinations = destCount.value.totalDocs ?? 0
  if (mediaCount.status === 'fulfilled') data.mediaCount = mediaCount.value.totalDocs ?? 0
  if (testimonialCount.status === 'fulfilled') data.testimonials = testimonialCount.value.totalDocs ?? 0

  if (inquiriesRes.status === 'fulfilled') {
    const docs = inquiriesRes.value.docs as Array<{
      id: number | string
      name?: string
      email?: string
      trip?: number | string | { id: number | string; title?: string } | null
      status?: string
      createdAt?: string
    }>

    const series = Array.from({ length: 30 }, () => 0)
    let inquiries30 = 0
    let inquiriesPrev30 = 0

    for (const doc of docs) {
      if (!doc.createdAt) continue
      const created = new Date(doc.createdAt).getTime()
      if (created >= d30.getTime()) {
        const idx = Math.min(29, Math.max(0, Math.floor((created - d30.getTime()) / DAY)))
        series[idx] += 1
        inquiries30 += 1
      } else {
        inquiriesPrev30 += 1
      }
    }

    data.series = series
    data.inquiries30 = inquiries30
    data.inquiriesPrev30 = inquiriesPrev30

    data.recentInquiries = docs.slice(0, 6).map((doc) => ({
      id: doc.id,
      name: doc.name || doc.email || 'Unknown',
      email: doc.email || '',
      tripTitle:
        doc.trip && typeof doc.trip === 'object' && 'title' in doc.trip ? doc.trip.title ?? null : null,
      status: doc.status || 'new',
      createdAt: doc.createdAt || now.toISOString(),
    }))
  }

  if (tripsRes.status === 'fulfilled') {
    type TripDoc = {
      id: number | string
      title?: string
      slug?: string
      departures?: Array<{
        startDate?: string
        endDate?: string
        price?: number | null
        seatsTotal?: number | null
        seatsBooked?: number | null
        status?: string | null
      }>
      currency?: string
      basePrice?: number
    }
    const trips = tripsRes.value.docs as TripDoc[]

    const upcoming: DashboardData['upcomingDepartures'] = []
    let seatsBooked = 0

    for (const trip of trips) {
      for (const dep of trip.departures ?? []) {
        if (!dep.startDate) continue
        const start = new Date(dep.startDate).getTime()
        if (start < today.getTime() || start > today.getTime() + 365 * DAY) continue
        seatsBooked += dep.seatsBooked ?? 0
        upcoming.push({
          id: `${trip.id}-${dep.startDate}`,
          tripTitle: trip.title || 'Untitled journey',
          tripSlug: trip.slug || String(trip.id),
          startDate: dep.startDate,
          endDate: dep.endDate || dep.startDate,
          seatsTotal: dep.seatsTotal ?? null,
          seatsBooked: dep.seatsBooked ?? null,
          status: dep.status ?? null,
          price: dep.price ?? trip.basePrice ?? null,
          currency: trip.currency || 'USD',
        })
      }
    }

    upcoming.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    data.upcomingDepartures = upcoming.slice(0, 6)
    data.upcomingCount = upcoming.length
    data.seatsBooked = seatsBooked
  }

  data.dbError =
    [...countResults, ...findResults].some((r) => r.status === 'rejected')

  return <DashboardClient data={data} />
}

export default CustomDashboard
