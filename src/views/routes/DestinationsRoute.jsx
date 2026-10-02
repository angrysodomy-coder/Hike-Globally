'use client'

import DestinationsPage from '../DestinationsPage'
import { useSite } from '../../components/SiteShell'

export default function DestinationsRoute() {
  const { openBooking } = useSite()
  return <DestinationsPage onBook={openBooking} />
}
