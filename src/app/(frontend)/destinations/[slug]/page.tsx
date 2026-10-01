import type { Metadata } from 'next'

import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { ArtDirectedImage } from '@/components/CMSImage/ArtDirected'
import { TripCard } from '@/components/cards/TripCard'
import { JsonLd } from '@/components/JsonLd'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { RichText } from '@/components/RichText'
import { titleCase } from '@/components/TripPage/format'
import { getPayloadClient } from '@/lib/payload'
import { getDestinationBySlug } from '@/lib/queries/destinations'
import { breadcrumbJsonLd } from '@/lib/seo/jsonLd'
import { generateMeta } from '@/lib/seo/generateMeta'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const destination = await getDestinationBySlug(slug)

  return generateMeta({ doc: destination, pathname: `/destinations/${slug}` })
}

export default async function DestinationPage({ params }: { params: Params }) {
  const { slug } = await params
  const { isEnabled: draft } = await draftMode()

  const destination = await getDestinationBySlug(slug)
  if (!destination) notFound()

  /**
   * Queried here rather than read from the `trips` join field on the
   * destination: the join returns drafts and has no ordering, while this is
   * access-controlled and sorted with featured trips first.
   */
  const payload = await getPayloadClient()
  const trips = await payload.find({
    collection: 'trips',
    depth: 1,
    limit: 12,
    overrideAccess: false,
    sort: '-featured',
    where: {
      and: [{ destination: { equals: destination.id } }, { _status: { equals: 'published' } }],
    },
  })

  return (
    <main className="dest" id="main-content">
      {draft ? <LivePreviewListener /> : null}

      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Destinations', url: '/destinations' },
          { name: destination.title, url: `/destinations/${destination.slug}` },
        ])}
      />

      <section className="dest__hero">
        <div className="dest__heroMedia">
          <ArtDirectedImage image={destination.heroImage} priority sizes="100vw" />
        </div>
        <div aria-hidden="true" className="dest__heroScrim" />
        <div className="dest__heroInner shell">
          <nav aria-label="Breadcrumb" className="tsp-crumbs">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/destinations">Destinations</Link>
          </nav>
          <p className="eyebrow eyebrow--light">{destination.kicker}</p>
          <h1>{destination.title}</h1>
          <p className="dest__summary">{destination.summary}</p>
        </div>
      </section>

      <div className="shell section-pad">
        {destination.stats?.length ? (
          <dl className="blk-stats__grid">
            {destination.stats.map((stat, i) => (
              <div className="blk-stats__item" key={stat.id ?? i}>
                <dt>
                  <span className="blk-stats__value">{stat.value.toLocaleString('en-GB')}</span>
                  {stat.suffix ? <span className="blk-stats__suffix">{stat.suffix}</span> : null}
                </dt>
                <dd>
                  <span className="blk-stats__label">{stat.label}</span>
                  {stat.note ? <small>{stat.note}</small> : null}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {destination.body ? <RichText className="blk-prose" data={destination.body} /> : null}

        {destination.bestSeasons?.length ? (
          <p className="dest__seasons">
            <strong>Best seasons:</strong>{' '}
            {destination.bestSeasons.map((s) => titleCase(s)).join(', ')}
          </p>
        ) : null}
      </div>

      {trips.docs.length ? (
        <section className="section-pad">
          <div className="shell">
            <h2>Journeys in {destination.title}</h2>
            <div className="blk-tripGrid__grid">
              {trips.docs.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}
