'use client'

import TripDetailPage from '../TripDetailPage'
import { useSite } from '../../components/SiteShell'

/* The hand-built trip page, used for journeys that have not been migrated
   into Payload yet. CMS trips are rendered server-side by the branded
   <TripDetail /> instead — see src/app/(frontend)/trips/[slug]/page.tsx. */
export default function TripDetailRoute({ slug }) {
  const { openBooking } = useSite()
  return <TripDetailPage key={slug} slug={slug} onBook={openBooking} />
}
