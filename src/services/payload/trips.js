import { useEffect, useState, useCallback } from 'react'
import { payloadFetch } from './client'
import { getMediaUrl, getMediaAlt } from './media'
import { trips as fallbackTrips } from '../../data/content'

/**
 * Normalizes a trip document from Payload CMS into the frontend model.
 */
export function normalizeTrip(doc) {
  if (!doc) return null

  const destinationLabel =
    doc.destinationName ||
    (typeof doc.destination === 'object' && doc.destination !== null ? doc.destination.name : doc.destination) ||
    'Everest'

  const resolvedImage = getMediaUrl(doc.featuredImage, 'card', doc.imageUrl || '/images/trip-everest.webp')
  const resolvedAlt = getMediaAlt(doc.featuredImage, doc.alt || doc.title)

  return {
    id: doc.slug || String(doc.id),
    cmsId: doc.id,
    title: doc.title,
    slug: doc.slug,
    location: doc.location || 'Nepal',
    destination: destinationLabel,
    duration: doc.duration || `${doc.durationDays || 10} days`,
    durationDays: doc.durationDays || 10,
    difficulty: doc.difficulty || 'Moderate',
    type: doc.tripType || 'Trek',
    price: Number(doc.price) || 0,
    currency: doc.currency || 'USD',
    seasons: Array.isArray(doc.seasons) ? doc.seasons : ['Spring', 'Autumn'],
    prime: doc.primeSeason || (doc.seasons && doc.seasons[0]) || 'Autumn',
    departures: doc.departures || 'Scheduled departures',
    elevation: doc.elevation || '5,000 m',
    highlight: doc.highlight || doc.shortDescription || doc.title,
    availability: doc.availability || 'Guaranteed departure',
    description: doc.description || doc.shortDescription || '',
    shortDescription: doc.shortDescription || '',
    image: resolvedImage,
    alt: resolvedAlt,
    imagePosition: doc.imagePosition || 'center 45%',
    featured: Boolean(doc.featured),
    itinerary: Array.isArray(doc.itinerary) ? doc.itinerary : [],
    inclusions: Array.isArray(doc.inclusions)
      ? doc.inclusions.map((i) => (typeof i === 'string' ? i : i.item))
      : [],
    exclusions: Array.isArray(doc.exclusions)
      ? doc.exclusions.map((e) => (typeof e === 'string' ? e : e.item))
      : [],
    metaTitle: doc.metaTitle || `${doc.title} — Hike Globally`,
    metaDescription: doc.metaDescription || doc.shortDescription || doc.description,
  }
}

/**
 * Fetch all published trips from Payload CMS.
 */
export async function getTrips({ limit = 100 } = {}) {
  const res = await payloadFetch('/api/trips', {
    params: {
      limit,
      'where[_status][equals]': 'published',
      depth: 1,
    },
  })

  if (res.data && Array.isArray(res.data.docs)) {
    return {
      trips: res.data.docs.map(normalizeTrip),
      total: res.data.totalDocs,
      error: null,
    }
  }

  return {
    trips: fallbackTrips,
    total: fallbackTrips.length,
    error: res.error,
  }
}

/**
 * Fetch a single published trip by its unique slug.
 */
export async function getTripBySlug(slug) {
  if (!slug) return { trip: null, error: new Error('No slug provided') }

  const res = await payloadFetch('/api/trips', {
    params: {
      'where[slug][equals]': slug,
      'where[_status][equals]': 'published',
      depth: 2,
    },
  })

  if (res.data && Array.isArray(res.data.docs) && res.data.docs.length > 0) {
    return {
      trip: normalizeTrip(res.data.docs[0]),
      error: null,
      notFound: false,
    }
  }

  // Check fallback content if CMS is unavailable
  const fallback = fallbackTrips.find((t) => t.id === slug || t.slug === slug)
  if (fallback) {
    return {
      trip: {
        ...fallback,
        slug: fallback.id,
        inclusions: [
          'All domestic flights and permits',
          'Licensed Himalayan trek leader and porters',
          'Teahouse accommodation and mountain meals',
          'Comprehensive medical kit',
        ],
        exclusions: ['International flights', 'Emergency evacuation insurance'],
        itinerary: [
          { day: 1, title: 'Trailhead Departure', description: 'Journey into the high valley.', altitude: '2,600 m' },
          { day: 2, title: 'Mountain Ascent', description: 'Acclimatisation hike through pine forests.', altitude: '3,440 m' },
          { day: 3, title: 'High Sanctuary', description: 'Spectacular panoramas of snow-capped peaks.', altitude: '4,130 m' },
        ],
      },
      error: res.error,
      notFound: false,
    }
  }

  return {
    trip: null,
    error: res.error,
    notFound: true,
  }
}

/**
 * React hook to retrieve trips with loading, error, and cached states.
 */
export function useTrips() {
  const [trips, setTrips] = useState(fallbackTrips)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getTrips()
    if (result.trips && result.trips.length > 0) {
      setTrips(result.trips)
    }
    setError(result.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { trips, loading, error, refetch: load }
}

/**
 * React hook to retrieve a single trip by slug.
 */
export function useTrip(slug) {
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    const result = await getTripBySlug(slug)
    setTrip(result.trip)
    setError(result.error)
    setNotFound(result.notFound)
    setLoading(false)
  }, [slug])

  useEffect(() => {
    load()
  }, [load])

  return { trip, loading, error, notFound, refetch: load }
}
