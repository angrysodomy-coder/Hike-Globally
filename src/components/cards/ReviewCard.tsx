import { BadgeCheck, Star } from 'lucide-react'
import React from 'react'

import type { Review } from '@/payload-types'

import { longDate } from '@/components/TripPage/format'

/** Five stars, with the numeric rating exposed to assistive tech. */
const Stars = ({ rating }: { rating: number }) => (
  <p aria-label={`${rating} out of 5`} className="card-review__stars">
    {Array.from({ length: 5 }, (_, i) => (
      <Star aria-hidden="true" key={i} className={i < rating ? 'is-on' : ''} size={14} />
    ))}
  </p>
)

export function ReviewCard({ review }: { review: Review }) {
  const trip = typeof review.trip === 'object' ? review.trip : null

  return (
    <figure className="card-review">
      <Stars rating={review.rating} />
      <blockquote className="card-review__quote">{review.quote}</blockquote>

      <figcaption className="card-review__who">
        <span aria-hidden="true" className="card-review__avatar">
          {review.initials || review.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="card-review__meta">
          <strong>
            {review.name}
            {review.verified ? (
              <BadgeCheck aria-label="Verified traveller" size={14} />
            ) : null}
          </strong>
          <small>
            {review.location}
            {trip ? ` · ${trip.title}` : ''}
            {review.travelledOn ? ` · ${longDate(review.travelledOn)}` : ''}
          </small>
        </span>
      </figcaption>
    </figure>
  )
}
