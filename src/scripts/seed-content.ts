/**
 * Content seed — run with: pnpm seed:content   (after `pnpm seed` has created trips)
 *
 * Creates: categories, 2 blog posts (cross-linked to trips), testimonials,
 * a block-built About page + Home page, and populates the Header/Footer globals.
 */
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '@payload-config'
import { textToLexical } from '@/lib/lexical'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const seedDir = path.resolve(dirname, '../../public/seed')
const context = { disableRevalidate: true }

const seed = async (): Promise<void> => {
  const payload = await getPayload({ config })

  // Idempotency guard
  const existing = await payload.find({ collection: 'pages', limit: 1 })
  if (existing.totalDocs > 0) {
    payload.logger.warn('Pages already exist — skipping content seed.')
    process.exit(0)
  }

  // Look up seeded trips for relationships
  const tripsResult = await payload.find({
    collection: 'trips',
    limit: 10,
    pagination: false,
  })
  const tripBySlug = new Map(tripsResult.docs.map((t) => [t.slug, t]))
  const ebc = tripBySlug.get('everest-base-camp-trek')
  const annapurna = tripBySlug.get('annapurna-circuit-trek')
  const langtang = tripBySlug.get('langtang-valley-trek')
  if (!ebc || !annapurna || !langtang) {
    payload.logger.error('Trips not found — run `pnpm seed` first.')
    process.exit(1)
  }

  // ------------------------------------------------------------- Categories
  payload.logger.info('Seeding categories…')
  const [trekkingTips, travelGuides] = await Promise.all([
    payload.create({
      collection: 'categories',
      data: { title: 'Trekking Tips', slug: 'trekking-tips' },
      context,
    }),
    payload.create({
      collection: 'categories',
      data: { title: 'Travel Guides', slug: 'travel-guides' },
      context,
    }),
  ])

  // ------------------------------------------------------------------ Posts
  payload.logger.info('Seeding posts…')
  const postHero1 = await payload.create({
    collection: 'media',
    filePath: path.resolve(seedDir, 'everest-base-camp.jpg'),
    data: { alt: 'Trekkers on the trail to Everest Base Camp' },
    context,
  })
  const postHero2 = await payload.create({
    collection: 'media',
    filePath: path.resolve(seedDir, 'annapurna-circuit.jpg'),
    data: { alt: 'Prayer flags on the Thorong La pass' },
    context,
  })

  await payload.create({
    collection: 'posts',
    draft: false,
    data: {
      _status: 'published',
      title: 'How to Train for the Everest Base Camp Trek',
      slug: 'how-to-train-for-everest-base-camp',
      heroImage: postHero1.id,
      excerpt:
        'Twelve weeks is enough to get trek-fit for EBC — if you train the right way. Here is the exact programme we give our clients.',
      content: textToLexical(
        'The Everest Base Camp trek is not a technical climb, but it demands sustained effort at altitude: five to seven hours of walking a day, for twelve days, much of it above 4,000 metres.\n\nStart twelve weeks out. Weeks one to four are about building an aerobic base: three cardio sessions and two leg-strength sessions per week. Weeks five to eight add weighted stair climbs or hill repeats with the daypack you will actually carry. The final month is specificity: back-to-back long hikes on consecutive weekend days, because the trek never gives you a rest day after a hard one.\n\nAbove all, arrive healthy. No training plan compensates for starting the trail with a cold, and altitude magnifies everything.',
      ),
      categories: [trekkingTips.id],
      relatedTrips: [ebc.id],
      authorName: 'Pemba Sherpa',
      publishedAt: new Date('2026-01-15').toISOString(),
    },
    context,
  })

  await payload.create({
    collection: 'posts',
    draft: false,
    data: {
      _status: 'published',
      title: 'Annapurna vs Everest: Which Classic Trek Is Right for You?',
      slug: 'annapurna-vs-everest-which-trek',
      heroImage: postHero2.id,
      excerpt:
        'Nepal’s two most famous treks deliver very different journeys. We compare scenery, difficulty, crowds and cost to help you choose.',
      content: textToLexical(
        'Ask ten guides which trek they would recommend first and you will get a split vote. Both routes are world-class; they are simply different experiences.\n\nEverest is about a destination: the trail builds day by day toward base camp and the Kala Patthar sunrise, through the most dramatic high-mountain amphitheatre on Earth. Annapurna is about a journey: a traverse through climate zones, from rice terraces to the high desert of Manang, crossing the Thorong La as its crux.\n\nChoose Everest if the name on the map matters and you want maximum mountain spectacle. Choose Annapurna if variety, culture and quieter trails appeal. Either way, build in acclimatisation days — they are the difference between finishing strong and flying home early.',
      ),
      categories: [travelGuides.id],
      relatedTrips: [ebc.id, annapurna.id],
      authorName: 'Maya Gurung',
      publishedAt: new Date('2026-02-03').toISOString(),
    },
    context,
  })

  // ----------------------------------------------------------- Testimonials
  payload.logger.info('Seeding testimonials…')
  const testimonialData = [
    {
      quote:
        'Flawless organisation from first email to final transfer. Our guide read the weather, adjusted the plan, and got all eight of us to base camp.',
      authorName: 'Sarah Mitchell',
      authorLocation: 'Sydney, Australia',
      rating: 5,
      trip: ebc.id,
    },
    {
      quote:
        'The Annapurna Circuit exceeded every expectation. Tea houses were hand-picked and the pace was perfect for acclimatisation.',
      authorName: 'Jonas Weber',
      authorLocation: 'Munich, Germany',
      rating: 5,
      trip: annapurna.id,
    },
    {
      quote:
        'Langtang was the perfect one-week escape — big mountains without the crowds. We will be back for Everest next year.',
      authorName: 'Emily Chen',
      authorLocation: 'Vancouver, Canada',
      rating: 5,
      trip: langtang.id,
    },
  ]
  const testimonials = []
  for (const t of testimonialData) {
    testimonials.push(await payload.create({ collection: 'testimonials', data: t, context }))
  }

  // ------------------------------------------------------------------ Pages
  payload.logger.info('Seeding pages…')
  const homeHero = await payload.create({
    collection: 'media',
    filePath: path.resolve(seedDir, 'langtang-valley.jpg'),
    data: { alt: 'Yaks grazing beneath Langtang Lirung in the Langtang valley' },
    context,
  })

  await payload.create({
    collection: 'pages',
    draft: false,
    data: {
      _status: 'published',
      title: 'Home',
      slug: 'home',
      layout: [
        {
          blockType: 'hero',
          heading: 'Himalayan Journeys, Expertly Guided',
          subheading:
            'Treks, tours and expeditions across Nepal — crafted and led by local experts for over 20 years.',
          image: homeHero.id,
          cta: { label: 'Explore trips', href: '/trips' },
        },
        {
          blockType: 'featuredTrips',
          heading: 'Our most popular trips',
          trips: [ebc.id, annapurna.id, langtang.id],
        },
        {
          blockType: 'testimonialsBlock',
          heading: 'What travellers say',
          testimonials: testimonials.map((t) => t.id),
        },
        {
          blockType: 'cta',
          heading: 'Not sure which trek fits you?',
          text: 'Tell us your dates, fitness and wishlist — we will design the right itinerary within 24 hours.',
          buttonLabel: 'Plan my trip',
          buttonHref: '/contact',
        },
      ],
    },
    context,
  })

  await payload.create({
    collection: 'pages',
    draft: false,
    data: {
      _status: 'published',
      title: 'About Us',
      slug: 'about',
      layout: [
        {
          blockType: 'hero',
          heading: 'About Hike Globally',
          subheading: 'Local roots. Two decades of experience. Thousands of safe summits.',
          image: homeHero.id,
        },
        {
          blockType: 'content',
          width: 'narrow',
          content: textToLexical(
            'Hike Globally was founded in Kathmandu by guides who grew up on these trails. Every itinerary we sell is one we have walked ourselves — usually dozens of times.\n\nWe employ our guides and porters year-round, pay above industry rates, insure every member of staff for high-altitude work, and cap group sizes so no one is ever just a number on a manifest.\n\nWhen you book with us, your money stays in the mountains it came to see.',
          ),
        },
        {
          blockType: 'faqBlock',
          heading: 'Frequently asked questions',
          items: [
            {
              question: 'Are your guides licensed?',
              answer: textToLexical(
                'Yes — every lead guide holds a Nepal Government trekking-guide licence plus wilderness first-aid certification, renewed annually.',
              ),
            },
            {
              question: 'What is your cancellation policy?',
              answer: textToLexical(
                'Free rescheduling up to 30 days before departure. Cancellations more than 60 days out receive a full refund minus permit costs.',
              ),
            },
          ],
        },
        {
          blockType: 'cta',
          heading: 'Trek with people who live here',
          text: 'Talk to a guide — not a call centre.',
          buttonLabel: 'Get in touch',
          buttonHref: '/contact',
        },
      ],
    },
    context,
  })

  // ---------------------------------------------------------------- Globals
  payload.logger.info('Seeding globals…')
  await payload.updateGlobal({
    slug: 'header',
    data: {
      // Mirrors the hand-authored nav in src/data/content.js so the site
      // header looks identical the moment the CMS takes it over.
      navItems: [
        { label: 'Destinations', href: '/destinations' },
        { label: 'Trips', href: '/trips' },
        { label: 'Treks', href: '/#treks' },
        { label: 'Journal', href: '/blog' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    context,
  })

  await payload.updateGlobal({
    slug: 'footer',
    data: {
      aboutText:
        'Locally owned trekking operator based in Kathmandu, crafting Himalayan journeys since 2004.',
      columns: [
        {
          heading: 'Trips',
          links: [
            { label: 'Everest Base Camp', href: '/trips/everest-base-camp-trek' },
            { label: 'Annapurna Circuit', href: '/trips/annapurna-circuit-trek' },
            { label: 'Langtang Valley', href: '/trips/langtang-valley-trek' },
          ],
        },
        {
          heading: 'Company',
          links: [
            { label: 'About us', href: '/about' },
            { label: 'Blog', href: '/blog' },
            { label: 'Contact', href: '/contact' },
          ],
        },
      ],
      social: {
        facebook: 'https://facebook.com/himalayatravel',
        instagram: 'https://instagram.com/himalayatravel',
      },
      contact: {
        phone: '+977 1 442 0000',
        email: 'hello@himalayatravel.example',
        address: 'Thamel, Kathmandu 44600, Nepal',
      },
    },
    context,
  })

  payload.logger.info('Content seed complete: 2 posts, 2 pages, 3 testimonials, globals.')
  process.exit(0)
}

// Top-level await: `payload run` exits when the module finishes importing,
// so the script MUST be awaited here (a floating promise would be killed).
await seed()
