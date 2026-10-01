'use client'

import React, { useActionState, useRef } from 'react'
import { useFormStatus } from 'react-dom'

import type { EnquiryState } from './actions'

import { submitEnquiry } from './actions'

function SubmitButton() {
  // `useFormStatus` must be called from a CHILD of the form, not the form
  // component itself — in the same component it always reads false.
  const { pending } = useFormStatus()

  return (
    <button className="blk-btn blk-btn--primary" disabled={pending} type="submit">
      {pending ? 'Sending…' : 'Send enquiry'}
    </button>
  )
}

export function EnquiryFormFields({
  consentText,
  successMessage,
  tripId,
}: {
  consentText: string
  successMessage: string
  tripId?: number
}) {
  const [state, action] = useActionState<EnquiryState, FormData>(submitEnquiry, {})
  // Captured at first render, so it measures how long the form was on screen.
  const startedAt = useRef(Date.now())

  if (state.ok) {
    return (
      <p className="blk-enquiry__success" role="status">
        {successMessage}
      </p>
    )
  }

  return (
    <form action={action} className="blk-enquiry__form">
      {/* Bot traps. Hidden from humans and from assistive tech. */}
      <input
        aria-hidden="true"
        autoComplete="off"
        className="blk-enquiry__hp"
        name="website"
        tabIndex={-1}
      />
      <input name="startedAt" type="hidden" value={startedAt.current} />
      {tripId ? <input name="trip" type="hidden" value={tripId} /> : null}

      <div className="blk-enquiry__row">
        <label className="tsp-field">
          <span>Your name</span>
          <input autoComplete="name" name="name" required type="text" />
          {state.fieldErrors?.name ? <em>{state.fieldErrors.name}</em> : null}
        </label>

        <label className="tsp-field">
          <span>Email</span>
          <input autoComplete="email" name="email" required type="email" />
          {state.fieldErrors?.email ? <em>{state.fieldErrors.email}</em> : null}
        </label>
      </div>

      <div className="blk-enquiry__row">
        <label className="tsp-field">
          <span>Phone (optional)</span>
          <input autoComplete="tel" name="phone" type="tel" />
        </label>

        <label className="tsp-field">
          <span>Country (optional)</span>
          <input autoComplete="country-name" name="country" type="text" />
        </label>
      </div>

      <div className="blk-enquiry__row">
        <label className="tsp-field">
          <span>Travellers</span>
          <input defaultValue={2} min={1} name="travellers" type="number" />
        </label>

        <label className="tsp-field">
          <span>Preferred date</span>
          <input name="preferredDate" type="date" />
        </label>
      </div>

      <label className="tsp-field">
        <span>Anything we should know?</span>
        <textarea name="message" rows={4} />
      </label>

      <label className="blk-enquiry__consent">
        <input name="consent" type="checkbox" />
        <span>{consentText}</span>
      </label>
      {state.fieldErrors?.consent ? (
        <em className="blk-enquiry__error">{state.fieldErrors.consent}</em>
      ) : null}

      {state.error ? (
        <p className="blk-enquiry__error" role="alert">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  )
}
