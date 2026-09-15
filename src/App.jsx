import { useCallback, useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Header from './components/Header'
import Hero from './components/Hero'
import TripsSection from './components/TripsSection'
import TreksSection from './components/TreksSection'
import JournalSection from './components/JournalSection'
import ReviewsSection from './components/ReviewsSection'
import Footer from './components/Footer'
import BookingDrawer from './components/BookingDrawer'
import StoryDrawer from './components/StoryDrawer'

export default function App() {
  const [discovery, setDiscovery] = useState(null)
  const [bookingTrip, setBookingTrip] = useState(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [story, setStory] = useState(null)
  const [showMobileCta, setShowMobileCta] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowMobileCta(window.scrollY > window.innerHeight * 0.78)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const openBooking = useCallback((trip = null) => {
    setStory(null)
    setBookingTrip(trip)
    setBookingOpen(true)
  }, [])

  const closeBooking = useCallback(() => setBookingOpen(false), [])
  const closeStory = useCallback(() => setStory(null), [])

  const findTrips = (filters) => {
    setDiscovery({ ...filters, key: Date.now() })
  }

  return (
    <div className="site-wrap">
      <Header onBook={openBooking} />
      <main id="main-content">
        <Hero onFind={findTrips} />
        <TripsSection discovery={discovery} onBook={openBooking} />
        <TreksSection onBook={openBooking} />
        <JournalSection onRead={setStory} />
        <ReviewsSection />
      </main>
      <Footer onBook={openBooking} />

      <button
        className={`mobile-booking-cta ${showMobileCta ? 'is-visible' : ''}`}
        type="button"
        onClick={() => openBooking()}
        aria-hidden={!showMobileCta}
        tabIndex={showMobileCta ? 0 : -1}
      >
        <span><small>Your Himalayan story</small>Plan my trip</span>
        <ArrowRight size={19} />
      </button>

      {bookingOpen && <BookingDrawer key={bookingTrip?.id || 'custom'} trip={bookingTrip} onClose={closeBooking} />}
      {story && (
        <StoryDrawer
          key={story.id}
          article={story}
          onClose={closeStory}
          onPlan={() => openBooking()}
        />
      )}
    </div>
  )
}
