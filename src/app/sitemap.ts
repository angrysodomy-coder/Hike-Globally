import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL ?? ''

  // Build-time (or a transiently unreachable) Postgres connection must never
  // fail the whole `next build` over a sitemap. This route is revalidated
  // hourly, so a sparse sitemap now just gets filled in on the next request.
  let pages: { docs: { slug: string; updatedAt: string }[] } = { docs: [] }
  let posts: { docs: { slug: string; updatedAt: string }[] } = { docs: [] }
  let trips: { docs: { slug: string; updatedAt: string }[] } = { docs: [] }
  let destinations: { docs: { slug: string; updatedAt: string }[] } = { docs: [] }

  try {
    const payload = await getPayload({ config })
    ;[pages, posts, trips, destinations] = await Promise.all([
      payload.find({
        collection: 'pages',
        where: { _status: { equals: 'published' } },
        select: { slug: true, updatedAt: true },
        limit: 1000,
        pagination: false,
      }),
      payload.find({
        collection: 'posts',
        where: { _status: { equals: 'published' } },
        select: { slug: true, updatedAt: true },
        limit: 1000,
        pagination: false,
      }),
      payload.find({
        collection: 'trips',
        where: { _status: { equals: 'published' } },
        select: { slug: true, updatedAt: true },
        limit: 1000,
        pagination: false,
      }),
      payload.find({
        collection: 'destinations',
        select: { slug: true, updatedAt: true },
        limit: 1000,
        pagination: false,
      }),
    ])
  } catch (error) {
    console.warn(
      '[sitemap] Could not reach Payload/Postgres at build time — shipping ' +
        'a minimal sitemap. Check PAYLOAD_SECRET and POSTGRES_URL.\n',
      error,
    )
  }

  return [
    { url: `${serverURL}/trips`, lastModified: new Date() },
    { url: `${serverURL}/blog`, lastModified: new Date() },
    { url: `${serverURL}/destinations`, lastModified: new Date() },
    ...pages.docs.map((d) => ({
      url: `${serverURL}/${d.slug === 'home' ? '' : d.slug}`,
      lastModified: new Date(d.updatedAt),
    })),
    ...posts.docs.map((d) => ({
      url: `${serverURL}/blog/${d.slug}`,
      lastModified: new Date(d.updatedAt),
    })),
    ...trips.docs.map((d) => ({
      url: `${serverURL}/trips/${d.slug}`,
      lastModified: new Date(d.updatedAt),
    })),
    ...destinations.docs.map((d) => ({
      url: `${serverURL}/destinations/${d.slug}`,
      lastModified: new Date(d.updatedAt),
    })),
  ]
}
