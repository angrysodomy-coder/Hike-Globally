import Hero from '../components/Hero'
import DestinationsSection from '../components/DestinationsSection'
import TripsSection from '../components/TripsSection'
import TreksSection from '../components/TreksSection'
import JournalSection from '../components/JournalSection'
import ReviewsSection from '../components/ReviewsSection'
import { usePageMeta } from '../lib/router'

export default function HomePage({ discovery, onFind, onRead, onBook }) {
  usePageMeta({
    title: 'Hike Globally — Premium Himalayan Journeys',
    description: 'Small-group Himalayan journeys, crafted by local experts. Explore premium treks through Everest, Annapurna, Manaslu, Langtang and Upper Mustang.',
  })

  return (
    <main id="main-content">
      <Hero onFind={onFind} />
      <DestinationsSection />
      <TripsSection discovery={discovery} onBook={onBook} />
      <TreksSection onBook={onBook} />
      <JournalSection onRead={onRead} />
      <ReviewsSection />
    </main>
  )
}
