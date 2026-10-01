import type { Block } from 'payload'

/** The journal teaser grid — `JournalSection.jsx`. */
export const PostFeedBlock: Block = {
  slug: 'postFeed',
  interfaceName: 'PostFeedBlock',
  labels: { singular: 'Journal feed', plural: 'Journal feeds' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'From the journal' },
    { name: 'intro', type: 'textarea', maxLength: 400 },
    {
      name: 'source',
      type: 'radio',
      required: true,
      defaultValue: 'auto',
      options: [
        { label: 'Automatic (most recent)', value: 'auto' },
        { label: 'Hand-picked', value: 'manual' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'auto',
        description: 'Leave empty for every category.',
      },
    },
    {
      name: 'posts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      maxDepth: 1,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'limit',
          type: 'number',
          defaultValue: 3,
          max: 12,
          min: 1,
          admin: { width: '50%' },
        },
        {
          name: 'layout',
          type: 'select',
          required: true,
          defaultValue: 'grid',
          options: [
            { label: 'Grid', value: 'grid' },
            { label: 'List', value: 'list' },
            { label: 'Lead story + list', value: 'lead' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
  ],
}
