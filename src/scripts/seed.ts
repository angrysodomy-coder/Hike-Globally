/**
 * Seed script — run with: pnpm seed  (uses `payload run`, which boots config + DB)
 *
 * Demonstrates the exact pattern for migrating YOUR mock data:
 *   1. upload media first (payload.create with filePath)
 *   2. create docs referencing the returned media/destination IDs
 *   3. pass context.disableRevalidate so hooks stay quiet during bulk inserts
 *
 * Replace the `seedTrips` array with an import of your real mock-data module.
 */
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '@payload-config'
import { textToLexical } from '@/lib/lexical'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const seedDir = path.resolve(dirname, '../../public/seed')
const context = { disableRevalidate: true }

type SeedDay = {
  title: string
  description: string
  meals?: ('breakfast' | 'lunch' | 'dinner')[]
  accommodation?: string
  altitude?: number
  walkingHours?: string
}

type SeedTrip = {
  title: string
  slug: string
  summary: string
  description: string
  image: string
  imageAlt: string
  destination: { title: string; slug: string; region: string }
  durationDays: number
  durationNights: number
  difficulty: 'easy' | 'moderate' | 'challenging' | 'strenuous'
  maxAltitude: number
  maxGroupSize: number
  basePrice: number
  featured: boolean
  highlights: string[]
  itinerary: SeedDay[]
  inclusions: string[]
  exclusions: string[]
  departures: { startDate: string; endDate: string; seatsTotal: number; seatsBooked: number }[]
}

