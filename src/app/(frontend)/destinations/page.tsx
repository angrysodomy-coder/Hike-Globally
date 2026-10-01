import type { Metadata } from 'next'

import Link from 'next/link'
import React from 'react'

import { CMSImage } from '@/components/CMSImage'
import { JsonLd } from '@/components/JsonLd'
import { getDestinations } from '@/lib/queries/destinations'
import { breadcrumbJsonLd } from '@/lib/seo/jsonLd'
import { generateMeta } from '@/lib/seo/generateMeta'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    doc: {
      meta: {
        description: 'The ranges and regions Hike Globally walks, and the journeys in each.',
        title: 'Destinations | Hike Globally',
      },
      title: 'Destinations',
    },
    pathname: '/destinations',
  })
}

export default async function DestinationsIndexPage() {
  const result = await getDestinations(24)

  return (
    <main className="dest-index" id="main-content">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Destinations', url: '/destinations' },
        ])}
      />

      <header className="section-pad">
        <div className="shell">
          <p className="eyebrow">Where we walk</p>
          <h1>Destinations</h1>
        </div>
      </header>

      <div className="shell">
        <div className="blk-bento__grid">
          {result.docs.map((dest) => {
            const feature = dest.tileSize === 'feature'

            return (
              <Link
                className={`blk-bento__tile${feature ? ' is-feature' : ''}`}
                href={`/destinations/${dest.slug}`}
                key={dest.id}
              >
                <div className="blk-bento__media">
                  <CMSImage
                    resource={dest.cardImage}
                    sizes={feature ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
                  />
                </div>
                <div aria-hidden="true" className="blk-bento__scrim" />
                <div className="blk-bento__copy">
                  <p className="blk-bento__kicker">{dest.kicker}</p>
                  <h2>{dest.title}</h2>
                  {feature && dest.summary ? <p>{dest.summary}</p> : null}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
