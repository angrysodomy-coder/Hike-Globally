import type { CollectionConfig } from 'payload'
import { isAdmin, publishedOrAdmin } from '../access'
import { slugField } from '../fields/slug'

export const Trips: CollectionConfig = {
  slug: 'trips',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'difficulty', 'price', '_status', 'updatedAt'],
    description: 'Himalayan trekking and expedition journeys.',
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
              name: 'title',
              label: 'Journey Title',
              type: 'text',
              required: true,
            },
            slugField('title'),
            {
              name: 'location',
              label: 'Location / Region Area',
              type: 'text',
              admin: {
                description: 'Geographic location (e.g. "Khumbu, Nepal")',
              },
            },
            {
              name: 'destination',
              label: 'Destination / Region',
              type: 'relationship',
              relationTo: 'destinations',
              admin: {
                description: 'Linked destination region in the CMS.',
              },
            },
            {
              name: 'destinationName',
              label: 'Destination Name / Filter Key',
              type: 'text',
              admin: {
                description: 'Short region name used for frontend filter chips (e.g. "Everest", "Annapurna", "Mustang").',
              },
            },
            {
              name: 'shortDescription',
              label: 'Short Description',
              type: 'textarea',
              admin: {
                description: 'Brief 1-2 sentence overview for cards and teasers.',
              },
            },
            {
              name: 'description',
              label: 'Full Description',
              type: 'textarea',
              required: true,
              admin: {
                description: 'Detailed story and description of this journey.',
              },
            },
            {
              name: 'tripType',
              label: 'Trip Type',
              type: 'select',
              defaultValue: 'Trek',
              options: [
                { label: 'Trek', value: 'Trek' },
                { label: 'Expedition', value: 'Expedition' },
                { label: 'Cultural Tour', value: 'Cultural' },
              ],
            },
            {
              name: 'featured',
              label: 'Featured Journey',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Featured trips are prioritized at the top of listings.',
              },
            },
          ],
        },
        {
          label: 'Trip Details & Pricing',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'duration',
                  label: 'Duration Label',
                  type: 'text',
                  admin: {
                    description: 'Human-readable duration (e.g. "15 days")',
                    width: '50%',
                  },
                },
                {
                  name: 'durationDays',
                  label: 'Duration in Days',
                  type: 'number',
                  admin: {
                    description: 'Integer days for sorting (e.g. 15)',
                    width: '50%',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'price',
                  label: 'Starting Price',
                  type: 'number',
                  required: true,
                  admin: {
                    description: 'Base price per person in USD (e.g. 1490)',
                    width: '50%',
                  },
                },
                {
                  name: 'currency',
                  label: 'Currency',
                  type: 'text',
                  defaultValue: 'USD',
                  admin: {
                    width: '50%',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'difficulty',
                  label: 'Difficulty Level',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Easy', value: 'Easy' },
                    { label: 'Moderate', value: 'Moderate' },
                    { label: 'Challenging', value: 'Challenging' },
                  ],
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'groupSize',
                  label: 'Group Size',
                  type: 'text',
                  defaultValue: 'Small group (2–10)',
                  admin: {
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'seasons',
              label: 'Recommended Seasons',
              type: 'select',
              hasMany: true,
              options: [
                { label: 'Spring', value: 'Spring' },
                { label: 'Summer', value: 'Summer' },
                { label: 'Autumn', value: 'Autumn' },
                { label: 'Winter', value: 'Winter' },
              ],
            },
            {
              name: 'primeSeason',
              label: 'Prime Season',
              type: 'select',
              options: [
                { label: 'Spring', value: 'Spring' },
                { label: 'Summer', value: 'Summer' },
                { label: 'Autumn', value: 'Autumn' },
                { label: 'Winter', value: 'Winter' },
              ],
            },
            {
              name: 'departures',
              label: 'Scheduled Departures',
              type: 'text',
              admin: {
                description: 'Departure window (e.g. "Mar · Apr · Oct · Nov")',
              },
            },
            {
              name: 'elevation',
              label: 'Maximum Elevation',
              type: 'text',
              admin: {
                description: 'Peak altitude (e.g. "5,364 m")',
              },
            },
            {
              name: 'highlight',
              label: 'Signature Moment Highlight',
              type: 'text',
              admin: {
                description: 'Editorial highlight quote (e.g. "First light on the icefall from the ridge above Gorak Shep")',
              },
            },
            {
              name: 'availability',
              label: 'Live Availability Note',
              type: 'text',
              admin: {
                description: 'e.g. "4 places in October"',
              },
            },
            {
              name: 'bestTimeToVisit',
              label: 'Best Time to Visit Note',
              type: 'text',
            },
          ],
        },
        {
          label: 'Itinerary',
          fields: [
            {
              name: 'itinerary',
              label: 'Daily Itinerary',
              type: 'array',
              labels: {
                singular: 'Day',
                plural: 'Days',
              },
              fields: [
                {
                  name: 'day',
                  label: 'Day Number',
                  type: 'number',
                  required: true,
                },
                {
                  name: 'title',
                  label: 'Day Title / Stage',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'description',
                  label: 'Day Description',
                  type: 'textarea',
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'altitude',
                      label: 'Altitude',
                      type: 'text',
                      admin: { width: '33%' },
                    },
                    {
                      name: 'accommodation',
                      label: 'Accommodation',
                      type: 'text',
                      admin: { width: '33%' },
                    },
                    {
                      name: 'meals',
                      label: 'Meals Included',
                      type: 'text',
                      admin: { width: '33%' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Inclusions & Exclusions',
          fields: [
            {
              name: 'inclusions',
              label: 'What is Included',
              type: 'array',
              fields: [
                {
                  name: 'item',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'exclusions',
              label: 'What is Not Included',
              type: 'array',
              fields: [
                {
                  name: 'item',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Media',
          fields: [
            {
              name: 'featuredImage',
              label: 'Featured Image',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'imageUrl',
              label: 'Static Image URL Fallback',
              type: 'text',
              admin: {
                description: 'Fallback path (e.g. "/images/trip-everest.webp")',
              },
            },
            {
              name: 'imagePosition',
              label: 'CSS Object Position',
              type: 'text',
              defaultValue: 'center 45%',
            },
            {
              name: 'alt',
              label: 'Image Alt Text',
              type: 'text',
            },
            {
              name: 'gallery',
              label: 'Gallery Images',
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
