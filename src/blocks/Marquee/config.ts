import type { Block } from 'payload'

/** The scrolling word band — `destinationMarquee` / `tripsMarquee`. */
export const MarqueeBlock: Block = {
  slug: 'marquee',
  interfaceName: 'MarqueeBlock',
  labels: { singular: 'Marquee', plural: 'Marquees' },
  fields: [
    {
      name: 'items',
      type: 'array',
      minRows: 2,
      maxRows: 24,
      admin: { components: { RowLabel: '@/components/admin/TextRowLabel#TextRowLabel' } },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'speed',
          type: 'select',
          required: true,
          defaultValue: 'medium',
          options: [
            { label: 'Slow', value: 'slow' },
            { label: 'Medium', value: 'medium' },
            { label: 'Fast', value: 'fast' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'theme',
          type: 'select',
          required: true,
          defaultValue: 'dark',
          options: [
            { label: 'Dark', value: 'dark' },
            { label: 'Light', value: 'light' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
  ],
}
