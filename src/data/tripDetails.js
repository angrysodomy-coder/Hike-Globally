import { trips } from './content'

/* ------------------------------------------------------------------
   Trip detail pages (`/trips/<slug>`)

   Every bookable package on the site — the eight curated journeys plus
   the Annapurna Circuit from the "Trails worth taking" rail — resolves
   to its own standalone page. Slugs are the stable record ids, so
   `/trips/annapurna-sanctuary` is the Annapurna Sanctuary (Base Camp)
   journey, `/trips/everest-base-camp` is Everest Base Camp, and so on.
   ------------------------------------------------------------------ */

/* The Annapurna Circuit exists only as a trek-rail story in content.js;
   promote it to a full record so it gets a detail page like the rest. */
const annapurnaCircuit = {
  id: 'annapurna-circuit',
  title: 'Annapurna Circuit',
  location: 'Annapurna, Nepal',
  destination: 'Annapurna',
  duration: '16 days',
  durationDays: 16,
  difficulty: 'Challenging',
  type: 'Trek',
  price: 1690,
  seasons: ['Spring', 'Autumn'],
  prime: 'Autumn',
  departures: 'Mar · Apr · Oct · Nov',
  elevation: '5,416 m',
  highlight: 'Thorong La at first light, the whole crossing laid out below',
  availability: 'Autumn places open',
  description:
    'A complete Himalayan crossing—from warm river valleys to the wind-polished heights of Thorong La.',
  image: '/images/trek-annapurna.webp',
  alt: 'A stone shrine and prayer flags beneath snow-covered Annapurna peaks',
  imagePosition: 'center 44%',
}

export const tripDetails = [...trips, annapurnaCircuit]

/* The five trek-rail stories map onto the detail pages above. */
const trekSlugById = {
  'trek-everest': 'everest-base-camp',
  'trek-annapurna': 'annapurna-circuit',
  'trek-manaslu': 'manaslu-circuit',
  'trek-langtang': 'langtang-valley',
  'trek-upper-mustang': 'upper-mustang-passage',
}

export function getTripBySlug(slug) {
  return tripDetails.find((trip) => trip.id === slug) || null
}

export function tripPath(trip) {
  return `/trips/${trip?.slug || trip?.id || ''}`
}

export function trekPath(trek) {
  if (trek.slug) return `/trips/${trek.slug}`
  const slug = trekSlugById[trek.id]
  return slug ? `/trips/${slug}` : `/trips/${trek.id || ''}`
}

export function articlePath(article) {
  return `/blog/${article?.slug || article?.id || ''}`
}

export function getArticleSlug(path) {
  return path.startsWith('/blog/') ? path.slice('/blog/'.length) : null
}

export function getTripSlug(path) {
  return /^\/trips\/.+/.test(path) ? path.slice('/trips/'.length) : null
}
