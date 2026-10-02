import type { CollectionConfig } from 'payload'
import { authenticated } from '@/lib/access'
import { syncInquiryToCrm } from '@/hooks/syncInquiryToCrm'

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  admin: {
    useAsTitle: 'name',
    group: 'Bookings',
    defaultColumns: ['name', 'email', 'trip', 'status', 'createdAt'],
    description: 'Booking inquiries submitted from the website contact form.',
  },
  access: {
    // Public create is CLOSED: the only write path is the server action, which
    // uses the Local API (overrideAccess) after validation + honeypot checks.
    // This removes the REST endpoint as a spam surface entirely.
    create: () => false,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [
      syncInquiryToCrm,
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc
        const to = process.env.INQUIRY_NOTIFY_EMAIL
        if (!to) return doc

        // Email must never break the submission — log failures instead.
        try {
          let tripTitle = ''
          if (doc.trip) {
            const trip = await req.payload.findByID({
              collection: 'trips',
              id: typeof doc.trip === 'object' ? doc.trip.id : doc.trip,
              depth: 0,
            })
            tripTitle = trip?.title ?? ''
          }

          await req.payload.sendEmail({
            to,
            subject: `New inquiry: ${doc.name}${tripTitle ? ` — ${tripTitle}` : ''}`,
            html: [
              `<h2>New booking inquiry</h2>`,
              `<p><strong>Name:</strong> ${doc.name}</p>`,
              `<p><strong>Email:</strong> ${doc.email}</p>`,
              doc.phone ? `<p><strong>Phone:</strong> ${doc.phone}</p>` : '',
              doc.country ? `<p><strong>Country:</strong> ${doc.country}</p>` : '',
              tripTitle ? `<p><strong>Trip:</strong> ${tripTitle}</p>` : '',
              doc.preferredDate ? `<p><strong>Preferred date:</strong> ${doc.preferredDate}</p>` : '',
              typeof doc.adults === 'number' ? `<p><strong>Travellers:</strong> ${doc.adults} adult(s)${typeof doc.children === 'number' ? `, ${doc.children} child(ren)` : ''}</p>` : '',
              `<p><strong>Message:</strong></p><p>${String(doc.message ?? '').replace(/</g, '&lt;')}</p>`,
            ]
              .filter(Boolean)
              .join('\n'),
          })
        } catch (err) {
          req.payload.logger.error({ err, msg: 'Failed to send inquiry notification email' })
        }
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text' },
        { name: 'country', type: 'text' },
      ],
    },
    {
      name: 'trip',
      type: 'relationship',
      relationTo: 'trips',
      admin: { description: 'Trip the visitor asked about, if any.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'preferredDate',
          type: 'date',
          admin: { description: 'Requested or pre-selected departure date.' },
        },
        { name: 'adults', type: 'number', min: 1, defaultValue: 1 },
        { name: 'children', type: 'number', min: 0, defaultValue: 0 },
      ],
    },
    { name: 'message', type: 'textarea', required: true },
    // --- Ops workflow fields (sidebar) ---
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Converted', value: 'converted' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      admin: { position: 'sidebar', description: 'Internal notes — never shown publicly.' },
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Page the inquiry was submitted from.',
      },
    },
  ],
}
