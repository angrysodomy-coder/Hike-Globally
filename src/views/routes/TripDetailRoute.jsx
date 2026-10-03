'use client'

import TripDetailPage from '../TripDetailPage'
import { useSite } from '../../components/SiteShell'

export default function TripDetailRoute({ slug, cmsTrip }) {
  const { openBooking } = useSite()
  return <TripDetailPage key={slug} slug={slug} onBook={openBooking} cmsTrip={cmsTrip} />
}
