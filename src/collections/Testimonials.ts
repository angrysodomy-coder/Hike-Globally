import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/lib/access'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: { useAsTitle: 'authorName', group: 'Content' },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    { name: 'authorName', type: 'text', required: true },
    { name: 'authorLocation', type: 'text', admin: { description: 'e.g. Sydney, Australia' } },
    { name: 'rating', type: 'number', min: 1, max: 5, defaultValue: 5 },
    { name: 'trip', type: 'relationship', relationTo: 'trips' },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
  ],
}
