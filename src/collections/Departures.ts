import type { CollectionBeforeChangeHook, CollectionConfig, NumberField } from 'payload'

import { anyone, authenticated } from '@/access'
import { revalidateDeparture, revalidateDepartureDelete } from '@/hooks/revalidate'

/**
 * ── Why a separate collection and not an array on the trip ───────────────
 *
 * 1. Write contention. Operations update availability daily. An array field
 *    means rewriting the entire trip document — and minting a new version —
 *    every time somebody books a seat.
 * 2. Cross-trip queries. "Every departure in the next 60 days with places
 *    left" is one indexed query here, and a full scan over JSON there.
 * 3. Access control. Operations staff own departures without gaining edit
 *    rights over trip copy.
 * 4. Revalidation granularity. Selling the last place on one date should not
 *    invalidate the whole catalogue.
 *
 * The `join` field on Trips gives editors the array-like UX anyway, so none
 * of that costs usability.
 *
 * This also replaces `buildDepartures(trip, from = new Date())`, which
 * generated dates with a hash at RENDER time. That is a hydration bug — the
 * server and the browser call `new Date()` at different moments — as well as
 * availability that silently changes at midnight (pitfall 1).
 */

/**
 * Derives `endDate` and `status` so operations only ever type a start date and
 * a number of places left.
 */
const deriveDepartureFields: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const tripRef = data?.trip ?? originalDoc?.trip
  const tripId = tripRef && typeof tripRef === 'object' ? tripRef.id : tripRef

  /**
   * Fall back to `originalDoc.startDate`, because a PATCH that only touches
   * `spotsRemaining` carries no `startDate` — and the plan's version skips the
   * whole derivation in that case, so a trip whose duration changed would keep
   * a stale `endDate` forever.
   */
  const startDate = data?.startDate ?? originalDoc?.startDate

  if (tripId && startDate) {
    const trip = await req.payload.findByID({
      collection: 'trips',
      depth: 0,
      id: tripId,
      req,
      select: { durationDays: true },
    })

    // A 15-day trek leaving on the 1st ends on the 15th, not the 16th.
    const end = new Date(startDate)
    end.setUTCDate(end.getUTCDate() + Math.max(0, (trip?.durationDays ?? 1) - 1))
    data.endDate = end.toISOString()
  }

  /**
   * Status is derived from inventory — EXCEPT when the departure has been
   * cancelled, which is a human decision no amount of remaining capacity
   * should override.
   *
   * Reading the status from `data ?? originalDoc` matters: on a partial update
   * `data.status` is undefined, so checking only `data.status !== 'cancelled'`
   * (as the plan does) would quietly resurrect a cancelled departure as
   * "available" the next time anyone edited its note.
   */
  const currentStatus = data?.status ?? originalDoc?.status

  if (currentStatus !== 'cancelled') {
    const remaining = Number(data?.spotsRemaining ?? originalDoc?.spotsRemaining ?? 0)
    data.status = remaining <= 0 ? 'sold-out' : remaining <= 3 ? 'limited' : 'available'
  } else {
    data.status = 'cancelled'
  }

  return data
}

/**
 * Extracted rather than written inline because a field literal nested inside
 * `tabs` → `row` → `fields` is contextually typed as the whole `Field` union,
 * and TypeScript cannot then infer the `validate` signature — `siblingData`
 * comes through as an implicit `any` and fails under `strict`. Annotating the
 * field as `NumberField` restores inference without casting anything.
 */
const spotsRemainingField: NumberField = {
  name: 'spotsRemaining',
  type: 'number',
  required: true,
  defaultValue: 8,
  min: 0,
  admin: { width: '33%' },
  validate: (value, { siblingData }) => {
    const total = (siblingData as { spotsTotal?: null | number })?.spotsTotal

    if (typeof value === 'number' && typeof total === 'number' && value > total) {
      return `Cannot have more places remaining (${value}) than the ${total} on offer.`
    }

    return true
  },
}

export const Departures: CollectionConfig<'departures'> = {
  slug: 'departures',
  labels: { singular: 'Departure', plural: 'Departures' },

  admin: {
    useAsTitle: 'startDate',
    defaultColumns: ['trip', 'startDate', 'status', 'spotsRemaining', 'price'],
    description:
      'Every bookable date. Operations can edit these without touching trip content.',
    group: 'Operations',
    // A departure is inventory, never a link target.
    enableRichTextLink: false,
  },

  access: {
    // Public: the booking calendar on every trip page reads these anonymously.
    // There is no draft concept here — an unsellable date is `cancelled`, not
    // unpublished.
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },

  /**
   * The plan lists `currency` here, but there is no currency field on a
   * departure and there should not be — `price` is an override of the trip's
   * base price and inherits the trip's currency. Two currencies for one
   * product is how you end up selling a $4,200 trek for €4,200.
   */
  defaultPopulate: {
    endDate: true,
    guaranteed: true,
    note: true,
    price: true,
    spotsRemaining: true,
    startDate: true,
    status: true,
  },

  /**
   * One departure per trip per start date. Without this, a double-submit in
   * the admin or a re-run of the seed script silently creates two rows for the
   * same date and the calendar renders it twice with different availability.
   */
  indexes: [{ fields: ['trip', 'startDate'], unique: true }],

  fields: [
    {
      name: 'trip',
      type: 'relationship',
      relationTo: 'trips',
      required: true,
      index: true,
      maxDepth: 0,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          index: true,
          admin: {
            width: '50%',
            // dayOnly + a fixed display format. A trek leaving "15 October"
            // must read 15 October in Melbourne and in Denver (pitfall 9).
            date: { displayFormat: 'd MMM yyyy', pickerAppearance: 'dayOnly' },
          },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            width: '50%',
            date: { displayFormat: 'd MMM yyyy', pickerAppearance: 'dayOnly' },
            description: 'Derived from the trip duration.',
            readOnly: true,
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'spotsTotal',
          type: 'number',
          required: true,
          defaultValue: 8,
          min: 1,
          admin: { width: '33%' },
        },
        spotsRemainingField,
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'available',
          options: [
            { label: 'Available', value: 'available' },
            { label: 'Limited places', value: 'limited' },
            { label: 'Sold out', value: 'sold-out' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
          admin: {
            width: '33%',
            description:
              'Derived from places remaining. Set to Cancelled to pull a date from sale regardless of capacity.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          min: 0,
          admin: {
            width: '50%',
            description: 'Overrides the trip base price for this date. Leave empty to inherit.',
          },
        },
        {
          name: 'guaranteed',
          type: 'checkbox',
          label: 'Guaranteed departure',
          admin: { width: '50%', description: 'Runs even if it does not fill.' },
        },
      ],
    },
    {
      name: 'isPrivate',
      type: 'checkbox',
      label: 'Private departure (hidden from the public calendar)',
    },
    {
      name: 'note',
      type: 'text',
      admin: { description: 'Shown on the calendar, e.g. "Festival dates — book early".' },
    },
  ],

  hooks: {
    beforeChange: [deriveDepartureFields],
    afterChange: [revalidateDeparture],
    afterDelete: [revalidateDepartureDelete],
  },
}
