import type { Block } from 'payload'

/** The bento tile grid of regions — `DestinationsSection.jsx`. */
export const DestinationBentoBlock: Block = {
  slug: 'destinationBento',
  interfaceName: 'DestinationBentoBlock',
  labels: { singular: 'Destination bento', plural: 'Destination bentos' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'intro', type: 'textarea', maxLength: 400 },
    {
      name: 'source',
      type: 'radio',
      required: true,
      defaultValue: 'auto',
      options: [
        { label: 'Automatic (all, by display order)', value: 'auto' },
        { label: 'Hand-picked', value: 'manual' },
      ],
      admin: {
        layout: 'horizontal',
        description:
          'Automatic respects each destination\'s own display order and tile size, so adding a region needs no page edit.',
      },
    },
    {
      name: 'destinations',
      type: 'relationship',
      relationTo: 'destinations',
      hasMany: true,
      maxDepth: 1,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
    },
  ],
}
