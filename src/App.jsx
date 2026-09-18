import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Header from './components/Header'
import Footer from './components/Footer'
import BookingDrawer from './components/BookingDrawer'
import StoryDrawer from './components/StoryDrawer'
import SummerFamilyTreksBlog from './components/SummerFamilyTreksBlog'
import HomePage from './pages/HomePage'
import { useRouter } from './lib/router'

/* The destinations and trips pages pull in framer-motion + GSAP;
   load them only when visited. */
const DestinationsPage = lazy(() => import('./pages/DestinationsPage'))
const TripsPage = lazy(() => import('./pages/TripsPage'))

export default function App() {
  const { path } = useRouter()
  const [discovery, setDiscovery] = useState(null)
  const [bookingTrip, setBookingTrip] = useState(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [story, setStory] = useState(null)
  const [premiumBlog, setPremiumBlog] = useState(null)
  const [showMobileCta, setShowMobileCta] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowMobileCta(window.scrollY > window.innerHeight * 0.78)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash.includes('best-summer-treks') || window.location.hash.includes('family-nepal')) {
        setPremiumBlog({ id: 'best-summer-treks-family-nepal-beginners' })
        window.scrollTo(0, 0)
      }
    }
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [])

  const openBooking = useCallback((trip = null) => {
    setStory(null)
    setBookingTrip(trip)
    setBookingOpen(true)
  }, [])

  const closeBooking = useCallback(() => setBookingOpen(false), [])
  const closeStory = useCallback(() => setStory(null), [])
  const closePremiumBlog = useCallback(() => setPremiumBlog(null), [])

  const handleRead = useCallback((article) => {
    if (article?.premium || article?.id === 'best-summer-treks-family-nepal-beginners') {
      setPremiumBlog(article)
      setStory(null)
      window.scrollTo(0, 0)
    } else {
      setStory(article)
    }
  }, [])

  const findTrips = (filters) => {
    setDiscovery({ ...filters, key: Date.now() })
  }

  return (
    <div className="site-wrap">
      <Header onBook={openBooking} />

      {path === '/destinations'
        ? (
          <Suspense fallback={null}>
            <DestinationsPage onBook={openBooking} />
          </Suspense>
        )
        : path === '/trips'
          ? (
            <Suspense fallback={null}>
              <TripsPage onBook={openBooking} />
            </Suspense>
          )
          : <HomePage discovery={discovery} onFind={findTrips} onRead={handleRead} onBook={openBooking} />}

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
      {premiumBlog && (
        <SummerFamilyTreksBlog
          key={premiumBlog.id}
          onClose={closePremiumBlog}
          onBook={() => openBooking()}
        />
      )}
    </div>
  )
}
