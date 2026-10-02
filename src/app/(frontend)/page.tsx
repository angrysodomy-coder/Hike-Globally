import type { Metadata } from 'next'
import React from 'react'
import HomeRoute from '@/views/routes/HomeRoute'

export const metadata: Metadata = {
  title: 'Hike Globally — Premium Himalayan Journeys',
  description:
    'Small-group Himalayan journeys, crafted by local experts. Explore premium treks through Everest, Annapurna, Manaslu, Langtang and Upper Mustang.',
}

/* The art-directed homepage stays hand-built. To serve the CMS `home` page
   (blocks) instead, swap this body for the one in `home-page.example.tsx`. */
export default function HomePageRoute() {
  return <HomeRoute />
}
