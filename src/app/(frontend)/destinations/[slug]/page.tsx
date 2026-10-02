import type { Metadata } from 'next'
import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import {
  getDestinationBySlug,
  getPayloadClient,
  getTripsForDestination,
} from '@/lib/queries'
import { redirectOrNotFound } from '@/lib/redirects'
import { PayloadImage } from '@/components/PayloadImage'
import { TripCard } from '@/components/trips/TripCard'
import type { Media } from '@/payload-types'

type Args = { params: Promise<{ slug: string }> }

export const revalidate = 86400
export const dynamicParams = true

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const destinations = await payload.find({
    collection: 'destinations',
    select: { slug: true },
    limit: 1000,
    pagination: false,
  })
  return destinations.docs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const destination = await getDestinationBySlug(slug)
  if (!destination) return {}

  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const hero = destination.heroImage as Media | number
  const ogImage =
    typeof hero === 'object' ? (hero.sizes?.og?.url ?? hero.url ?? undefined) : undefined

  return {
    title: `${destination.title} Trips & Treks | Hike Globally`,
    description:
      destination.summary ??
      `Trips, treks and tours in ${destination.title}, ${destination.country}.`,
    alternates: { canonical: `${serverURL}/destinations/${destination.slug}` },
    openGraph: {
      title: `${destination.title} | Hike Globally`,
      description: destination.summary ?? undefined,
      url: `${serverURL}/destinations/${destination.slug}`,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
  }
}

export default async function DestinationPage({ params }: Args) {
  const { slug } = await params
  const destination = await getDestinationBySlug(slug)

  if (!destination) return redirectOrNotFound(`/destinations/${slug}`)

  const trips = await getTripsForDestination(destination.id)

  return (
    <main id="main-content" className="cms-surface">
      <section className="relative h-[50vh] min-h-[360px] w-full">
        <PayloadImage media={destination.heroImage} sizeName="hero" fill priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-6xl px-6 pb-10 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
            {destination.region ? `${destination.region} · ` : ''}
            {destination.country}
          </p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">{destination.title}</h1>
          {destination.summary && (
            <p className="mt-3 max-w-2xl text-lg text-white/90">{destination.summary}</p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {destination.description && (
          <section className="cms-prose max-w-3xl">
            <RichText data={destination.description} />
          </section>
        )}

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">
            Trips in {destination.title} ({trips.length})
          </h2>
          {trips.length === 0 ? (
            <p className="mt-6 text-gray-500">
              No published trips in this region yet — check back soon.
            </p>
          ) : (
            <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
