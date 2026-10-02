import React from 'react'
import type { Page, Trip } from '@/payload-types'
import { TripCard } from '@/components/trips/TripCard'

type Props = Extract<Page['layout'][number], { blockType: 'featuredTrips' }>

export const FeaturedTrips: React.FC<Props> = ({ heading, trips }) => {
  // depth: 2 on the page query resolves these to full Trip docs
  const resolved = (trips ?? []).filter(
    (t): t is Trip => typeof t === 'object' && t !== null && t._status === 'published',
  )
  if (resolved.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      {heading && <h2 className="text-3xl font-bold text-gray-900">{heading}</h2>}
      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {resolved.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </section>
  )
}
