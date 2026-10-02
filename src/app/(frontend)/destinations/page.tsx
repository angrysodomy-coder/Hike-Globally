import type { Metadata } from 'next'
import React from 'react'
import DestinationsRoute from '@/views/routes/DestinationsRoute'
import { getDestinations } from '@/lib/queries'
import { DestinationCard } from '@/components/destinations/DestinationCard'

export const metadata: Metadata = {
  title: 'Destinations',
  description:
    'Explore Nepal by region: the Khumbu, Annapurna, Manaslu, Mustang, Langtang and the untrampled west. Small-group, locally led Himalayan journeys.',
}

// Safety-net ISR; the 'destinations' cache tag is purged the moment an editor saves.
export const revalidate = 86400

export default async function DestinationsPageRoute() {
  const destinations = await getDestinations()

  return (
    <>
      <DestinationsRoute />

      {/* Region landing pages managed in Payload. Hidden entirely until an
          editor publishes the first destination, so the hand-built page above
          is never left with an empty shelf under it. */}
      {destinations.length > 0 && (
        <section className="cms-surface" aria-labelledby="cms-regions-heading">
          <div className="mx-auto w-[min(1440px,calc(100vw-96px))] max-w-none py-20">
            <p className="cms-eyebrow">From the journey desk</p>
            <h2
              id="cms-regions-heading"
              className="mt-4 max-w-3xl text-[clamp(1.9rem,1.4rem+1.8vw,3rem)] leading-[1.08] text-gray-900"
            >
              Region guides, kept current by our Kathmandu team
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((destination) => (
                <DestinationCard key={destination.id} destination={destination} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
