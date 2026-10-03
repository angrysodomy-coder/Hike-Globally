'use client'

import DestinationsPage from '../DestinationsPage'
import { useSite } from '../../components/SiteShell'

export default function DestinationsRoute({ cmsDestinations }) {
  const { openBooking } = useSite()
  return <DestinationsPage onBook={openBooking} cmsDestinations={cmsDestinations} />
}