const seedTrips: SeedTrip[] = [
  {
    title: 'Everest Base Camp Trek',
    slug: 'everest-base-camp-trek',
    summary:
      'The classic 14-day trek to the foot of the world’s highest mountain, through Sherpa villages, high suspension bridges and the Khumbu’s legendary skyline.',
    description:
      'Few journeys on Earth match the Everest Base Camp trek. From the airstrip at Lukla you climb steadily through pine forest and Sherpa settlements, acclimatising in the mountain town of Namche Bazaar before pushing on past Tengboche Monastery to the glacial moraines beneath Everest itself.\n\nOur itinerary builds in two dedicated acclimatisation days, stays in hand-picked teahouses, and is led by licensed local guides with decades of Khumbu experience.',
    image: 'everest-base-camp.jpg',
    imageAlt: 'Trekkers approaching Everest Base Camp with Khumbu Icefall in the background',
    destination: { title: 'Everest Region', slug: 'everest-region', region: 'Khumbu' },
    durationDays: 14,
    durationNights: 13,
    difficulty: 'challenging',
    maxAltitude: 5545,
    maxGroupSize: 12,
    basePrice: 1590,
    featured: true,
    highlights: [
      'Stand at Everest Base Camp (5,364 m)',
      'Sunrise over Everest from Kala Patthar',
      'Acclimatisation days in Namche Bazaar and Dingboche',
      'Tengboche Monastery and Sherpa culture',
    ],
    itinerary: [
      {
        title: 'Fly to Lukla, trek to Phakding',
        description:
          'An early-morning mountain flight to Lukla (2,840 m), then a gentle first walk down the Dudh Koshi valley to Phakding.',
        meals: ['lunch', 'dinner'],
        accommodation: 'Teahouse, Phakding',
        altitude: 2610,
        walkingHours: '3–4 hrs',
      },
      {
        title: 'Trek to Namche Bazaar',
        description:
          'Cross a series of high suspension bridges and climb the famous Namche hill for your first glimpse of Everest.',
        meals: ['breakfast', 'lunch', 'dinner'],
        accommodation: 'Teahouse, Namche Bazaar',
        altitude: 3440,
        walkingHours: '6–7 hrs',
      },
      {
        title: 'Acclimatisation day in Namche',
        description:
          'Day hike to the Everest View Hotel and the twin villages of Khunde and Khumjung, then back to Namche to sleep low.',
        meals: ['breakfast', 'lunch', 'dinner'],
        accommodation: 'Teahouse, Namche Bazaar',
        altitude: 3880,
        walkingHours: '4–5 hrs',
      },
    ],
    inclusions: [
      'All airport transfers and Kathmandu–Lukla flights',
      'Licensed English-speaking trekking guide and porters',
      'Teahouse accommodation and three meals per day on trek',
      'Sagarmatha National Park and Khumbu permits',
    ],
    exclusions: [
      'International flights and Nepal visa',
      'Travel and rescue insurance (mandatory)',
      'Personal gear, tips and drinks',
    ],
    departures: [
      { startDate: '2026-03-10', endDate: '2026-03-23', seatsTotal: 12, seatsBooked: 7 },
      { startDate: '2026-04-02', endDate: '2026-04-15', seatsTotal: 12, seatsBooked: 3 },
      { startDate: '2026-10-05', endDate: '2026-10-18', seatsTotal: 12, seatsBooked: 0 },
    ],
  },
  {
    title: 'Annapurna Circuit Trek',
    slug: 'annapurna-circuit-trek',
    summary:
      'A 12-day traverse of Nepal’s most varied trekking route — subtropical valleys, Tibetan-influenced high villages and the mighty Thorong La pass at 5,416 m.',
    description:
      'The Annapurna Circuit remains the connoisseur’s trek: no other route in Nepal passes through so many climate zones, cultures and landscapes in a single journey.\n\nWe follow the quieter trail variants away from the road, cresting Thorong La before descending to the sacred temple complex at Muktinath and the windswept Kali Gandaki gorge — the deepest valley on Earth.',
    image: 'annapurna-circuit.jpg',
    imageAlt: 'Trekker on the Thorong La pass with prayer flags and Annapurna peaks',
    destination: { title: 'Annapurna Region', slug: 'annapurna-region', region: 'Annapurna' },
    durationDays: 12,
    durationNights: 11,
    difficulty: 'challenging',
    maxAltitude: 5416,
    maxGroupSize: 10,
    basePrice: 1290,
    featured: true,
    highlights: [
      'Cross the Thorong La pass (5,416 m)',
      'Sacred Muktinath temple and the Kali Gandaki gorge',
      'Dramatic transition from rice terraces to high desert',
    ],
    itinerary: [
      {
        title: 'Drive to Chame',
        description:
          'A full-day scenic drive from Kathmandu along the Marsyangdi valley to Chame, the gateway of the upper circuit.',
        meals: ['lunch', 'dinner'],
        accommodation: 'Teahouse, Chame',
        altitude: 2710,
      },
      {
        title: 'Trek to Upper Pisang',
        description:
          'Through apple orchards and pine forest beneath the colossal Paungda Danda rock face to the Tibetan-style village of Upper Pisang.',
        meals: ['breakfast', 'lunch', 'dinner'],
        accommodation: 'Teahouse, Upper Pisang',
        altitude: 3300,
        walkingHours: '5–6 hrs',
      },
    ],
    inclusions: [
      'Private transport Kathmandu–Chame and Jomsom–Pokhara flight',
      'Licensed guide and porter support',
      'ACAP and TIMS permits, teahouse accommodation, meals on trek',
    ],
    exclusions: ['International flights and visa', 'Insurance', 'Tips and personal expenses'],
    departures: [
      { startDate: '2026-03-18', endDate: '2026-03-29', seatsTotal: 10, seatsBooked: 9 },
      { startDate: '2026-11-01', endDate: '2026-11-12', seatsTotal: 10, seatsBooked: 2 },
    ],
  },
  {
    title: 'Langtang Valley Trek',
    slug: 'langtang-valley-trek',
    summary:
      'A rewarding 8-day trek into the “valley of glaciers”, just north of Kathmandu — big mountain scenery, Tamang heritage and far fewer crowds.',
    description:
      'Langtang packs remarkable alpine scenery into a short itinerary, making it ideal for trekkers with limited time who still want genuine high-mountain atmosphere.\n\nThe trail climbs through bamboo and rhododendron forest alive with langur monkeys, emerging into a glacial valley ringed by 7,000-metre peaks. An optional ascent of Kyanjin Ri (4,773 m) crowns the trip.',
    image: 'langtang-valley.jpg',
    imageAlt: 'Yaks grazing in the Langtang valley with Langtang Lirung above',
    destination: { title: 'Langtang Region', slug: 'langtang-region', region: 'Langtang' },
    durationDays: 8,
    durationNights: 7,
    difficulty: 'moderate',
    maxAltitude: 4773,
    maxGroupSize: 12,
    basePrice: 790,
    featured: false,
    highlights: [
      'Kyanjin Gompa and its famous yak-cheese factory',
      'Optional sunrise climb of Kyanjin Ri (4,773 m)',
      'Tamang villages and authentic mountain hospitality',
    ],
    itinerary: [
      {
        title: 'Drive to Syabrubesi',
        description:
          'A winding mountain drive north from Kathmandu to the trailhead town of Syabrubesi.',
        meals: ['lunch', 'dinner'],
        accommodation: 'Lodge, Syabrubesi',
        altitude: 1550,
      },
      {
        title: 'Trek to Lama Hotel',
        description:
          'Follow the Langtang Khola through dense forest — watch for langurs and, if you are lucky, red pandas.',
        meals: ['breakfast', 'lunch', 'dinner'],
        accommodation: 'Teahouse, Lama Hotel',
        altitude: 2380,
        walkingHours: '5–6 hrs',
      },
    ],
    inclusions: [
      'Kathmandu–Syabrubesi transport both ways',
      'Guide, porters, permits, teahouse board on trek',
    ],
    exclusions: ['Visa and international flights', 'Insurance', 'Drinks and tips'],
    departures: [
      { startDate: '2026-04-10', endDate: '2026-04-17', seatsTotal: 12, seatsBooked: 5 },
    ],
  },
]

