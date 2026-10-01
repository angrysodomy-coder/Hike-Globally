import { draftMode } from 'next/headers'
import { cache } from 'react'

import type { Page } from '@/payload-types'

import { getPayloadClient } from '@/lib/payload'

/**
 * `depth: 3` is higher than the trip page needs, and deliberately so. A page's
 * layout blocks hold relationships (tripGrid → trips → cardImage), so the
 * upload inside a related document sits three hops from the page itself.
 * At depth 2 the images come back as bare IDs and every card renders blank.
 */
export const getPageBySlug = cache(async (slug: string): Promise<null | Page> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'pages',
    depth: 3,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: { slug: { equals: slug } },
  })

  return result.docs[0] ?? null
})

export const getAllPageSlugs = async (): Promise<string[]> => {
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: { slug: true },
    where: { _status: { equals: 'published' } },
  })

  return result.docs.map((doc) => doc.slug).filter(Boolean)
}
