'use client'

/* eslint-disable react-refresh/only-export-components -- the shell owns the
   site context, so it exports the `useSite` hook alongside the component. */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Header from './Header'
import Footer from './Footer'
import BookingDrawer from './BookingDrawer'
import { NextRouterProvider } from '../lib/next-router'

/* ---------------------------------------------------------------------------
   SiteShell — the persistent chrome that used to live in `src/App.jsx`.
   ---------------------------------------------------------------------------
   Under the App Router the per-page bodies are real routes, so everything that
   must survive a navigation (header, footer, booking drawer, mobile CTA, the
   trip-discovery filters raised from the hero) lives here in the
   `(frontend)` layout instead.
--------------------------------------------------------------------------- */

const SiteContext = createContext(null)

export function useSite() {
  const ctx = useContext(SiteContext)
  if (!ctx) throw new Error('useSite must be used inside <SiteShell>')
  return ctx
}

function Shell({ children, navItems }) {
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

  const findTrips = useCallback((filters) => {
    setDiscovery({ ...filters, key: Date.now() })
  }, [])

  const value = useMemo(
    () => ({ discovery, findTrips, openBooking }),
    [discovery, findTrips, openBooking],
  )

  return (
    <SiteContext.Provider value={value}>
      <div className="site-wrap">
        <Header onBook={openBooking} navItems={navItems} />

        {children}

        <Footer onBook={openBooking} />

        <button
          className={`mobile-booking-cta ${showMobileCta ? 'is-visible' : ''}`}
          type="button"
          onClick={() => openBooking()}
          aria-hidden={!showMobileCta}
          tabIndex={showMobileCta ? 0 : -1}
        >
          <span>
            <small>Your Himalayan story</small>Plan my trip
          </span>
          <ArrowRight size={19} />
        </button>

        {bookingOpen && (
          <BookingDrawer
            key={`booking-${bookingTrip?.id || 'custom'}`}
            trip={bookingTrip}
            onClose={closeBooking}
          />
        )}
      </div>
    </SiteContext.Provider>
  )
}

export default function SiteShell({ children, navItems }) {
  return (
    <NextRouterProvider>
      <Shell navItems={navItems}>{children}</Shell>
    </NextRouterProvider>
  )
}
