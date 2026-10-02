import type { GlobalConfig } from 'payload'
import { anyone, authenticated } from '@/lib/access'
import { revalidateGlobal } from '@/hooks/revalidate'

export const Header: GlobalConfig = {
  slug: 'header',
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [revalidateGlobal('global-header')] },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      maxRows: 8,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
  ],
}
