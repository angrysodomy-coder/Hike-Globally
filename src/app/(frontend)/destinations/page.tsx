import type { Metadata } from 'next'
import React from 'react'
import DestinationsRoute from '@/views/routes/DestinationsRoute'
import { getDestinations } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Destinations',
  description:
    'Explore Nepal by region: the Khumbu, Annapurna, Manaslu, Mustang, Langtang and the untrampled west. Small-group, locally led Himalayan journeys.',
}

// Safety-net ISR; the 'destinations' cache tag is purged the moment an editor saves.
export const revalidate = 86400

export default async function DestinationsPageRoute() {
  const destinations = await getDestinations().catch(() => [])

  return <DestinationsRoute cmsDestinations={destinations} />
}
