import type { Departure, Media, Trip } from '@/payload-types'

import { getServerSideURL } from '@/lib/utils/getURL'

const abs = (path: string): string => `${getServerSideURL()}${path}`

const imageURL = (m: Media | null | number | string | undefined): string | undefined =>
  m && typeof m === 'object' && 'url' in m && m.url
    ? m.url.startsWith('http')
      ? m.url
      : abs(m.url)
    : undefined

/**
 * `TouristTrip` is the correct schema.org type for a packaged journey.
 *
 * The `offers` array is what produces price-enriched search results — and it
 * is also the part that gets sites in trouble. Only departures that are
 * genuinely bookable are emitted: advertising an `InStock` offer for a date
 * you cannot sell can get rich results suppressed, and in some jurisdictions
 * is an advertising violation (pitfall 4). Availability comes from live
 * departure rows, never from hand-typed copy.
 */
export const tripJsonLd = (trip: Trip, departures: Departure[]) => {
  const bookable = departures.filter((d) => d.status !== 'sold-out' && d.status !== 'cancelled')

  return {
    '@context': 'https://schema.org',
    '@id': abs(`/trips/${trip.slug}#trip`),
    '@type': 'TouristTrip',
    description: trip.summary,
    image: [imageURL(trip.cardImage)].filter(Boolean),
    itinerary: {
      '@type': 'ItemList',
      itemListElement: (trip.itinerary ?? []).map((day, index) => ({
        '@type': 'ListItem',
        item: { '@type': 'TouristAttraction', name: day.title },
        position: index + 1,
      })),
      numberOfItems: trip.itinerary?.length ?? 0,
    },
    name: trip.title,
    offers: bookable.slice(0, 20).map((d) => ({
      '@type': 'Offer',
      availability:
        d.status === 'limited'
          ? 'https://schema.org/LimitedAvailability'
          : 'https://schema.org/InStock',
      availabilityStarts: typeof d.startDate === 'string' ? d.startDate : undefined,
      price: d.price ?? trip.basePrice,
      priceCurrency: trip.currency,
      url: abs(`/trips/${trip.slug}?departure=${d.id}`),
      validFrom: new Date().toISOString(),
    })),
    provider: {
      '@type': 'TravelAgency',
      address: { '@type': 'PostalAddress', addressCountry: 'NP', addressLocality: 'Kathmandu' },
      name: 'Hike Globally',
      url: getServerSideURL(),
    },
    touristType: trip.difficulty,
    url: abs(`/trips/${trip.slug}`),
  }
}

export const breadcrumbJsonLd = (crumbs: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem',
    item: abs(c.url),
    name: c.name,
    position: i + 1,
  })),
})

export const faqJsonLd = (items: { answerPlain: string; question: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    acceptedAnswer: { '@type': 'Answer', text: item.answerPlain },
    name: item.question,
  })),
})
