import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { LINKABLE_COLLECTIONS } from '@/collections/linkable'
import { linkField } from '@/fields/link'
import { revalidateGlobal } from '@/hooks/revalidate'

/**
 * Concept — a global is a singleton document. Exactly one Header, one Footer,
 * one Settings. Same fields, hooks, versions and access as a collection, but
 * no list view and no id to look up.
 */
export const Header: GlobalConfig = {
  slug: 'header',

  admin: { group: 'Site' },

  access: { read: anyone, update: authenticated },

  fields: [
    {
      name: 'navItems',
      type: 'array',
      maxRows: 8,
      admin: {
        components: { RowLabel: '@/components/admin/LinkRowLabel#LinkRowLabel' },
        description: 'The fullscreen navigation. Eight items is already more than anyone reads.',
      },
      fields: [
        linkField({ relationTo: [...LINKABLE_COLLECTIONS] }),
        {
          name: 'children',
          type: 'array',
          maxRows: 8,
          labels: { singular: 'Sub-item', plural: 'Sub-items' },
          admin: {
            components: { RowLabel: '@/components/admin/LinkRowLabel#LinkRowLabel' },
            description: 'Optional dropdown.',
          },
          fields: [linkField({ relationTo: [...LINKABLE_COLLECTIONS] })],
        },
      ],
    },
    { name: 'ctaLabel', type: 'text', defaultValue: 'Plan your journey' },
  ],

  hooks: { afterChange: [revalidateGlobal('header')] },

  versions: { drafts: false, max: 20 },
}
