import type { Block } from 'payload'

/**
 * A single trip card dropped inside an article.
 *
 * This is the highest-converting module on a travel blog: a reader two-thirds
 * of the way through "Best summer treks for families" is the warmest traffic
 * the site gets. It stores a relationship, never copied title/price text, so
 * the card can never advertise last season's price.
 */
export const TripCardBlock: Block = {
  slug: 'tripCard',
  interfaceName: 'TripCardBlock',
  labels: { singular: 'Trip card', plural: 'Trip cards' },
  fields: [
    { name: 'trip', type: 'relationship', relationTo: 'trips', required: true, maxDepth: 1 },
    {
      name: 'layout',
      type: 'select',
      required: true,
      defaultValue: 'horizontal',
      options: [
        { label: 'Horizontal (inline with prose)', value: 'horizontal' },
        { label: 'Full-bleed card', value: 'full' },
      ],
    },
    {
      name: 'note',
      type: 'text',
      admin: { description: 'Optional editorial line: "The one we recommend for first-timers."' },
    },
  ],
}
