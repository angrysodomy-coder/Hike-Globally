import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { slugField } from '@/fields/slug'

/**
 * Journal taxonomy — "Trail notes", "Gear", "Culture", "Trip planning".
 *
 * No drafts and `read: anyone`: a category is a label, not editorial content,
 * and a half-finished one is harmless. Note that `publishedOrAuthenticated`
 * would actually be a bug here — it filters on `_status`, which only exists on
 * collections with drafts enabled, so every public read would return nothing.
 */
export const Categories: CollectionConfig<'categories'> = {
  slug: 'categories',

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'Journal',
  },

  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },

  defaultPopulate: { slug: true, title: true },

  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Shown at the top of the category archive, and used as its SEO text.' },
    },
    slugField(),
  ],
}
