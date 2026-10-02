'use client'

import HomePage from '../HomePage'
import { useSite } from '../../components/SiteShell'

export default function HomeRoute() {
  const { discovery, findTrips, openBooking } = useSite()
  return <HomePage discovery={discovery} onFind={findTrips} onBook={openBooking} />
}
