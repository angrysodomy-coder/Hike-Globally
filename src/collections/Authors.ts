import type { CollectionConfig, FieldHook } from 'payload'

import { anyone, authenticated } from '@/access'
import { slugField } from '@/fields/slug'

/**
 * Guides double as article authors and trip bylines — the `tripAuthors` data
 * in the legacy Vite content. One collection rather than two, because the same
 * person is the lead guide on Everest Base Camp and the byline on the article
 * about it, and duplicating them means two bios to keep in sync.
 *
 * Deliberately NOT the `users` collection: an author is a public profile with
 * a photo and a bio; a user is a login. Most of your guides will never have an
 * admin account, and the ones who do should not have their email address
 * become a public field.
 */

/** "Pemba Sherpa" → "PS". Avatar fallback when there is no photo. */
const deriveInitials: FieldHook = ({ data, value }) => {
  if (typeof value === 'string' && value.trim()) return value.trim().toUpperCase()

  return String(data?.name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export const Authors: CollectionConfig<'authors'> = {
  slug: 'authors',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'yearsGuiding', 'updatedAt'],
    group: 'People',
  },

  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },

  defaultPopulate: { name: true, slug: true, initials: true, photo: true, role: true },

  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'text',
      required: true,
      admin: { description: 'e.g. "Lead mountain guide · 19 Himalayan seasons"' },
    },
    {
      name: 'initials',
      type: 'text',
      maxLength: 3,
      admin: {
        description: 'Fallback avatar when no photo is set. Derived from the name if left blank.',
      },
      hooks: { beforeChange: [deriveInitials] },
    },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'bio', type: 'richText' },
    {
      name: 'languages',
      type: 'text',
      hasMany: true,
      admin: { description: 'Languages this guide leads in. Press enter between each.' },
    },
    { name: 'yearsGuiding', type: 'number', min: 0 },
    slugField('name'),
  ],
}
