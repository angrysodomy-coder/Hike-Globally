import type { Metadata } from 'next'
import React from 'react'
import TripsRoute from '@/views/routes/TripsRoute'
import { getPublishedTrips } from '@/lib/queries'
import { TripCard } from '@/components/trips/TripCard'

export const metadata: Metadata = {
  title: 'Trips',
  description:
    'Eight hand-built Himalayan journeys: Everest Base Camp, Annapurna Sanctuary, Manaslu Circuit, Upper Mustang, Langtang, Kathmandu, Gokyo and Mardi Himal. Small groups, local leaders, every departure handled end to end.',
}

// Safety-net ISR; the 'trips' cache tag is purged on publish for instant updates.
export const revalidate = 86400

export default async function TripsPageRoute() {
  const trips = await getPublishedTrips()

  return (
    <>
      <TripsRoute />

      {/* Itineraries managed in Payload. Publish a trip in /admin and it lands
          here within a second — the 'trips' tag is purged by the afterChange
          hook. Nothing renders until the first trip is published. */}
      {trips.length > 0 && (
        <section className="cms-surface" aria-labelledby="cms-trips-heading">
          <div className="mx-auto w-[min(1440px,calc(100vw-96px))] py-20">
            <p className="cms-eyebrow">Newly published</p>
            <h2
              id="cms-trips-heading"
              className="mt-4 max-w-3xl text-[clamp(1.9rem,1.4rem+1.8vw,3rem)] leading-[1.08] text-gray-900"
            >
              Departures our team is opening right now
            </h2>
            <p className="mt-4 max-w-xl text-gray-600">
              Every itinerary below is managed in the CMS — pricing, departures and day-by-day
              plans update the moment they are published.
            </p>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
