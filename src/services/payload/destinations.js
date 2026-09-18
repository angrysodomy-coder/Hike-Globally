import { useEffect, useState, useCallback } from 'react'
import { payloadFetch } from './client'
import { getMediaUrl, getMediaAlt } from './media'
import { destinations as fallbackDestinations, destinationRegions } from '../../data/content'

/**
 * Normalizes a destination document from Payload CMS into the frontend model.
 */
export function normalizeDestination(doc) {
  if (!doc) return null

  const resolvedImage = getMediaUrl(doc.heroImage, 'card', doc.imageUrl || '/images/region-central.webp')
  const resolvedAlt = getMediaAlt(doc.heroImage, doc.alt || `${doc.name} Nepal`)

  return {
    id: doc.slug || String(doc.id),
    cmsId: doc.id,
    name: doc.name,
    title: doc.name,
    slug: doc.slug,
    number: doc.number || '01',
    tile: doc.tile || 'cent',
    size: doc.size || 'standard',
    kicker: doc.kicker || 'Himalayan Ridge',
    description: doc.description || '',
    bestTimeToVisit: doc.bestTimeToVisit || 'October to May',
    attractions: Array.isArray(doc.attractions) ? doc.attractions : [],
    image: resolvedImage,
    alt: resolvedAlt,
    imagePosition: doc.imagePosition || 'center center',
    relatedTrips: Array.isArray(doc.relatedTrips) ? doc.relatedTrips : [],
    metaTitle: doc.metaTitle || `${doc.name} — Destinations — Hike Globally`,
    metaDescription: doc.metaDescription || doc.description,
  }
}

/**
 * Fetch all published destinations from Payload CMS.
 */
export async function getDestinations() {
  const res = await payloadFetch('/api/destinations', {
    params: {
      limit: 50,
      'where[_status][equals]': 'published',
      depth: 1,
    },
  })

  if (res.data && Array.isArray(res.data.docs) && res.data.docs.length > 0) {
    return {
      destinations: res.data.docs.map(normalizeDestination),
      total: res.data.totalDocs,
      error: null,
    }
  }

  return {
    destinations: fallbackDestinations,
    total: fallbackDestinations.length,
    error: res.error,
  }
}

/**
 * Fetch a single destination by slug.
 */
export async function getDestinationBySlug(slug) {
  if (!slug) return { destination: null, error: new Error('No slug provided') }

  const res = await payloadFetch('/api/destinations', {
    params: {
      'where[slug][equals]': slug,
      'where[_status][equals]': 'published',
      depth: 2,
    },
  })

  if (res.data && Array.isArray(res.data.docs) && res.data.docs.length > 0) {
    return {
      destination: normalizeDestination(res.data.docs[0]),
      error: null,
      notFound: false,
    }
  }

  // Fallback to static data if CMS is unreachable
  const fallback =
    fallbackDestinations.find((d) => d.id === slug || d.slug === slug) ||
    destinationRegions.find((r) => r.id === slug)

  if (fallback) {
    return {
      destination: {
        ...fallback,
        name: fallback.title || fallback.name,
        slug: fallback.id,
      },
      error: res.error,
      notFound: false,
    }
  }

  return {
    destination: null,
    error: res.error,
    notFound: true,
  }
}

/**
 * React hook for destinations listing.
 */
export function useDestinations() {
  const [destinations, setDestinations] = useState(fallbackDestinations)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getDestinations()
    if (result.destinations && result.destinations.length > 0) {
      setDestinations(result.destinations)
    }
    setError(result.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { destinations, loading, error, refetch: load }
}

/**
 * React hook for a single destination.
 */
export function useDestination(slug) {
  const [destination, setDestination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    const result = await getDestinationBySlug(slug)
    setDestination(result.destination)
    setError(result.error)
    setNotFound(result.notFound)
    setLoading(false)
  }, [slug])

  useEffect(() => {
    load()
  }, [load])

  return { destination, loading, error, notFound, refetch: load }
}
