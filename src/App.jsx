import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Header from './components/Header'
import Footer from './components/Footer'
import BookingDrawer from './components/BookingDrawer'
import StoryDrawer from './components/StoryDrawer'
import SummerFamilyTreksBlog from './components/SummerFamilyTreksBlog'
import HomePage from './pages/HomePage'
import { useRouter } from './lib/router'

/* The destinations, trips, and detail pages pull in framer-motion + GSAP;
   load them only when visited. */
const DestinationsPage = lazy(() => import('./pages/DestinationsPage'))
const DestinationDetailPage = lazy(() => import('./pages/DestinationDetailPage'))
const TripsPage = lazy(() => import('./pages/TripsPage'))
const TripDetailPage = lazy(() => import('./pages/TripDetailPage'))
const BlogListPage = lazy(() => import('./pages/BlogListPage'))
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

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

  const renderCurrentRoute = () => {
    if (path === '/') {
      return <HomePage discovery={discovery} onFind={findTrips} onRead={handleRead} onBook={openBooking} />
    }
    if (path === '/destinations') {
      return (
        <Suspense fallback={null}>
          <DestinationsPage onBook={openBooking} />
        </Suspense>
      )
    }
    if (path.startsWith('/destinations/')) {
      const slug = path.replace('/destinations/', '').trim()
      return (
        <Suspense fallback={null}>
          <DestinationDetailPage slug={slug} onBook={openBooking} />
        </Suspense>
      )
    }
    if (path === '/trips') {
      return (
        <Suspense fallback={null}>
          <TripsPage onBook={openBooking} />
        </Suspense>
      )
    }
    if (path.startsWith('/trips/')) {
      const slug = path.replace('/trips/', '').trim()
      return (
        <Suspense fallback={null}>
          <TripDetailPage slug={slug} onBook={openBooking} />
        </Suspense>
      )
    }
    if (path === '/blog') {
      return (
        <Suspense fallback={null}>
          <BlogListPage onRead={handleRead} onBook={openBooking} />
        </Suspense>
      )
    }
    if (path.startsWith('/blog/')) {
      const slug = path.replace('/blog/', '').trim()
      return (
        <Suspense fallback={null}>
          <BlogDetailPage slug={slug} onBook={openBooking} />
        </Suspense>
      )
    }
    return (
      <Suspense fallback={null}>
        <NotFoundPage />
      </Suspense>
    )
  }

  return (
    <div className="site-wrap">
      <Header onBook={openBooking} />

      {renderCurrentRoute()}

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
