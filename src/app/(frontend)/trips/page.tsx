import type { Metadata } from 'next'
import React from 'react'
import TripsRoute from '@/views/routes/TripsRoute'
import { getPublishedTrips } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Trips',
  description:
    'Eight hand-built Himalayan journeys: Everest Base Camp, Annapurna Sanctuary, Manaslu Circuit, Upper Mustang, Langtang, Kathmandu, Gokyo and Mardi Himal. Small groups, local leaders, every departure handled end to end.',
}

// Safety-net ISR; the 'trips' cache tag is purged on publish for instant updates.
export const revalidate = 86400

export default async function TripsPageRoute() {
  const trips = await getPublishedTrips().catch(() => [])

  return <TripsRoute cmsTrips={trips} />
}
