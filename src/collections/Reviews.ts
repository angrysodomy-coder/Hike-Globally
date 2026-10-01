import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'

/**
 * Traveller reviews. Created by staff from verified post-trip feedback, not
 * submitted from the public site — hence `create: authenticated`. If you ever
 * open submissions, do it through a separate moderated route handler rather
 * than by loosening this.
 *
 * `trip` is indexed and `maxDepth: 0` so the join from Trips stays a single
 * cheap query and does not recursively re-resolve the trip it came from.
 */
export const Reviews: CollectionConfig<'reviews'> = {
  slug: 'reviews',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'trip', 'rating', 'travelledOn', 'verified', 'featured'],
    group: 'People',
  },

  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },

  defaultPopulate: {
    name: true,
    initials: true,
    location: true,
    quote: true,
    rating: true,
    travelledOn: true,
  },

  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
        {
          name: 'location',
          type: 'text',
          required: true,
          admin: { width: '50%', description: '"London, UK"' },
        },
      ],
    },
    {
      name: 'initials',
      type: 'text',
      maxLength: 3,
      admin: { description: 'Avatar fallback when there is no photo.' },
    },
    { name: 'quote', type: 'textarea', required: true, maxLength: 600 },
    {
      type: 'row',
      fields: [
        {
          name: 'rating',
          type: 'number',
          required: true,
          defaultValue: 5,
          max: 5,
          min: 1,
          admin: { width: '33%' },
        },
        {
          name: 'travelledOn',
          type: 'date',
          required: true,
          admin: {
            width: '33%',
            date: { displayFormat: 'MMMM yyyy', pickerAppearance: 'monthOnly' },
          },
        },
        {
          name: 'featured',
          type: 'checkbox',
          admin: { width: '33%', description: 'Pin to the homepage voices rail.' },
        },
      ],
    },
    { name: 'trip', type: 'relationship', relationTo: 'trips', index: true, maxDepth: 0 },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Only verified reviews feed aggregateRating structured data. Do not tick this for anything you cannot evidence — fabricated review markup gets rich results suppressed sitewide.',
      },
    },
  ],
}
