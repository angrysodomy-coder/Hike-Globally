import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import React from 'react'
import { getPayloadClient, getTripBySlug } from '@/lib/queries'
import { redirectOrNotFound } from '@/lib/redirects'
import { generateTripMeta } from '@/lib/generateMeta'
import { tripJsonLd } from '@/lib/structuredData'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { TripDetail } from '@/components/trips/TripDetail'
import TripDetailRoute from '@/views/routes/TripDetailRoute'
import { getTripBySlug as getLegacyTrip } from '@/data/tripDetails'
import { safeStaticParams } from '@/lib/safeStaticParams'

type Args = { params: Promise<{ slug: string }> }

// Safety-net ISR; on-demand revalidation (afterChange hook) is the primary mechanism.
export const revalidate = 86400
export const dynamicParams = true

export async function generateStaticParams() {
  return safeStaticParams('trips/[slug]', async () => {
    const payload = await getPayloadClient()
    const trips = await payload.find({
      collection: 'trips',
      where: { _status: { equals: 'published' } },
      select: { slug: true },
      limit: 1000,
      pagination: false,
    })
    return trips.docs.map(({ slug }) => ({ slug }))
  })
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const trip = await getTripBySlug(slug)
  if (trip) return generateTripMeta(trip)

  const legacy = getLegacyTrip(slug)
  if (!legacy) return {}

  return {
    title: `${legacy.title} — ${legacy.duration}`,
    description: legacy.description,
    openGraph: {
      title: legacy.title,
      description: legacy.description,
      images: legacy.image ? [legacy.image] : undefined,
    },
  }
}

/* Payload first; as soon as a trip is published in the CMS it takes over its
   slug and is rendered by the branded <TripDetailRoute />. Journeys that have not
   been migrated yet keep their original hand-built page, so nothing breaks
   mid-migration. */
export default async function TripPage({ params }: Args) {
  const { slug } = await params
  const trip = await getTripBySlug(slug)

  if (!trip && !getLegacyTrip(slug)) {
    return redirectOrNotFound(`/trips/${slug}`)
  }

  return (
    <>
      {trip && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(tripJsonLd(trip)) }}
        />
      )}
      <TripDetailRoute slug={slug} cmsTrip={trip} />
    </>
  )
}
