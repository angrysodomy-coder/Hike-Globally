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
  try {
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
  } catch (error) {
    console.warn(`[getTripBySlug] Error fetching trip "${slug}":`, error)
    return null
  }
})

export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  try {
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
  } catch (error) {
    console.warn(`[getPostBySlug] Error fetching post "${slug}":`, error)
    return null
  }
})

export const getPageBySlug = cache(async (slug: string): Promise<Page | null> => {
  try {
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
  } catch (error) {
    console.warn(`[getPageBySlug] Error fetching page "${slug}":`, error)
    return null
  }
})

// ---------------------------------------------------------------------------
// Lists — cached across requests, purged instantly by afterChange hook tags
// ---------------------------------------------------------------------------

export const getPublishedTrips = unstable_cache(
  async (): Promise<Trip[]> => {
    try {
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
    } catch (error) {
      console.warn('[getPublishedTrips] Error fetching trips:', error)
      return []
    }
  },
  ['trips-list'],
  { tags: ['trips'] },
)

export const getFeaturedTrips = unstable_cache(
  async (): Promise<Trip[]> => {
    try {
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
    } catch (error) {
      console.warn('[getFeaturedTrips] Error fetching featured trips:', error)
      return []
    }
  },
  ['trips-featured'],
  { tags: ['trips'] },
)

export const getPublishedPosts = unstable_cache(
  async (): Promise<Post[]> => {
    try {
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
    } catch (error) {
      console.warn('[getPublishedPosts] Error fetching posts:', error)
      return []
    }
  },
  ['posts-list'],
  { tags: ['posts'] },
)

// ---------------------------------------------------------------------------
// Destinations (no drafts — read access is public, so no draft handling needed)
// ---------------------------------------------------------------------------

export const getDestinations = unstable_cache(
  async (): Promise<Destination[]> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'destinations',
        sort: 'title',
        depth: 1,
        limit: 100,
        pagination: false,
      })
      return result.docs
    } catch (error) {
      console.warn('[getDestinations] Error fetching destinations:', error)
      return []
    }
  },
  ['destinations-list'],
  { tags: ['destinations'] },
)

export const getDestinationBySlug = cache(async (slug: string): Promise<Destination | null> => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'destinations',
      limit: 1,
      pagination: false,
      depth: 1,
      where: { slug: { equals: slug } },
    })
    return result.docs[0] ?? null
  } catch (error) {
    console.warn(`[getDestinationBySlug] Error fetching destination "${slug}":`, error)
    return null
  }
})

/** Trips in a region — tagged 'trips' so publishing a trip refreshes destination pages too. */
export const getTripsForDestination = unstable_cache(
  async (destinationId: number): Promise<Trip[]> => {
    try {
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
    } catch (error) {
      console.warn(`[getTripsForDestination] Error fetching trips for destination ${destinationId}:`, error)
      return []
    }
  },
  ['trips-by-destination'],
  { tags: ['trips'] },
)

// ---------------------------------------------------------------------------
// Globals — tags match the revalidateGlobal hooks on Header/Footer
// ---------------------------------------------------------------------------

export const getHeader = unstable_cache(
  async (): Promise<Header> => {
    try {
      const payload = await getPayloadClient()
      return await payload.findGlobal({ slug: 'header' })
    } catch (error) {
      console.warn('[getHeader] Error fetching header global:', error)
      return { id: 0, navItems: [] } as unknown as Header
    }
  },
  ['global-header'],
  { tags: ['global-header'] },
)

export const getFooter = unstable_cache(
  async (): Promise<Footer> => {
    try {
      const payload = await getPayloadClient()
      return await payload.findGlobal({ slug: 'footer' })
    } catch (error) {
      console.warn('[getFooter] Error fetching footer global:', error)
      return {
        id: 0,
        aboutText: null,
        columns: [],
        social: {},
        contact: {},
      } as unknown as Footer
    }
  },
  ['global-footer'],
  { tags: ['global-footer'] },
)
