import type { CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { authenticated, publishedOrAuthenticated } from '@/access'
import { CalloutBlock } from '@/blocks/Callout/config'
import { GalleryBlock } from '@/blocks/Gallery/config'
import { TripCardBlock } from '@/blocks/TripCard/config'
import { seoTab } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { populateReadingTime } from '@/hooks/populateReadingTime'
import { revalidatePost, revalidatePostDelete } from '@/hooks/revalidate'
import { generatePreviewPath } from '@/lib/utils/generatePreviewPath'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  labels: { singular: 'Article', plural: 'Journal' },

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'categories', 'publishedAt', '_status'],
    group: 'Journal',
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({ collection: 'posts', req, slug: String(data?.slug ?? '') }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({ collection: 'posts', req, slug: String(data?.slug ?? '') }),
  },

  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },

  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    excerpt: true,
    heroImage: true,
    publishedAt: true,
    readingTime: true,
  },

  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'excerpt',
              type: 'textarea',
              required: true,
              maxLength: 320,
              admin: {
                description:
                  'Teaser for cards, the journal index, and the SEO description fallback.',
              },
            },
            { name: 'heroImage', type: 'upload', relationTo: 'media', required: true },
            {
              name: 'content',
              type: 'richText',
              required: true,
              /**
               * `rootFeatures`, NOT `defaultFeatures`.
               *
               * `defaultFeatures` is Payload's own built-in set — using it
               * here (as the plan's draft does) would silently discard the
               * curated toolbar in `src/fields/defaultLexical.ts` and hand
               * writers back H1, which must stay reserved for the page title.
               * `rootFeatures` is the set configured on `editor:` in
               * payload.config.ts, which is what we actually want to extend.
               */
              editor: lexicalEditor({
                features: ({ rootFeatures }) => [
                  ...rootFeatures,
                  BlocksFeature({ blocks: [CalloutBlock, TripCardBlock, GalleryBlock] }),
                ],
              }),
              admin: {
                description:
                  'The article body. Use H2/H3 for structure — they become the on-page contents list and the heading hierarchy search engines read.',
              },
            },
          ],
        },
        {
          label: 'Meta',
          fields: [
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              required: true,
              maxDepth: 1,
            },
            {
              name: 'authors',
              type: 'relationship',
              relationTo: 'authors',
              hasMany: true,
              required: true,
              maxDepth: 1,
            },
            {
              name: 'relatedTrips',
              type: 'relationship',
              relationTo: 'trips',
              hasMany: true,
              maxDepth: 1,
              admin: {
                description:
                  'Rendered as "Journeys mentioned in this article" — the highest-converting module on a travel blog. Always fill it in.',
              },
            },
            {
              name: 'relatedPosts',
              type: 'relationship',
              relationTo: 'posts',
              hasMany: true,
              maxDepth: 1,
              filterOptions: ({ id }) => ({ id: { not_equals: id } }),
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'featured',
                  type: 'checkbox',
                  admin: { width: '50%', description: 'Pins to the top of the journal index.' },
                },
                {
                  name: 'readingTime',
                  type: 'number',
                  admin: {
                    width: '50%',
                    description: 'Minutes. Calculated from the body on every save.',
                    readOnly: true,
                  },
                },
              ],
            },
          ],
        },
        seoTab,
      ],
    },
    slugField(),
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
  ],

  hooks: {
    beforeChange: [populatePublishedAt, populateReadingTime],
    afterChange: [revalidatePost],
    afterDelete: [revalidatePostDelete],
  },

  versions: {
    drafts: { autosave: { interval: 375 }, schedulePublish: true },
    maxPerDoc: 50,
  },
}
