import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { authenticated, isAdmin, isAdminField } from '@/access'

/**
 * Booking leads from the site.
 *
 * Note the access shape: anonymous `create`, authenticated `read`. That is
 * deliberately lopsided — the public form must be able to POST, and must not
 * be able to list everyone else's enquiries back out.
 *
 * Collection access is NOT your spam defence (pitfall 14). A public create
 * endpoint attracts bots within days. The route handler in front of this needs
 * a honeypot field, a minimum time-to-submit check, and a rate limit. This
 * config only guarantees that a bot cannot read your pipeline.
 */

/** Notifies the bookings inbox. Failure must never fail the enquiry itself. */
const notifyOperations: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  const to = process.env.ENQUIRY_NOTIFICATION_EMAIL
  if (!to) return doc

  const tripTitle =
    doc.trip && typeof doc.trip === 'object' ? (doc.trip.title as string) : doc.trip

  try {
    await req.payload.sendEmail({
      subject: `New enquiry — ${doc.name}${tripTitle ? ` · ${tripTitle}` : ''}`,
      text: [
        `Name: ${doc.name}`,
        `Email: ${doc.email}`,
        `Phone: ${doc.phone ?? '—'}`,
        `Country: ${doc.country ?? '—'}`,
        `Travellers: ${doc.travellers ?? '—'}`,
        `Preferred date: ${doc.preferredDate ?? '—'}`,
        `Source: ${doc.source ?? '—'}`,
        '',
        doc.message ?? '',
      ].join('\n'),
      to,
    })
  } catch (error) {
    // Swallow it. The lead is already saved; a dead Resend key must not turn
    // into a 500 for someone trying to book a trek.
    req.payload.logger.error({ err: error }, 'Failed to send enquiry notification')
  }

  return doc
}

export const Enquiries: CollectionConfig<'enquiries'> = {
  slug: 'enquiries',
  labels: { singular: 'Enquiry', plural: 'Enquiries' },

  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'trip', 'preferredDate', 'status', 'createdAt'],
    description: 'Every booking enquiry submitted from the site.',
    enableRichTextLink: false,
    group: 'Operations',
  },

  access: {
    // The public route handler creates these with `overrideAccess: false`, so
    // anonymous create must be allowed here — and ONLY create.
    create: () => true,
    read: authenticated,
    update: authenticated,
    delete: isAdmin,
  },

  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'email', type: 'email', required: true, index: true, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text', admin: { width: '50%' } },
        { name: 'country', type: 'text', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'trip',
          type: 'relationship',
          relationTo: 'trips',
          maxDepth: 1,
          admin: { width: '50%' },
        },
        {
          name: 'departure',
          type: 'relationship',
          relationTo: 'departures',
          maxDepth: 1,
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'travellers',
          type: 'number',
          defaultValue: 2,
          max: 40,
          min: 1,
          admin: { width: '33%' },
        },
        {
          name: 'preferredDate',
          type: 'date',
          admin: { width: '33%', date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'new',
          options: [
            { label: 'New', value: 'new' },
            { label: 'Contacted', value: 'contacted' },
            { label: 'Quoted', value: 'quoted' },
            { label: 'Booked', value: 'booked' },
            { label: 'Lost', value: 'lost' },
          ],
          admin: { width: '33%' },
        },
      ],
    },
    { name: 'message', type: 'textarea', maxLength: 4000 },
    {
      name: 'consent',
      type: 'checkbox',
      required: true,
      admin: { description: 'Explicit consent to be contacted. Required for GDPR.' },
      /**
       * `required: true` is NOT enough on a checkbox.
       *
       * Payload treats a checkbox as "present" when it is `false`, so
       * `required` only rejects `undefined` — a POST of
       * `{"consent": false}`, or one omitting the field entirely, was being
       * accepted with a 201. For a lawful-basis field that is the whole
       * point of the control, so it is enforced explicitly here rather than
       * only in the form that happens to sit in front of it.
       */
      validate: (value: boolean | null | undefined) =>
        value === true || 'Consent is required before we can store an enquiry.',
    },
    {
      name: 'source',
      type: 'text',
      admin: { description: 'Page the enquiry came from.', readOnly: true },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      // Field-level access: an operations user can work the lead, but the
      // commercial notes on it stay with admins.
      access: { read: isAdminField, update: isAdminField },
      admin: { description: 'Never shown to the customer.' },
    },
  ],

  hooks: { afterChange: [notifyOperations] },

  timestamps: true,
}
