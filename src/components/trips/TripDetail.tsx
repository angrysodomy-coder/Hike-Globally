import React from 'react'
import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Destination, Trip } from '@/payload-types'
import { PayloadImage } from '@/components/PayloadImage'
import { formatDateRange, formatPrice, seatsLeft } from '@/lib/formatters'

const departureStatusLabels: Record<string, string> = {
  available: 'Available',
  guaranteed: 'Guaranteed',
  limited: 'Limited',
  soldOut: 'Sold out',
}

const mealLabels: Record<string, string> = {
  breakfast: 'B',
  lunch: 'L',
  dinner: 'D',
}

export const TripDetail: React.FC<{ trip: Trip }> = ({ trip }) => {
  const destination = trip.destination as Destination | number

  return (
    <main id="main-content" className="cms-surface">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[420px] w-full">
        <PayloadImage media={trip.heroImage} sizeName="hero" fill priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-5xl px-6 pb-10 text-white">
          {typeof destination === 'object' && destination !== null && (
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
              {destination.title}, {destination.country}
            </p>
          )}
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">{trip.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/90">{trip.summary}</p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Key facts */}
        <section className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:grid-cols-3 lg:grid-cols-6">
          <Fact label="Duration" value={`${trip.durationDays} days`} />
          <Fact label="Difficulty" value={trip.difficulty} />
          {typeof trip.maxAltitude === 'number' && (
            <Fact label="Max altitude" value={`${trip.maxAltitude.toLocaleString()} m`} />
          )}
          {typeof trip.maxGroupSize === 'number' && (
            <Fact label="Group size" value={`up to ${trip.maxGroupSize}`} />
          )}
          {typeof trip.minAge === 'number' && <Fact label="Min age" value={`${trip.minAge}+`} />}
          <Fact
            label="From"
            value={formatPrice(trip.basePrice, trip.currency)}
            emphasis
          />
        </section>

        {/* Highlights */}
        {trip.highlights && trip.highlights.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">Highlights</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {trip.highlights.map((h) => (
                <li key={h.id} className="flex items-start gap-2 text-gray-700">
                  <span aria-hidden className="mt-1 text-emerald-600">✓</span>
                  {h.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Description */}
        <section className="cms-prose mt-12 max-w-none">
          <RichText data={trip.description} />
        </section>

        {/* Itinerary — day numbers derive from array order */}
        {trip.itinerary && trip.itinerary.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">Itinerary</h2>
            <ol className="mt-6 space-y-6 border-l-2 border-emerald-200 pl-6">
              {trip.itinerary.map((day, i) => (
                <li key={day.id} className="relative">
                  <span className="absolute -left-[33px] flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600" />
                  <h3 className="font-bold text-gray-900">
                    Day {i + 1}: {day.title}
                  </h3>
                  <div className="cms-prose cms-prose--sm mt-2 max-w-none">
                    <RichText data={day.description} />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {day.meals && day.meals.length > 0 && (
                      <span className="mr-4">
                        Meals: {day.meals.map((m) => mealLabels[m] ?? m).join(' / ')}
                      </span>
                    )}
                    {day.accommodation && <span className="mr-4">Stay: {day.accommodation}</span>}
                    {typeof day.altitude === 'number' && (
                      <span className="mr-4">Altitude: {day.altitude.toLocaleString()} m</span>
                    )}
                    {day.walkingHours && <span>Walking: {day.walkingHours}</span>}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Departures */}
        {trip.departures && trip.departures.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">Upcoming departures</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-3 pr-4 font-medium">Dates</th>
                    <th className="py-3 pr-4 font-medium">Price</th>
                    <th className="py-3 pr-4 font-medium">Seats left</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {trip.departures.map((dep) => {
                    const left = seatsLeft(dep.seatsTotal, dep.seatsBooked)
                    const soldOut = dep.status === 'soldOut' || left === 0
                    return (
                      <tr key={dep.id} className="border-b border-gray-100">
                        <td className="py-3 pr-4 font-medium text-gray-900">
                          {formatDateRange(dep.startDate, dep.endDate)}
                        </td>
                        <td className="py-3 pr-4">
                          {formatPrice(dep.price ?? trip.basePrice, trip.currency)}
                        </td>
                        <td className="py-3 pr-4">{left ?? '—'}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={
                              soldOut
                                ? 'rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500'
                                : 'rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700'
                            }
                          >
                            {departureStatusLabels[dep.status ?? 'available']}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {!soldOut && (
                            <Link
                              href={`/contact?trip=${trip.slug}&departure=${dep.startDate}`}
                              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Enquire
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Inclusions / exclusions */}
        {((trip.inclusions?.length ?? 0) > 0 || (trip.exclusions?.length ?? 0) > 0) && (
          <section className="mt-12 grid gap-8 md:grid-cols-2">
            {trip.inclusions && trip.inclusions.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900">What&apos;s included</h2>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {trip.inclusions.map((item) => (
                    <li key={item.id} className="flex items-start gap-2">
                      <span aria-hidden className="text-[var(--color-included)]">✓</span> {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {trip.exclusions && trip.exclusions.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900">Not included</h2>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {trip.exclusions.map((item) => (
                    <li key={item.id} className="flex items-start gap-2">
                      <span aria-hidden className="text-[var(--color-excluded)]">✕</span> {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Gallery */}
        {trip.gallery && trip.gallery.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">Gallery</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
              {trip.gallery.map((item) => (
                <figure key={item.id} className="overflow-hidden rounded-xl">
                  <PayloadImage
                    media={item.image}
                    sizeName="card"
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="h-full w-full object-cover"
                  />
                  {item.caption && (
                    <figcaption className="mt-1 text-xs text-gray-500">{item.caption}</figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* FAQs */}
        {trip.faqs && trip.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">Frequently asked questions</h2>
            <div className="mt-4 divide-y divide-gray-200">
              {trip.faqs.map((faq) => (
                <details key={faq.id} className="group py-4">
                  <summary className="cursor-pointer list-none font-semibold text-gray-900">
                    {faq.question}
                  </summary>
                  <div className="cms-prose cms-prose--sm mt-2 max-w-none">
                    <RichText data={faq.answer} />
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Booking CTA */}
        <section className="mt-16 rounded-2xl bg-emerald-700 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Ready for {trip.title}?</h2>
          <p className="mx-auto mt-2 max-w-xl text-emerald-100">
            Secure your spot from {formatPrice(trip.basePrice, trip.currency)}{' '}
            {trip.priceSuffix ?? 'per person'}. Our team replies within 24 hours.
          </p>
          <Link
            href={`/contact?trip=${trip.slug}`}
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3 font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Book this trip
          </Link>
        </section>
      </div>
    </main>
  )
}

const Fact: React.FC<{ label: string; value: string; emphasis?: boolean }> = ({
  label,
  value,
  emphasis,
}) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
    <dd
      className={
        emphasis ? 'mt-1 font-bold text-emerald-700' : 'mt-1 font-semibold capitalize text-gray-900'
      }
    >
      {value}
    </dd>
  </div>
)
