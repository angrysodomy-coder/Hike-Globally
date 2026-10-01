import { MotionConfig } from 'framer-motion'
import { usePageMeta } from '../lib/router'
import PageProgress from '../components/destinations/PageProgress'
import TripsHero from '../components/trips/TripsHero'
import TripsMarquee from '../components/trips/TripsMarquee'
import SignatureJourney from '../components/trips/SignatureJourney'
import TripCollection from '../components/trips/TripCollection'
import TripStats from '../components/trips/TripStats'
import SeasonMatrix from '../components/trips/SeasonMatrix'
import InclusionsSection from '../components/trips/InclusionsSection'
import VoicesSection from '../components/destinations/VoicesSection'
import TripFaq from '../components/trips/TripFaq'
import TripsCta from '../components/trips/TripsCta'

export default function TripsPage({ onBook }) {
  usePageMeta({
    title: 'Trips — Hike Globally',
    description:
      'Eight hand-built Himalayan journeys: Everest Base Camp, Annapurna Sanctuary, Manaslu Circuit, Upper Mustang, Langtang, Kathmandu, Gokyo and Mardi Himal. Small groups, local leaders, every departure handled end to end.',
  })

  return (
    <MotionConfig reducedMotion="user">
      <PageProgress />
      <main id="main-content">
        <TripsHero onBook={onBook} />
        <TripsMarquee />
        <SignatureJourney onBook={onBook} />
        <TripCollection onBook={onBook} />
        <TripStats />
        <SeasonMatrix />
        <InclusionsSection onBook={onBook} />
        <VoicesSection />
        <TripFaq />
        <TripsCta onBook={onBook} />
      </main>
    </MotionConfig>
  )
}
