import React from 'react'

import type { EnquiryFormBlock } from '@/payload-types'

import { EnquiryFormFields } from './Form'

export function EnquiryFormBlockComponent({
  consentText,
  heading,
  intro,
  successMessage,
  trip,
}: EnquiryFormBlock) {
  const tripId = typeof trip === 'object' && trip ? trip.id : (trip ?? undefined)

  return (
    <section className="blk-enquiry section-pad" id="enquire">
      <div className="shell">
        {heading ? <h2>{heading}</h2> : null}
        {intro ? <p className="blk-intro">{intro}</p> : null}

        <EnquiryFormFields
          consentText={consentText}
          successMessage={successMessage}
          tripId={tripId ?? undefined}
        />
      </div>
    </section>
  )
}
