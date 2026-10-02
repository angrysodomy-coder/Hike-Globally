'use client'

import React, { useActionState } from 'react'
import { submitInquiry, type InquiryFormState } from '@/actions/submitInquiry'

export type TripOption = { id: number; title: string }

type Props = {
  trips: TripOption[]
  /** Preselected trip id (from ?trip= deep links on TripDetail Enquire buttons). */
  defaultTripId?: number
  /** Pre-filled departure date (from ?departure=). */
  defaultDate?: string
}

const initialState: InquiryFormState = { status: 'idle', message: '' }

const inputCls =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'
const labelCls = 'block text-sm font-medium text-gray-700'
// Brand palette has no red: form errors use the warm amber (--tsp-amber).
const errorCls = 'mt-1 text-xs text-amber-700'

export const InquiryForm: React.FC<Props> = ({ trips, defaultTripId, defaultDate }) => {
  const [state, formAction, pending] = useActionState(submitInquiry, initialState)

  if (state.status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-lg font-semibold text-emerald-800">{state.message}</p>
        <p className="mt-2 text-sm text-emerald-700">
          A confirmation has been noted — check your inbox soon.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {/* Honeypot — hidden from humans, irresistible to bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelCls}>
            Full name *
          </label>
          <input id="name" name="name" type="text" required className={inputCls} />
          {state.errors?.name && <p className={errorCls}>{state.errors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>
            Email *
          </label>
          <input id="email" name="email" type="email" required className={inputCls} />
          {state.errors?.email && <p className={errorCls}>{state.errors.email}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={labelCls}>
            Phone / WhatsApp
          </label>
          <input id="phone" name="phone" type="tel" className={inputCls} />
        </div>
        <div>
          <label htmlFor="country" className={labelCls}>
            Country
          </label>
          <input id="country" name="country" type="text" className={inputCls} />
        </div>
      </div>

      <div>
        <label htmlFor="trip" className={labelCls}>
          Which trip are you interested in?
        </label>
        <select id="trip" name="trip" defaultValue={defaultTripId ?? ''} className={inputCls}>
          <option value="">Not sure yet / general inquiry</option>
          {trips.map((trip) => (
            <option key={trip.id} value={trip.id}>
              {trip.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="preferredDate" className={labelCls}>
            Preferred start date
          </label>
          <input
            id="preferredDate"
            name="preferredDate"
            type="date"
            defaultValue={defaultDate}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="adults" className={labelCls}>
            Adults *
          </label>
          <input
            id="adults"
            name="adults"
            type="number"
            min={1}
            defaultValue={2}
            required
            className={inputCls}
          />
          {state.errors?.adults && <p className={errorCls}>{state.errors.adults}</p>}
        </div>
        <div>
          <label htmlFor="children" className={labelCls}>
            Children
          </label>
          <input
            id="children"
            name="children"
            type="number"
            min={0}
            defaultValue={0}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="message" className={labelCls}>
          Your message *
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          placeholder="Dates, group details, fitness level, questions — anything that helps us help you."
          className={inputCls}
        />
        {state.errors?.message && <p className={errorCls}>{state.errors.message}</p>}
      </div>

      {state.status === 'error' && !state.errors && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pending ? 'Sending…' : 'Send inquiry'}
      </button>
    </form>
  )
}
