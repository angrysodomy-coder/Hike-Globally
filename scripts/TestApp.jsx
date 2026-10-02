/* ---------------------------------------------------------------------------
   TestApp — jsdom-only app shell for the smoke tests in this folder.
   ---------------------------------------------------------------------------
   In the browser the site is composed by the Next.js App Router:
   `src/app/(frontend)/layout.tsx` renders `<SiteShell>` (header, footer,
   booking drawer, mobile CTA) and each route file mounts one of the page
   bodies in `src/views/`.

   The smoke tests run in bare jsdom with esbuild, where `next/navigation` has
   no request context, so they mount this equivalent shell instead — the same
   views and the same chrome, driven by the History-API `RouterProvider` that
   still lives in `src/lib/router.jsx`. Keep the route table below in sync with
   `src/app/(frontend)/`.
--------------------------------------------------------------------------- */
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Header from '../src/components/Header.jsx'
import Footer from '../src/components/Footer.jsx'
import BookingDrawer from '../src/components/BookingDrawer.jsx'
import HomePage from '../src/views/HomePage.jsx'
import BlogArticlePage from '../src/views/BlogArticlePage.jsx'
import TripDetailPage from '../src/views/TripDetailPage.jsx'
import { getArticleSlug, getTripSlug } from '../src/data/tripDetails.js'
import { useRouter } from '../src/lib/router.jsx'

const DestinationsPage = lazy(() => import('../src/views/DestinationsPage.jsx'))
const TripsPage = lazy(() => import('../src/views/TripsPage.jsx'))

export default function TestApp() {
  const { path } = useRouter()
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
