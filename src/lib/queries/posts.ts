import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import { cache } from 'react'

import type { Where } from 'payload'

import type { Post } from '@/payload-types'

import { getPayloadClient } from '@/lib/payload'

export const getPostBySlug = cache(async (slug: string): Promise<null | Post> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'posts',
    depth: 2,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: { slug: { equals: slug } },
  })

  return result.docs[0] ?? null
})

export const getPosts = async (
  filters: { categories?: (number | string)[]; limit?: number; page?: number } = {},
) => {
  const { categories, limit = 9, page = 1 } = filters

  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()

      const and: Where[] = [{ _status: { equals: 'published' } }]
      if (categories?.length) and.push({ categories: { in: categories } })

      return payload.find({
        collection: 'posts',
        depth: 1,
        limit,
        overrideAccess: false,
        page,
        select: {
          title: true,
          slug: true,
          authors: true,
          categories: true,
          excerpt: true,
          heroImage: true,
          publishedAt: true,
          readingTime: true,
        },
        sort: '-publishedAt',
        where: { and },
      })
    },
    ['posts-index', JSON.stringify(filters)],
    { revalidate: 3600, tags: ['posts'] },
  )()
}

export const getAllPostSlugs = async (): Promise<string[]> => {
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'posts',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: { slug: true },
    where: { _status: { equals: 'published' } },
  })

  return result.docs.map((doc) => doc.slug).filter(Boolean)
}
