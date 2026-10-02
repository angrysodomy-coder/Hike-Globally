import type { Metadata } from 'next'
import type { Media, Page, Post, Trip } from '@/payload-types'

type SeoDoc = Page | Post | Trip

const getImageURL = (image?: Media | number | null): string | undefined => {
  if (image && typeof image === 'object') {
    return image.sizes?.og?.url ?? image.url ?? undefined
  }
  return undefined
}

export const generateMeta = ({
  doc,
  pathPrefix,
}: {
  doc: SeoDoc | null
  pathPrefix: string
}): Metadata => {
  if (!doc) return {}

  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const url =
    pathPrefix === '' && doc.slug === 'home'
      ? serverURL
      : `${serverURL}${pathPrefix}/${doc.slug}`

  const title = doc.meta?.title || doc.title
  const description =
    doc.meta?.description ||
    ('excerpt' in doc && doc.excerpt) ||
    ('summary' in doc && doc.summary) ||
    undefined
  const ogImage =
    getImageURL(doc.meta?.image as Media | null) ??
    getImageURL(('heroImage' in doc ? doc.heroImage : undefined) as Media | null)

  return {
    title,
    description: description || undefined,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: description || undefined,
      url,
      siteName: 'Hike Globally',
      type: 'website',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description: description || undefined },
  }
}

export const generateTripMeta = (trip: Trip | null): Metadata =>
  generateMeta({ doc: trip, pathPrefix: '/trips' })

export const generatePostMeta = (post: Post | null): Metadata =>
  generateMeta({ doc: post, pathPrefix: '/blog' })

export const generatePageMeta = (page: Page | null): Metadata =>
  generateMeta({ doc: page, pathPrefix: '' })
