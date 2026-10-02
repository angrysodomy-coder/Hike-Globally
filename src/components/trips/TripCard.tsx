import Link from 'next/link'
import React from 'react'
import type { Destination, Trip } from '@/payload-types'
import { PayloadImage } from '@/components/PayloadImage'
import { formatPrice } from '@/lib/formatters'

const difficultyLabels: Record<NonNullable<Trip['difficulty']>, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  challenging: 'Challenging',
  strenuous: 'Strenuous',
}

export const TripCard: React.FC<{ trip: Trip }> = ({ trip }) => {
  const destination = trip.destination as Destination | number

  return (
    <Link
      href={`/trips/${trip.slug}`}
      className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <PayloadImage
          media={trip.heroImage}
          sizeName="card"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800">
          {difficultyLabels[trip.difficulty]}
        </span>
      </div>
      <div className="p-5">
        {typeof destination === 'object' && destination !== null && (
          <p className="text-sm font-medium text-emerald-700">{destination.title}</p>
        )}
        <h3 className="mt-1 text-lg font-bold text-gray-900">{trip.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{trip.summary}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {trip.durationDays} days
            {typeof trip.durationNights === 'number' ? ` / ${trip.durationNights} nights` : ''}
          </span>
          <span className="text-base font-bold text-gray-900">
            {formatPrice(trip.basePrice, trip.currency)}
            <span className="ml-1 text-xs font-normal text-gray-500">
              {trip.priceSuffix ?? 'per person'}
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}
