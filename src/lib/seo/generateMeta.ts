import type { Metadata } from 'next'

import type { Destination, Media, Page, Post, Trip } from '@/payload-types'

import { getServerSideURL } from '@/lib/utils/getURL'

type SEOable = {
  excerpt?: null | string
  meta?: {
    description?: null | string
    image?: Media | null | number | string
    title?: null | string
  } | null
  summary?: null | string
  title?: null | string
} & Partial<Destination | Page | Post | Trip>

type ImageRef = Media | null | number | string | undefined

/**
 * Prefer the hard 1200×630 JPEG derivative. Payload generates it as JPEG while
 * every other size is WebP, because a handful of scrapers — including some
 * messaging apps — still refuse to render a WebP OG image.
 */
const ogImageURL = (image: ImageRef): string => {
  const base = getServerSideURL()

  if (image && typeof image === 'object' && 'url' in image) {
    const sized = image.sizes?.og?.url ?? image.url
    if (sized) return sized.startsWith('http') ? sized : `${base}${sized}`
  }

  return `${base}/og-default.jpg`
}

export const generateMeta = ({
  doc,
  pathname,
}: {
  doc: null | SEOable
  pathname: string
}): Metadata => {
  const base = getServerSideURL()

  const title = doc?.meta?.title || (doc?.title ? `${doc.title} | Hike Globally` : 'Hike Globally')
  const description =
    doc?.meta?.description ||
    doc?.summary ||
    doc?.excerpt ||
    'Locally led Himalayan journeys — small groups, two leaders, every permit handled.'
  const image = ogImageURL(doc?.meta?.image)
  const url = `${base}${pathname}`

  return {
    /**
     * `alternates.canonical` is not decoration. /trips carries filter query
     * strings (?difficulty=moderate&season=autumn); without a canonical
     * pointing at the clean URL, Google indexes dozens of near-duplicate
     * permutations and splits the page's authority across all of them. It is
     * the most common SEO failure on trip-listing sites.
     */
    alternates: { canonical: url },
    description,
    metadataBase: new URL(base),
    openGraph: {
      type: 'website',
      description,
      images: [{ url: image, alt: title, height: 630, width: 1200 }],
      locale: 'en_GB',
      siteName: 'Hike Globally',
      title,
      url,
    },
    robots: {
      follow: true,
      googleBot: { follow: true, index: true, 'max-image-preview': 'large' },
      index: true,
    },
    title,
    twitter: { card: 'summary_large_image', description, images: [image], title },
  }
}
