import type { Block } from 'payload'

/** The "what's included" feature columns — `tripInclusions`. */
export const InclusionsBlock: Block = {
  slug: 'inclusions',
  interfaceName: 'InclusionsBlock',
  labels: { singular: 'Inclusions', plural: 'Inclusions sections' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'intro', type: 'textarea', maxLength: 400 },
    {
      name: 'items',
      type: 'array',
      minRows: 2,
      maxRows: 8,
      admin: {
        initCollapsed: true,
        components: { RowLabel: '@/components/admin/TitleRowLabel#TitleRowLabel' },
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true, maxLength: 400 },
        {
          name: 'icon',
          type: 'select',
          options: [
            { label: 'Guide', value: 'guide' },
            { label: 'Lodging', value: 'lodging' },
            { label: 'Meals', value: 'meals' },
            { label: 'Permits', value: 'permits' },
            { label: 'Transport', value: 'transport' },
            { label: 'Safety', value: 'safety' },
            { label: 'Porter', value: 'porter' },
            { label: 'Community', value: 'community' },
          ],
          admin: { description: 'Drawn from the icon set — no uploads needed.' },
        },
      ],
    },
  ],
}
