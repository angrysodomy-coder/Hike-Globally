import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/lib/access'
import { slugField } from '@/fields/slug'
import { buildRevalidateDeleteHook, buildRevalidateSimpleHook } from '@/hooks/revalidate'

export const Destinations: CollectionConfig = {
  slug: 'destinations',
  admin: { useAsTitle: 'title', group: 'Travel' },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [buildRevalidateSimpleHook({ pathPrefix: '/destinations', tag: 'destinations' })],
    afterDelete: [buildRevalidateDeleteHook({ pathPrefix: '/destinations', tag: 'destinations' })],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField(),
    { name: 'country', type: 'text', required: true, defaultValue: 'Nepal' },
    { name: 'region', type: 'text', admin: { description: 'e.g. Everest Region, Annapurna' } },
    { name: 'summary', type: 'textarea', maxLength: 300 },
    { name: 'description', type: 'richText' },
    { name: 'heroImage', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'coordinates',
      type: 'group',
      fields: [
        { name: 'lat', type: 'number', min: -90, max: 90 },
        { name: 'lng', type: 'number', min: -180, max: 180 },
      ],
    },
  ],
}
