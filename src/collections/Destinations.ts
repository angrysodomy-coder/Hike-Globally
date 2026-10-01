import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '@/access'
import { artDirectedImage } from '@/fields/artDirectedImage'
import { SEASON_OPTIONS_SHORT } from '@/fields/options'
import { seoTab } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { revalidateDestination, revalidateDestinationDelete } from '@/hooks/revalidate'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { generatePreviewPath } from '@/lib/utils/generatePreviewPath'

/**
 * The five regions. Small collection, high leverage: every trip hangs off one
 * of these, the bento grid on `/destinations` is driven by them, and the
 * nav menu reads them.
 */
export const Destinations: CollectionConfig<'destinations'> = {
  slug: 'destinations',
  labels: { singular: 'Destination', plural: 'Destinations' },

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'kicker', 'displayOrder', '_status', 'updatedAt'],
    group: 'Catalogue',
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({ collection: 'destinations', req, slug: String(data?.slug ?? '') }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({ collection: 'destinations', req, slug: String(data?.slug ?? '') }),
  },

  // Drafts are ON, so read access MUST filter them. `read: anyone` here would
  // publish every unfinished region page the moment it was created.
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },

  defaultPopulate: { title: true, slug: true, cardImage: true, kicker: true },

  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'e.g. "Far West"' } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'kicker',
                  type: 'text',
                  required: true,
                  admin: { width: '60%', description: 'Sub-line: "Kanjakali · Api Himal · Khaptad"' },
                },
                {
                  name: 'displayOrder',
                  type: 'number',
                  required: true,
                  defaultValue: 10,
                  admin: { width: '20%', description: 'Lower sorts first.' },
                },
                {
                  name: 'tileSize',
                  type: 'select',
                  defaultValue: 'standard',
                  admin: { width: '20%' },
                  options: [
                    { label: 'Feature (large tile)', value: 'feature' },
                    { label: 'Standard', value: 'standard' },
                  ],
                },
              ],
            },
            {
              name: 'summary',
              type: 'textarea',
              required: true,
              maxLength: 400,
              admin: { description: 'The paragraph on the bento tile and the region explorer.' },
            },
            {
              name: 'body',
              type: 'richText',
              admin: { description: 'Long-form copy for the destination landing page.' },
            },
            artDirectedImage('heroImage', 'Hero image'),
            {
              name: 'cardImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: { description: 'Square-ish crop for grid tiles and nav menus.' },
            },
            { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, maxRows: 12 },
          ],
        },
        {
          label: 'Facts',
          fields: [
            {
              name: 'stats',
              type: 'array',
              maxRows: 4,
              labels: { singular: 'Stat', plural: 'Stats' },
              admin: {
                components: { RowLabel: '@/components/admin/TitleRowLabel#TitleRowLabel' },
                description: 'The animated counters on the destinations page.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'value', type: 'number', required: true, admin: { width: '25%' } },
                    {
                      name: 'suffix',
                      type: 'text',
                      admin: { width: '25%', description: '"+", "%", "m"…' },
                    },
                    { name: 'label', type: 'text', required: true, admin: { width: '50%' } },
                  ],
                },
                { name: 'note', type: 'text' },
              ],
            },
            {
              name: 'bestSeasons',
              type: 'select',
              hasMany: true,
              required: true,
              options: SEASON_OPTIONS_SHORT,
            },
            {
              name: 'faqs',
              type: 'array',
              admin: {
                initCollapsed: true,
                components: { RowLabel: '@/components/admin/QuestionRowLabel#QuestionRowLabel' },
              },
              fields: [
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'richText', required: true },
              ],
            },
          ],
        },
        {
          label: 'Catalogue',
          fields: [
            /**
             * Live, read-only list of the trips pointing here. A join is not a
             * stored column — Payload resolves it from the other side's
             * relationship — so there is nothing to keep in sync and no way
             * for it to disagree with the trip's own `destination` field.
             */
            {
              name: 'trips',
              type: 'join',
              collection: 'trips',
              on: 'destination',
              defaultLimit: 25,
              admin: {
                defaultColumns: ['title', 'durationDays', 'basePrice', '_status'],
                description: 'Every trip assigned to this region. Edit the trip to move it.',
              },
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
    beforeChange: [populatePublishedAt],
    afterChange: [revalidateDestination],
    afterDelete: [revalidateDestinationDelete],
  },

  versions: {
    drafts: { autosave: { interval: 375 }, schedulePublish: true },
    maxPerDoc: 25,
  },
}
