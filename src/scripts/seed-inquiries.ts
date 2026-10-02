/**
 * Demo inquiries — run with: npm run seed:inquiries
 *
 * Sprinkles ~45 realistic booking inquiries across the last 60 days (weighted
 * towards recent days) with a natural spread of pipeline statuses, so the
 * custom /admin dashboard has something alive to chart. Purely demo data:
 * safe to delete from the Inquiries collection whenever you like.
 *
 * Idempotent: skips if inquiries already exist.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const context = { disableRevalidate: true }

const NAMES: Array<[string, string, string]> = [
  ['Sophie Marchand', 'sophie.marchand@example.com', 'France'],
  ['Daniel Okafor', 'd.okafor@example.com', 'Nigeria'],
  ['Priya Raghavan', 'priya.r@example.com', 'India'],
  ['Lucas Meyer', 'lucas.meyer@example.com', 'Germany'],
  ['Emma Sørensen', 'emma.sorensen@example.com', 'Denmark'],
  ['James Whitfield', 'j.whitfield@example.com', 'United Kingdom'],
  ['Aiko Tanaka', 'aiko.tanaka@example.com', 'Japan'],
  ['Marco Rossi', 'marco.rossi@example.com', 'Italy'],
  ['Chloe Dubois', 'chloe.dubois@example.com', 'Canada'],
  ['Rahul Sharma', 'rahul.sharma@example.com', 'Australia'],
  ['Ingrid Bergström', 'ingrid.b@example.com', 'Sweden'],
  ['Tomás Herrera', 't.herrera@example.com', 'Spain'],
  ['Nina Kovač', 'nina.kovac@example.com', 'Slovenia'],
  ['Oliver Chen', 'oliver.chen@example.com', 'Singapore'],
  ['Maya Patel', 'maya.patel@example.com', 'United States'],
  ['Felix Wagner', 'felix.wagner@example.com', 'Austria'],
  ['Isabella Fontana', 'bella.fontana@example.com', 'Brazil'],
  ['Noah Kim', 'noah.kim@example.com', 'South Korea'],
  ['Amara Diallo', 'amara.diallo@example.com', 'Senegal'],
  ['Elena Petrova', 'elena.petrova@example.com', 'Latvia'],
]

const MESSAGES = [
  'Hi! We are two friends dreaming of Everest Base Camp next spring. Could you share the departure dates and what is included?',
  'Hello, we trekked Annapurna with another company years ago and want a quieter route this time. Is Manaslu right for us?',
  'Travelling with my teenage daughter — is Langtang Valley suitable for a first trek? We would love a private departure.',
  'What is the best season for Upper Mustang? We are flexible in autumn and prefer smaller groups.',
  'Could you help arrange a 3-day extension to Chitwan after the Everest trek? Also curious about gear rental.',
  'Do you offer vegetarian meals on the trail? One of us is gluten-free as well.',
  'We are a family of four (kids 12 and 15) looking at the Annapurna Circuit. Is October weather reliable?',
]

const STATUS_WEIGHTS: Array<['new' | 'contacted' | 'quoted' | 'converted' | 'closed', number]> = [
  ['new', 0.38],
  ['contacted', 0.27],
  ['quoted', 0.15],
  ['converted', 0.12],
  ['closed', 0.08],
]

const pickStatus = (): 'new' | 'contacted' | 'quoted' | 'converted' | 'closed' => {
  const r = Math.random()
  let acc = 0
  for (const [status, w] of STATUS_WEIGHTS) {
    acc += w
    if (r <= acc) return status
  }
  return 'new'
}

const run = async () => {
  const payload = await getPayload({ config })

  const existing = await payload.find({ collection: 'inquiries', limit: 1 })
  if (existing.totalDocs > 0) {
    payload.logger.warn('Inquiries already exist — skipping demo seed.')
    process.exit(0)
  }

  const trips = await payload.find({ collection: 'trips', limit: 10, draft: false })

  const now = Date.now()
  const count = 42 + Math.floor(Math.random() * 8)

  for (let i = 0; i < count; i++) {
    // Bias towards recent days: square of a uniform random → denser lately.
    const daysAgo = Math.floor(Math.pow(Math.random(), 1.8) * 59)
    const createdAt = new Date(
      now - daysAgo * 86_400_000 - Math.floor(Math.random() * 20) * 3_600_000,
    )
    const [name, email, country] = NAMES[Math.floor(Math.random() * NAMES.length)]
    const trip = trips.docs[Math.floor(Math.random() * trips.docs.length)]

    await payload.create({
      collection: 'inquiries',
      data: {
        name,
        email,
        country,
        trip: trip?.id,
        preferredDate: new Date(
          createdAt.getTime() + (30 + Math.floor(Math.random() * 150)) * 86_400_000,
        ).toISOString(),
        adults: 1 + Math.floor(Math.random() * 3),
        children: Math.random() > 0.8 ? 1 : 0,
        message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
        status: pickStatus(),
        source: 'contact',
        createdAt: createdAt.toISOString(),
      },
      context,
    })
  }

  payload.logger.info(`Created ${count} demo inquiries across the last 60 days.`)
  process.exit(0)
}

// Top-level await: `payload run` exits when the module finishes importing,
// so the script MUST be awaited here (a floating promise would be killed).
await run()
