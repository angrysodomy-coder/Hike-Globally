import type { CollectionConfig } from 'payload'
import { isAdmin, publishedOrAdmin } from '../access'
import { slugField } from '../fields/slug'

export const Destinations: CollectionConfig = {
  slug: 'destinations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'kicker', '_status', 'updatedAt'],
    description: 'Himalayan regions and destinations.',
  },
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Basic Information',
          fields: [
            {
              name: 'name',
              label: 'Region / Destination Name',
              type: 'text',
              required: true,
            },
            slugField('name'),
            {
              name: 'kicker',
              label: 'Sub-heading / Landmark Kicker',
              type: 'text',
              admin: {
                description: 'Key ranges or passes (e.g. "Annapurna · Dhaulagiri · Mustang")',
              },
            },
            {
              name: 'number',
              label: 'Display Number',
              type: 'text',
              admin: {
                description: 'Two-digit index (e.g. "01", "02")',
              },
            },
            {
              name: 'tile',
              label: 'Bento Grid Tile Key',
              type: 'select',
              options: [
                { label: 'Far West (far)', value: 'far' },
                { label: 'Mid-West (mid)', value: 'mid' },
                { label: 'Western (west)', value: 'west' },
                { label: 'Central (cent)', value: 'cent' },
                { label: 'Eastern (east)', value: 'east' },
              ],
            },
            {
              name: 'size',
              label: 'Card Size Scale',
              type: 'select',
              defaultValue: 'standard',
              options: [
                { label: 'Standard', value: 'standard' },
                { label: 'Feature', value: 'feature' },
              ],
            },
          ],
        },
        {
          label: 'Content',
          fields: [
            {
              name: 'description',
              label: 'Description',
              type: 'textarea',
              required: true,
            },
            {
              name: 'bestTimeToVisit',
              label: 'Best Time to Visit',
              type: 'text',
              admin: {
                description: 'Recommended seasons/months (e.g. "Autumn (Oct–Nov) · Spring (Mar–May)")',
              },
            },
            {
              name: 'attractions',
              label: 'Key Attractions',
              type: 'array',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'description',
                  type: 'textarea',
                },
              ],
            },
          ],
        },
        {
          label: 'Media',
          fields: [
            {
              name: 'heroImage',
              label: 'Hero Image',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'imageUrl',
              label: 'Static Image URL Fallback',
              type: 'text',
              admin: {
                description: 'Fallback path (e.g. "/images/region-far-west.webp") if no upload selected',
              },
            },
            {
              name: 'imagePosition',
              label: 'Image Object Position',
              type: 'text',
              defaultValue: 'center center',
              admin: {
                description: 'CSS object-position (e.g. "center 42%")',
              },
            },
            {
              name: 'gallery',
              label: 'Gallery',
              type: 'array',
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                },
                {
                  name: 'caption',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          label: 'Related Trips',
          fields: [
            {
              name: 'relatedTrips',
              label: 'Featured Journeys in this Region',
              type: 'relationship',
              relationTo: 'trips',
              hasMany: true,
              admin: {
                description: 'Trips linked to this destination.',
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'metaTitle',
              label: 'Meta Title',
              type: 'text',
            },
            {
              name: 'metaDescription',
              label: 'Meta Description',
              type: 'textarea',
            },
            {
              name: 'ogImage',
              label: 'Open Graph Image',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'canonicalURL',
              label: 'Canonical URL',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}
