import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL ?? ''

  const [pages, posts, trips, destinations] = await Promise.all([
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
