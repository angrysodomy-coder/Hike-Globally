import Link from 'next/link'
import React from 'react'

import type { Destination, DestinationBentoBlock } from '@/payload-types'

import { CMSImage } from '@/components/CMSImage'
import { getPayloadClient } from '@/lib/payload'

/**
 * Bento grid. `tileSize: 'feature'` spans two columns, so the `sizes`
 * attribute has to differ per tile — a feature tile really is twice as wide
 * and would otherwise load a half-resolution image.
 */
export async function DestinationBentoBlockComponent({
  destinations,
  heading,
  intro,
  source,
}: DestinationBentoBlock) {
  let docs: Destination[] = []

  if (source === 'manual') {
    docs = (destinations ?? []).filter((d): d is Destination => typeof d === 'object')
  } else {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'destinations',
      depth: 1,
      limit: 8,
      overrideAccess: false,
      sort: 'displayOrder',
      where: { _status: { equals: 'published' } },
    })
    docs = result.docs
  }

  if (!docs.length) return null

  return (
    <section className="blk-bento section-pad">
      <div className="shell">
        {heading ? <h2>{heading}</h2> : null}
        {intro ? <p className="blk-intro">{intro}</p> : null}

        <div className="blk-bento__grid">
          {docs.map((dest) => {
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
                    sizes={
                      feature
                        ? '(max-width: 768px) 100vw, 66vw'
                        : '(max-width: 768px) 100vw, 33vw'
                    }
                  />
                </div>
                <div aria-hidden="true" className="blk-bento__scrim" />
                <div className="blk-bento__copy">
                  <p className="blk-bento__kicker">{dest.kicker}</p>
                  <h3>{dest.title}</h3>
                  {feature && dest.summary ? <p>{dest.summary}</p> : null}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
