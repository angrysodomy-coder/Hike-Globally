import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/lib/access'
import { slugField } from '@/fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { useAsTitle: 'title', group: 'Content' },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [{ name: 'title', type: 'text', required: true }, slugField()],
}
