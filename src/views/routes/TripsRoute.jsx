'use client'

import TripsPage from '../TripsPage'
import { useSite } from '../../components/SiteShell'

export default function TripsRoute({ cmsTrips }) {
  const { openBooking } = useSite()
  return <TripsPage onBook={openBooking} cmsTrips={cmsTrips} />
}
