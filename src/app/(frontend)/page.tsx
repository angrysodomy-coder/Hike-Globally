import type { Metadata } from 'next'
import React from 'react'
import HomeRoute from '@/views/routes/HomeRoute'
import { getPublishedTrips, getPublishedPosts, getDestinations } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Hike Globally — Premium Himalayan Journeys',
  description:
    'Small-group Himalayan journeys, crafted by local experts. Explore premium treks through Everest, Annapurna, Manaslu, Langtang and Upper Mustang.',
}

export const revalidate = 86400

export default async function HomePageRoute() {
  const [trips, posts, destinations] = await Promise.all([
    getPublishedTrips().catch(() => []),
    getPublishedPosts().catch(() => []),
    getDestinations().catch(() => []),
  ])

  return (
    <HomeRoute
      cmsTrips={trips}
      cmsPosts={posts}
      cmsDestinations={destinations}
    />
  )
}
