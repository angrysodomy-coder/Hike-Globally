'use client'

import TripsPage from '../TripsPage'
import { useSite } from '../../components/SiteShell'

export default function TripsRoute() {
  const { openBooking } = useSite()
  return <TripsPage onBook={openBooking} />
}
