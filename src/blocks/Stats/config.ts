import type { Block } from 'payload'

/** The animated counter band — `destinationStats` / `tripStats`. */
export const StatsBlock: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
  labels: { singular: 'Stats band', plural: 'Stats bands' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      minRows: 2,
      maxRows: 4,
      labels: { singular: 'Stat', plural: 'Stats' },
      admin: { components: { RowLabel: '@/components/admin/TitleRowLabel#TitleRowLabel' } },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'value',
              type: 'number',
              required: true,
              admin: { width: '25%', description: 'The number only — it counts up to this.' },
            },
            {
              name: 'suffix',
              type: 'text',
              admin: { width: '25%', description: '"+", "%", "m", "k"…' },
            },
            { name: 'label', type: 'text', required: true, admin: { width: '50%' } },
          ],
        },
        { name: 'note', type: 'text' },
      ],
    },
    {
      name: 'animate',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Count up when the band scrolls into view. Automatically disabled for visitors with prefers-reduced-motion.',
      },
    },
  ],
}
