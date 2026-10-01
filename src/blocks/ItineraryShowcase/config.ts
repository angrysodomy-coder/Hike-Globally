import type { Block } from 'payload'

/**
 * The sticky signature-journey itinerary on `/trips`.
 *
 * "Mirror a trip" is the default because an itinerary typed into a page block
 * is a second copy of data that already exists — and the copy is the one that
 * goes stale when the route changes.
 */
export const ItineraryShowcaseBlock: Block = {
  slug: 'itineraryShowcase',
  interfaceName: 'ItineraryShowcaseBlock',
  labels: { singular: 'Itinerary showcase', plural: 'Itinerary showcases' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'intro', type: 'textarea', maxLength: 400 },
    {
      name: 'source',
      type: 'radio',
      required: true,
      defaultValue: 'trip',
      options: [
        { label: "Mirror a trip's itinerary", value: 'trip' },
        { label: 'Write it here', value: 'manual' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'trip',
      type: 'relationship',
      relationTo: 'trips',
      maxDepth: 1,
      admin: { condition: (_, siblingData) => siblingData?.source === 'trip' },
    },
    {
      name: 'days',
      type: 'array',
      maxRows: 30,
      labels: { singular: 'Day', plural: 'Days' },
      admin: {
        initCollapsed: true,
        components: { RowLabel: '@/components/admin/ItineraryRowLabel#ItineraryRowLabel' },
        condition: (_, siblingData) => siblingData?.source === 'manual',
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          type: 'row',
          fields: [
            { name: 'altitudeMetres', type: 'number', admin: { width: '50%' } },
            { name: 'walkingHours', type: 'text', admin: { width: '50%' } },
          ],
        },
        { name: 'body', type: 'textarea', maxLength: 600 },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
