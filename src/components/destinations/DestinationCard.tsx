import Link from 'next/link'
import React from 'react'
import type { Destination } from '@/payload-types'
import { PayloadImage } from '@/components/PayloadImage'

export const DestinationCard: React.FC<{ destination: Destination; tripCount?: number }> = ({
  destination,
  tripCount,
}) => (
  <Link
    href={`/destinations/${destination.slug}`}
    className="group relative block aspect-[4/3] overflow-hidden rounded-2xl"
  >
    <PayloadImage
      media={destination.heroImage}
      sizeName="card"
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="transition-transform duration-300 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
      <h3 className="text-xl font-bold">{destination.title}</h3>
      <p className="mt-1 text-sm text-white/80">
        {destination.region ? `${destination.region}, ` : ''}
        {destination.country}
        {typeof tripCount === 'number' && ` · ${tripCount} trip${tripCount === 1 ? '' : 's'}`}
      </p>
    </div>
  </Link>
)
