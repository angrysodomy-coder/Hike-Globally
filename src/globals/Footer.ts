import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { LINKABLE_COLLECTIONS } from '@/collections/linkable'
import { linkField } from '@/fields/link'
import { revalidateGlobal } from '@/hooks/revalidate'

export const Footer: GlobalConfig = {
  slug: 'footer',

  admin: { group: 'Site' },

  access: { read: anyone, update: authenticated },

  fields: [
    {
      name: 'columns',
      type: 'array',
      maxRows: 4,
      labels: { singular: 'Column', plural: 'Columns' },
      admin: {
        initCollapsed: true,
        components: { RowLabel: '@/components/admin/TitleRowLabel#TitleRowLabel' },
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'links',
          type: 'array',
          maxRows: 8,
          admin: { components: { RowLabel: '@/components/admin/LinkRowLabel#LinkRowLabel' } },
          fields: [linkField({ relationTo: [...LINKABLE_COLLECTIONS] })],
        },
      ],
    },
    {
      name: 'newsletter',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text', defaultValue: 'Dispatches from the trail' },
        { name: 'body', type: 'textarea', maxLength: 300 },
        { name: 'ctaLabel', type: 'text', defaultValue: 'Subscribe' },
        {
          name: 'consentText',
          type: 'text',
          defaultValue: 'No more than one email a month. Unsubscribe any time.',
        },
      ],
    },
    {
      name: 'certifications',
      type: 'array',
      maxRows: 6,
      admin: {
        components: { RowLabel: '@/components/admin/TitleRowLabel#TitleRowLabel' },
        description: 'Trade body and licence marks — NMA, TAAN, Nepal Tourism Board.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'title', type: 'text', required: true, admin: { width: '50%' } },
            { name: 'logo', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
          ],
        },
        { name: 'url', type: 'text' },
      ],
    },
    {
      name: 'legalLine',
      type: 'text',
      admin: { description: 'Company registration and licence numbers. Shown in the bottom rule.' },
    },
    {
      name: 'legalLinks',
      type: 'array',
      maxRows: 5,
      admin: { components: { RowLabel: '@/components/admin/LinkRowLabel#LinkRowLabel' } },
      fields: [linkField({ relationTo: [...LINKABLE_COLLECTIONS] })],
    },
  ],

  hooks: { afterChange: [revalidateGlobal('footer')] },

  versions: { drafts: false, max: 20 },
}
