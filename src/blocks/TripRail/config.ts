import type { Block } from 'payload'

/** The horizontal scroll-snap rail — `TreksSection.jsx`, "Trails worth taking". */
export const TripRailBlock: Block = {
  slug: 'tripRail',
  interfaceName: 'TripRailBlock',
  labels: { singular: 'Trip rail', plural: 'Trip rails' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'intro', type: 'textarea', maxLength: 400 },
    {
      name: 'source',
      type: 'radio',
      required: true,
      defaultValue: 'auto',
      options: [
        { label: 'Automatic (trips flagged for the rail)', value: 'auto' },
        { label: 'Hand-picked', value: 'manual' },
      ],
      admin: {
        layout: 'horizontal',
        description:
          'Automatic uses every trip with "Show in the Trails worth taking rail" ticked, ordered by its rail order.',
      },
    },
    {
      name: 'trips',
      type: 'relationship',
      relationTo: 'trips',
      hasMany: true,
      maxDepth: 1,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
    },
    { name: 'limit', type: 'number', defaultValue: 8, max: 16, min: 2 },
  ],
}
