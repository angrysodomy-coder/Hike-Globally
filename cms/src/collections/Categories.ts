import type { CollectionConfig } from 'payload'
import { isAdmin, publicRead } from '../access'
import { slugField } from '../fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    read: publicRead,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'type', 'updatedAt'],
    description: 'Categories for organizing journeys and journal articles.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    slugField('name'),
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'trip',
      options: [
        { label: 'Trip / Journey', value: 'trip' },
        { label: 'Blog / Journal', value: 'blog' },
      ],
      admin: {
        description: 'Whether this category applies to trips or journal articles.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Brief description of what this category covers.',
      },
    },
  ],
}
