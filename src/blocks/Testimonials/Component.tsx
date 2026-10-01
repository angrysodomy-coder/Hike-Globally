import React from 'react'

import type { Review, TestimonialsBlock } from '@/payload-types'

import { ReviewCard } from '@/components/cards/ReviewCard'
import { JsonLd } from '@/components/JsonLd'
import { getPayloadClient } from '@/lib/payload'
import { getServerSideURL } from '@/lib/utils/getURL'

/**
 * `emitStructuredData` is opt-in per block, and is only honoured when the
 * block is scoped to a single trip.
 *
 * Google requires review markup to be attached to the specific item being
 * reviewed. A wall of mixed testimonials emitting `AggregateRating` against
 * the organisation is "self-serving review" markup, which is explicitly
 * disallowed and risks a manual action — so the schema is only emitted when
 * `trip` is set and the reviews genuinely belong to it.
 */
export async function TestimonialsBlockComponent({
  emitStructuredData,
  heading,
  limit,
  minimumRating,
  reviews,
  source,
  trip,
}: TestimonialsBlock) {
  let docs: Review[] = []

  if (source === 'manual') {
    docs = (reviews ?? []).filter((r): r is Review => typeof r === 'object')
  } else {
    const payload = await getPayloadClient()
    const and: Record<string, unknown>[] = []

    if (trip) and.push({ trip: { equals: typeof trip === 'object' ? trip.id : trip } })
    if (minimumRating) and.push({ rating: { greater_than_equal: minimumRating } })

    const result = await payload.find({
      collection: 'reviews',
      depth: 1,
      limit: limit ?? 6,
      overrideAccess: false,
      sort: '-featured',
      ...(and.length ? { where: { and } as never } : {}),
    })
    docs = result.docs
  }

  if (!docs.length) return null

  const tripDoc = typeof trip === 'object' && trip ? trip : null
  const canEmit = Boolean(emitStructuredData && tripDoc && docs.length)

  return (
    <section className="blk-testimonials section-pad">
      {canEmit && tripDoc ? (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Product',
            aggregateRating: {
              '@type': 'AggregateRating',
              bestRating: 5,
              ratingValue: (
                docs.reduce((sum, r) => sum + r.rating, 0) / docs.length
              ).toFixed(1),
              reviewCount: docs.length,
            },
            name: tripDoc.title,
            review: docs.slice(0, 10).map((r) => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: r.name },
              datePublished: r.travelledOn,
              reviewBody: r.quote,
              reviewRating: { '@type': 'Rating', bestRating: 5, ratingValue: r.rating },
            })),
            url: `${getServerSideURL()}/trips/${tripDoc.slug}`,
          }}
        />
      ) : null}

      <div className="shell">
        {heading ? <h2>{heading}</h2> : null}
        <div className="blk-testimonials__grid">
          {docs.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  )
}