const seed = async (): Promise<void> => {
  const payload = await getPayload({ config })

  // 0. First admin user (only if none exists) — convenient for fresh databases
  const users = await payload.find({ collection: 'users', limit: 1 })
  if (users.totalDocs === 0 && process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    await payload.create({
      collection: 'users',
      data: {
        email: process.env.SEED_ADMIN_EMAIL,
        password: process.env.SEED_ADMIN_PASSWORD,
        name: 'Admin',
        role: 'admin',
      },
      context,
    })
    payload.logger.info(`Created admin user ${process.env.SEED_ADMIN_EMAIL}`)
  }

  // Idempotency guard — skip if trips already exist
  const existing = await payload.find({ collection: 'trips', limit: 1 })
  if (existing.totalDocs > 0) {
    payload.logger.warn('Trips already exist — skipping seed. Empty the collection to re-run.')
    process.exit(0)
  }

  const destinationIds = new Map<string, number>()

  for (const trip of seedTrips) {
    // 1. Upload hero image
    const hero = await payload.create({
      collection: 'media',
      filePath: path.resolve(seedDir, trip.image),
      data: { alt: trip.imageAlt },
      context,
    })

    // 2. Destination (deduped)
    if (!destinationIds.has(trip.destination.slug)) {
      const destination = await payload.create({
        collection: 'destinations',
        data: {
          title: trip.destination.title,
          slug: trip.destination.slug,
          country: 'Nepal',
          region: trip.destination.region,
          heroImage: hero.id,
        },
        context,
      })
      destinationIds.set(trip.destination.slug, destination.id)
    }

    // 3. Trip
    await payload.create({
      collection: 'trips',
      draft: false,
      data: {
        _status: 'published',
        title: trip.title,
        slug: trip.slug,
        summary: trip.summary,
        description: textToLexical(trip.description),
        heroImage: hero.id,
        destination: destinationIds.get(trip.destination.slug)!,
        durationDays: trip.durationDays,
        durationNights: trip.durationNights,
        difficulty: trip.difficulty,
        maxAltitude: trip.maxAltitude,
        maxGroupSize: trip.maxGroupSize,
        basePrice: trip.basePrice,
        currency: 'USD',
        priceSuffix: 'per person',
        featured: trip.featured,
        highlights: trip.highlights.map((text) => ({ text })),
        itinerary: trip.itinerary.map((day) => ({
          title: day.title,
          description: textToLexical(day.description),
          meals: day.meals,
          accommodation: day.accommodation,
          altitude: day.altitude,
          walkingHours: day.walkingHours,
        })),
        inclusions: trip.inclusions.map((text) => ({ text })),
        exclusions: trip.exclusions.map((text) => ({ text })),
        departures: trip.departures.map((dep) => ({
          startDate: dep.startDate,
          endDate: dep.endDate,
          seatsTotal: dep.seatsTotal,
          seatsBooked: dep.seatsBooked,
          status: dep.seatsTotal - dep.seatsBooked === 0
            ? 'soldOut'
            : dep.seatsTotal - dep.seatsBooked <= 3
              ? 'limited'
              : 'available',
        })),
      },
      context,
    })
    payload.logger.info(`Seeded trip: ${trip.title}`)
  }

  payload.logger.info(`Seed complete — ${seedTrips.length} trips, ${destinationIds.size} destinations.`)
  process.exit(0)
}

// Top-level await: `payload run` exits when the module finishes importing,
// so the script MUST be awaited here (a floating promise would be killed).
await seed()
