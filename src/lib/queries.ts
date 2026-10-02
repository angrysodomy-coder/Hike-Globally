import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import type { Destination, Footer, Header, Page, Post, Trip } from '@/payload-types'

/** getPayload memoizes internally — one Payload instance per server process. */
export const getPayloadClient = () => getPayload({ config })

// ---------------------------------------------------------------------------
// Single docs by slug — draft-aware (preview mode returns the latest draft),
// deduped per request by React cache() (generateMetadata + page share one call).
// ---------------------------------------------------------------------------

export const getTripBySlug = cache(async (slug: string): Promise<Trip | null> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'trips',
    draft,
    overrideAccess: draft,
    limit: 1,
    pagination: false,
    depth: 2,
    where: { slug: { equals: slug } },
  })
  return result.docs[0] ?? null
})

export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'posts',
    draft,
    overrideAccess: draft,
    limit: 1,
    pagination: false,
    depth: 2, // resolves heroImage, categories, relatedTrips → their heroImages
    where: { slug: { equals: slug } },
  })
  return result.docs[0] ?? null
})

export const getPageBySlug = cache(async (slug: string): Promise<Page | null> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    draft,
    overrideAccess: draft,
    limit: 1,
    pagination: false,
    depth: 2, // resolves block media + featured trips (and their hero images)
    where: { slug: { equals: slug } },
  })
  return result.docs[0] ?? null
})

// ---------------------------------------------------------------------------
// Lists — cached across requests, purged instantly by afterChange hook tags
// ---------------------------------------------------------------------------

export const getPublishedTrips = unstable_cache(
  async (): Promise<Trip[]> => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'trips',
      where: { _status: { equals: 'published' } },
      sort: '-createdAt',
      depth: 1,
      limit: 100,
      pagination: false,
    })
    return result.docs
  },
  ['trips-list'],
  { tags: ['trips'] },
)

export const getFeaturedTrips = unstable_cache(
  async (): Promise<Trip[]> => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'trips',
      where: {
        and: [{ _status: { equals: 'published' } }, { featured: { equals: true } }],
      },
      sort: '-createdAt',
      depth: 1,
      limit: 6,
      pagination: false,
    })
    return result.docs
  },
  ['trips-featured'],
  { tags: ['trips'] },
)

export const getPublishedPosts = unstable_cache(
  async (): Promise<Post[]> => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 1,
      limit: 100,
      pagination: false,
    })
    return result.docs
  },
  ['posts-list'],
  { tags: ['posts'] },
)

// ---------------------------------------------------------------------------
// Destinations (no drafts — read access is public, so no draft handling needed)
// ---------------------------------------------------------------------------

export const getDestinations = unstable_cache(
  async (): Promise<Destination[]> => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'destinations',
      sort: 'title',
      depth: 1,
      limit: 100,
      pagination: false,
    })
    return result.docs
  },
  ['destinations-list'],
  { tags: ['destinations'] },
)

export const getDestinationBySlug = cache(async (slug: string): Promise<Destination | null> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'destinations',
    limit: 1,
    pagination: false,
    depth: 1,
    where: { slug: { equals: slug } },
  })
  return result.docs[0] ?? null
})

/** Trips in a region — tagged 'trips' so publishing a trip refreshes destination pages too. */
export const getTripsForDestination = unstable_cache(
  async (destinationId: number): Promise<Trip[]> => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'trips',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { destination: { equals: destinationId } },
        ],
      },
      sort: '-createdAt',
      depth: 1,
      limit: 100,
      pagination: false,
    })
    return result.docs
  },
  ['trips-by-destination'],
  { tags: ['trips'] },
)

// ---------------------------------------------------------------------------
// Globals — tags match the revalidateGlobal hooks on Header/Footer
// ---------------------------------------------------------------------------

export const getHeader = unstable_cache(
  async (): Promise<Header> => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'header' })
  },
  ['global-header'],
  { tags: ['global-header'] },
)

export const getFooter = unstable_cache(
  async (): Promise<Footer> => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'footer' })
  },
  ['global-footer'],
  { tags: ['global-footer'] },
)
