import React from 'react'

import type { TripCardBlock } from '@/payload-types'

import { TripCard } from '@/components/cards/TripCard'

/**
 * Inline trip card, dropped into article body copy from Lexical.
 *
 * Renders nothing when the relationship came back as a bare ID — that means
 * the field was queried at too shallow a depth, and a half-rendered card with
 * no title or price is worse than no card.
 */
export function TripCardBlockComponent({ layout, note, trip }: TripCardBlock) {
  if (typeof trip !== 'object' || !trip) return null

  return (
    <div className={`blk-tripCardBlock blk-tripCardBlock--${layout}`}>
      <TripCard
        sizes={layout === 'full' ? '(max-width: 768px) 100vw, 720px' : '(max-width: 768px) 100vw, 300px'}
        trip={trip}
        variant={layout}
      />
      {note ? <p className="blk-tripCardBlock__note">{note}</p> : null}
    </div>
  )
}
