import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import { cache } from 'react'

import type { Destination } from '@/payload-types'

import { getPayloadClient } from '@/lib/payload'

export const getDestinationBySlug = cache(async (slug: string): Promise<null | Destination> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'destinations',
    depth: 2,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: { slug: { equals: slug } },
  })

  return result.docs[0] ?? null
})

export const getDestinations = async (limit = 12) =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient()

      return payload.find({
        collection: 'destinations',
        depth: 1,
        limit,
        overrideAccess: false,
        select: {
          title: true,
          slug: true,
          bestSeasons: true,
          cardImage: true,
          displayOrder: true,
          kicker: true,
          summary: true,
          tileSize: true,
        },
        sort: 'displayOrder',
        where: { _status: { equals: 'published' } },
      })
    },
    ['destinations-index', String(limit)],
    { revalidate: 3600, tags: ['destinations'] },
  )()

export const getAllDestinationSlugs = async (): Promise<string[]> => {
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'destinations',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: { slug: true },
    where: { _status: { equals: 'published' } },
  })

  return result.docs.map((doc) => doc.slug).filter(Boolean)
}
