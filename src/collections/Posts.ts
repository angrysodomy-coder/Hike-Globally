import type { CollectionConfig } from 'payload'
import { authenticated, authenticatedOrPublished } from '@/lib/access'
import { slugField } from '@/fields/slug'
import { buildRevalidateHook, buildRevalidateDeleteHook } from '@/hooks/revalidate'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'categories', '_status', 'publishedAt'],
  },
  access: {
    read: authenticatedOrPublished,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    drafts: { autosave: { interval: 300 }, schedulePublish: true },
    maxPerDoc: 50,
  },
  hooks: {
    afterChange: [buildRevalidateHook({ pathPrefix: '/blog', tag: 'posts' })],
    afterDelete: [buildRevalidateDeleteHook({ pathPrefix: '/blog', tag: 'posts' })],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField(),
    { name: 'heroImage', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'excerpt',
      type: 'textarea',
      maxLength: 300,
      admin: { description: 'Shown on listing cards and used as meta-description fallback.' },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'Build the story with headings, links, quotes, lists, images and editorial formatting. Type “/” for blocks, or choose a style from the toolbar.',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'relatedTrips',
      type: 'relationship',
      relationTo: 'trips',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Trips to cross-sell at the end of this article.',
      },
    },
    {
      // Plain text on purpose: a relationship to the access-protected `users`
      // collection would not populate for anonymous visitors.
      name: 'authorName',
      type: 'text',
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            // Stamp the publish date the first time a post goes live
            if (siblingData._status === 'published' && !value) return new Date()
            return value
          },
        ],
      },
    },
  ],
}
