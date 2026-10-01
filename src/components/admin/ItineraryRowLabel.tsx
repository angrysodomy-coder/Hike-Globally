'use client'

import { createRowLabel, pad } from './createRowLabel'

type ItineraryDay = {
  altitudeMetres?: number | null
  isAcclimatisationDay?: boolean | null
  title?: string | null
}

/**
 * "Day 04 · Namche Bazaar — acclimatisation · 3,440 m"
 *
 * Day numbers are DERIVED from row order, never stored (see §8.5). That is
 * what makes inserting an extra acclimatisation day at position four a drag
 * rather than a renumbering of twelve rows — and it is why this label reads
 * the index from `useRowLabel()` instead of a field.
 */
export const ItineraryRowLabel = createRowLabel<ItineraryDay>('Day', (data, rowNumber) => {
  const parts = [`Day ${pad(rowNumber)}`]

  const title = data?.title?.trim()
  if (title) parts.push(title)

  if (data?.isAcclimatisationDay) parts.push('acclimatisation')

  // en-GB so the thousands separator is a comma and matches the frontend's
  // "3,440 m" formatting rather than the admin's locale.
  if (typeof data?.altitudeMetres === 'number') {
    parts.push(`${data.altitudeMetres.toLocaleString('en-GB')} m`)
  }

  return parts.join(' · ')
})
