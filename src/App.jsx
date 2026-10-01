import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Header from './components/Header'
import Footer from './components/Footer'
import BookingDrawer from './components/BookingDrawer'
import HomePage from './views/HomePage'
import BlogArticlePage from './views/BlogArticlePage'
import TripDetailPage from './views/TripDetailPage'
import { getArticleSlug, getTripSlug } from './data/tripDetails'
import { useRouter } from './lib/router'

/* The destinations and trips pages pull in framer-motion + GSAP;
   load them only when visited. */
const DestinationsPage = lazy(() => import('./views/DestinationsPage'))
const TripsPage = lazy(() => import('./views/TripsPage'))

export default function App() {
  const { path, navigate } = useRouter()
  const [discovery, setDiscovery] = useState(null)
  const [bookingTrip, setBookingTrip] = useState(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [showMobileCta, setShowMobileCta] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowMobileCta(window.scrollY > window.innerHeight * 0.78)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Legacy links used a hash for the premium guide — redirect them to the
     article's own page. */
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash.includes('best-summer-treks') || window.location.hash.includes('family-nepal')) {
        navigate('/blog/best-summer-treks-family-nepal-beginners', { replace: true })
      }
    }
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [navigate])

  const openBooking = useCallback((trip = null) => {
    setBookingTrip(trip)
    setBookingOpen(true)
  }, [])

  const closeBooking = useCallback(() => setBookingOpen(false), [])

  const findTrips = (filters) => {
    setDiscovery({ ...filters, key: Date.now() })
  }

  const tripSlug = getTripSlug(path)
  const blogSlug = getArticleSlug(path)

  let page
  if (blogSlug) {
    page = <BlogArticlePage key={blogSlug} slug={blogSlug} onBook={openBooking} />
  } else if (tripSlug) {
    page = <TripDetailPage key={tripSlug} slug={tripSlug} onBook={openBooking} />
  } else if (path === '/destinations') {
    page = (
      <Suspense fallback={null}>
        <DestinationsPage onBook={openBooking} />
      </Suspense>
    )
  } else if (path === '/trips') {
    page = (
      <Suspense fallback={null}>
        <TripsPage onBook={openBooking} />
      </Suspense>
    )
  } else {
    page = <HomePage discovery={discovery} onFind={findTrips} onBook={openBooking} />
  }

  return (
    <div className="site-wrap">
      <Header onBook={openBooking} />

      {page}

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

      {bookingOpen && <BookingDrawer key={`booking-${bookingTrip?.id || 'custom'}`} trip={bookingTrip} onClose={closeBooking} />}
    </div>
  )
}
