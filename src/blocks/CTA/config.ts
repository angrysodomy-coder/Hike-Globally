import type { Block } from 'payload'

import { LINKABLE_COLLECTIONS } from '@/collections/linkable'
import { artDirectedImage } from '@/fields/artDirectedImage'
import { linkField } from '@/fields/link'

/** The closing band on every landing page. */
export const CTABlock: Block = {
  slug: 'cta',
  interfaceName: 'CTABlock',
  labels: { singular: 'Call to action', plural: 'Calls to action' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea', maxLength: 400 },
    {
      name: 'theme',
      type: 'select',
      required: true,
      defaultValue: 'dark',
      options: [
        { label: 'Dark band', value: 'dark' },
        { label: 'Light band', value: 'light' },
        { label: 'Photographic (parallax)', value: 'photo' },
      ],
    },
    {
      ...artDirectedImage('background', 'Background image'),
      admin: { condition: (_, siblingData) => siblingData?.theme === 'photo' },
    },
    {
      name: 'links',
      type: 'array',
      maxRows: 2,
      minRows: 1,
      admin: { components: { RowLabel: '@/components/admin/LinkRowLabel#LinkRowLabel' } },
      fields: [linkField({ relationTo: [...LINKABLE_COLLECTIONS] })],
    },
  ],
}
