import type { Metadata } from 'next'
import React from 'react'
import { getFooter, getPublishedTrips } from '@/lib/queries'
import { InquiryForm, type TripOption } from '@/components/forms/InquiryForm'
import { formatDate } from '@/lib/formatters'

export const metadata: Metadata = {
  title: 'Contact & Booking Inquiries | Hike Globally',
  description:
    'Tell us your dates and wishlist — our local team replies to every inquiry within 24 hours.',
}

type Args = {
  // Deep links from TripDetail: /contact?trip=<slug>&departure=<ISO date>
  searchParams: Promise<{ trip?: string; departure?: string }>
}

export default async function ContactPage({ searchParams }: Args) {
  const { trip: tripSlug, departure } = await searchParams
  const [trips, footer] = await Promise.all([getPublishedTrips(), getFooter()])

  const tripOptions: TripOption[] = trips.map((t) => ({ id: t.id, title: t.title }))
  const preselected = tripSlug ? trips.find((t) => t.slug === tripSlug) : undefined
  // <input type="date"> needs YYYY-MM-DD
  const defaultDate = departure ? departure.slice(0, 10) : undefined

  return (
    <main id="main-content" className="cms-surface cms-page mx-auto max-w-6xl px-6">
      <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Plan your trip</h1>
          <p className="mt-2 max-w-xl text-gray-600">
            Tell us your dates, group and wishlist — a guide (not a call centre) replies within 24
            hours.
          </p>

          {preselected && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              You&apos;re inquiring about <strong>{preselected.title}</strong>
              {defaultDate && (
                <>
                  {' '}
                  — departure <strong>{formatDate(defaultDate)}</strong>
                </>
              )}
              . We&apos;ve pre-filled the form below.
            </div>
          )}

          <div className="mt-8">
            <InquiryForm
              trips={tripOptions}
              defaultTripId={preselected?.id}
              defaultDate={defaultDate}
            />
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="font-bold text-gray-900">Prefer to talk?</h2>
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            {footer?.contact?.phone && (
              <li>
                <span className="font-medium">Phone:</span> {footer.contact.phone}
              </li>
            )}
            {footer?.contact?.whatsapp && (
              <li>
                <span className="font-medium">WhatsApp:</span> {footer.contact.whatsapp}
              </li>
            )}
            {footer?.contact?.email && (
              <li>
                <span className="font-medium">Email:</span>{' '}
                <a href={`mailto:${footer.contact.email}`} className="text-emerald-700 underline">
                  {footer.contact.email}
                </a>
              </li>
            )}
            {footer?.contact?.address && (
              <li className="whitespace-pre-line">
                <span className="font-medium">Office:</span> {footer.contact.address}
              </li>
            )}
          </ul>
          <p className="mt-6 text-xs text-gray-500">
            Office hours: Sun–Fri, 9:00–18:00 Nepal time (UTC+5:45).
          </p>
        </aside>
      </div>
    </main>
  )
}
