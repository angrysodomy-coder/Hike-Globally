import type { Destination, Media, Post, Trip } from '@/payload-types'

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL ?? ''

const mediaURL = (m?: Media | number | null): string | undefined =>
  m && typeof m === 'object' ? (m.url ?? undefined) : undefined

/** schema.org TouristTrip + Offer — rich-result-friendly markup for trip pages. */
export const tripJsonLd = (trip: Trip): Record<string, unknown> => {
  const destination = trip.destination as Destination | number

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: trip.title,
    description: trip.summary,
    url: `${serverURL}/trips/${trip.slug}`,
    image: mediaURL(trip.heroImage as Media | number),
    touristType: trip.difficulty,
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: trip.itinerary?.length ?? 0,
      itemListElement: (trip.itinerary ?? []).map((day, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `Day ${i + 1}: ${day.title}`,
      })),
    },
    ...(typeof destination === 'object' && destination !== null
      ? {
          touristDestination: {
            '@type': 'TouristDestination',
            name: destination.title,
            address: { '@type': 'PostalAddress', addressCountry: destination.country },
          },
        }
      : {}),
    offers: {
      '@type': 'Offer',
      price: trip.basePrice,
      priceCurrency: trip.currency,
      availability: 'https://schema.org/InStock',
      url: `${serverURL}/trips/${trip.slug}`,
    },
  }
}

/** schema.org BlogPosting for article pages. */
export const postJsonLd = (post: Post): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.excerpt ?? undefined,
  image: mediaURL(post.heroImage as Media | number),
  datePublished: post.publishedAt ?? post.createdAt,
  dateModified: post.updatedAt,
  url: `${serverURL}/blog/${post.slug}`,
  ...(post.authorName ? { author: { '@type': 'Person', name: post.authorName } } : {}),
})
