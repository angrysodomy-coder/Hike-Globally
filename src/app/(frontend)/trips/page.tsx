import type { Metadata } from 'next'

import Link from 'next/link'
import React from 'react'

import { TripCard } from '@/components/cards/TripCard'
import { JsonLd } from '@/components/JsonLd'
import { getTrips } from '@/lib/queries/trips'
import { breadcrumbJsonLd } from '@/lib/seo/jsonLd'
import { generateMeta } from '@/lib/seo/generateMeta'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    doc: {
      meta: {
        description:
          'Every Hike Globally journey — Himalayan treks, tours, expeditions and peak climbs, led by local guides.',
        title: 'All journeys | Hike Globally',
      },
      title: 'All journeys',
    },
    pathname: '/trips',
  })
}

const DIFFICULTIES = ['easy', 'moderate', 'challenging', 'strenuous'] as const
const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const

type Search = Promise<{ difficulty?: string; page?: string; season?: string }>

/**
 * Filters are read from the query string and applied server-side.
 *
 * Note that `generateMeta` sets `alternates.canonical` to the clean `/trips`
 * for every permutation. Without that, Google indexes a dozen near-identical
 * filtered URLs and splits the page's authority between them — the single
 * most common SEO failure on a trip-listing site.
 */
export default async function TripsIndexPage({ searchParams }: { searchParams: Search }) {
  const { difficulty, page, season } = await searchParams

  const result = await getTrips({
    difficulty: difficulty ? [difficulty] : undefined,
    limit: 12,
    page: Number(page) || 1,
    seasons: season ? [season] : undefined,
  })

  const qs = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams()
    const merged = { difficulty, season, ...patch }
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v)
    const s = next.toString()
    return s ? `/trips?${s}` : '/trips'
  }

  return (
    <main className="trips-index" id="main-content">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Journeys', url: '/trips' },
        ])}
      />

      <header className="trips-index__head section-pad">
        <div className="shell">
          <p className="eyebrow">Every journey</p>
          <h1>All journeys</h1>
          <p className="blk-intro">
            {result.totalDocs} {result.totalDocs === 1 ? 'journey' : 'journeys'}, each led by
            guides who live in the range they walk you through.
          </p>

          <div className="trips-index__filters">
            <div className="trips-index__filterGroup">
              <span>Grade</span>
              <Link className={!difficulty ? 'is-on' : ''} href={qs({ difficulty: undefined })}>
                All
              </Link>
              {DIFFICULTIES.map((d) => (
                <Link className={difficulty === d ? 'is-on' : ''} href={qs({ difficulty: d })} key={d}>
                  {d}
                </Link>
              ))}
            </div>

            <div className="trips-index__filterGroup">
              <span>Season</span>
              <Link className={!season ? 'is-on' : ''} href={qs({ season: undefined })}>
                Any
              </Link>
              {SEASONS.map((s) => (
                <Link className={season === s ? 'is-on' : ''} href={qs({ season: s })} key={s}>
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="shell">
        {result.docs.length ? (
          <div className="blk-tripGrid__grid">
            {result.docs.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <p className="blk-intro">No journeys match those filters yet.</p>
        )}

        {result.totalPages > 1 ? (
          <nav aria-label="Pagination" className="trips-index__pages">
            {result.hasPrevPage ? (
              <Link href={qs({ page: String(result.page! - 1) })}>← Previous</Link>
            ) : null}
            <span>
              Page {result.page} of {result.totalPages}
            </span>
            {result.hasNextPage ? (
              <Link href={qs({ page: String(result.page! + 1) })}>Next →</Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </main>
  )
}
