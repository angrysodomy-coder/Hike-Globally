import type { CollectionConfig } from 'payload'
import { authenticated, authenticatedOrPublished } from '@/lib/access'
import { slugField } from '@/fields/slug'
import { buildRevalidateHook, buildRevalidateDeleteHook } from '@/hooks/revalidate'

export const Trips: CollectionConfig = {
  slug: 'trips',
  admin: {
    useAsTitle: 'title',
    group: 'Travel',
    defaultColumns: ['title', 'destination', 'durationDays', 'basePrice', '_status'],
  },
  access: {
    read: authenticatedOrPublished,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    // autosave powers live preview; schedulePublish lets ops queue next season early
    drafts: { autosave: { interval: 300 }, schedulePublish: true },
    maxPerDoc: 50,
  },
  hooks: {
    afterChange: [buildRevalidateHook({ pathPrefix: '/trips', tag: 'trips' })],
    afterDelete: [buildRevalidateDeleteHook({ pathPrefix: '/trips', tag: 'trips' })],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'summary', type: 'textarea', required: true, maxLength: 300 },
            { name: 'heroImage', type: 'upload', relationTo: 'media', required: true },
            { name: 'description', type: 'richText', required: true },
            {
              type: 'row',
              fields: [
                { name: 'durationDays', type: 'number', required: true, min: 1 },
                { name: 'durationNights', type: 'number', min: 0 },
                {
                  name: 'difficulty',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Easy', value: 'easy' },
                    { label: 'Moderate', value: 'moderate' },
                    { label: 'Challenging', value: 'challenging' },
                    { label: 'Strenuous', value: 'strenuous' },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'maxGroupSize', type: 'number', min: 1 },
                { name: 'minAge', type: 'number', min: 0 },
                { name: 'maxAltitude', type: 'number', admin: { description: 'Metres' } },
              ],
            },
            {
              name: 'highlights',
              type: 'array',
              labels: { singular: 'Highlight', plural: 'Highlights' },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
          ],
        },
        {
          label: 'Itinerary',
          fields: [
            {
              // Array (not blocks): itineraries are a homogeneous ordered list;
              // day numbers derive from array order, so reordering never breaks them.
              name: 'itinerary',
              type: 'array',
              labels: { singular: 'Day', plural: 'Days' },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'richText', required: true },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'meals',
                      type: 'select',
                      hasMany: true,
                      options: [
                        { label: 'Breakfast', value: 'breakfast' },
                        { label: 'Lunch', value: 'lunch' },
                        { label: 'Dinner', value: 'dinner' },
                      ],
                    },
                    { name: 'accommodation', type: 'text' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'altitude', type: 'number', admin: { description: 'Metres' } },
                    { name: 'walkingHours', type: 'text', admin: { description: 'e.g. 5–6 hrs' } },
                    { name: 'distanceKm', type: 'number' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Pricing & Departures',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'basePrice', type: 'number', required: true, min: 0 },
                {
                  name: 'currency',
                  type: 'select',
                  required: true,
                  defaultValue: 'USD',
                  options: ['USD', 'EUR', 'GBP', 'AUD', 'NPR'],
                },
                { name: 'priceSuffix', type: 'text', defaultValue: 'per person' },
              ],
            },
            {
              name: 'groupPricing',
              type: 'array',
              admin: { description: 'Optional tiered pricing by group size.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'minPax', type: 'number', required: true, min: 1 },
                    { name: 'maxPax', type: 'number', required: true, min: 1 },
                    { name: 'pricePerPerson', type: 'number', required: true, min: 0 },
                  ],
                },
              ],
            },
            {
              name: 'departures',
              type: 'array',
              labels: { singular: 'Departure', plural: 'Departures' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'startDate', type: 'date', required: true },
                    { name: 'endDate', type: 'date', required: true },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'price',
                      type: 'number',
                      admin: { description: 'Overrides base price if set.' },
                    },
                    { name: 'seatsTotal', type: 'number', min: 1 },
                    { name: 'seatsBooked', type: 'number', min: 0, defaultValue: 0 },
                    {
                      name: 'status',
                      type: 'select',
                      defaultValue: 'available',
                      options: [
                        { label: 'Available', value: 'available' },
                        { label: 'Guaranteed', value: 'guaranteed' },
                        { label: 'Limited', value: 'limited' },
                        { label: 'Sold out', value: 'soldOut' },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'inclusions',
              type: 'array',
              fields: [{ name: 'text', type: 'text', required: true }],
            },
            {
              name: 'exclusions',
              type: 'array',
              fields: [{ name: 'text', type: 'text', required: true }],
            },
          ],
        },
        {
          label: 'Gallery & FAQ',
          fields: [
            {
              name: 'gallery',
              type: 'array',
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'caption', type: 'text' },
              ],
            },
            {
              name: 'faqs',
              type: 'array',
              labels: { singular: 'FAQ', plural: 'FAQs' },
              fields: [
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'richText', required: true },
              ],
            },
          ],
        },
      ],
    },
    // Sidebar fields (outside tabs)
    slugField(),
    {
      name: 'destination',
      type: 'relationship',
      relationTo: 'destinations',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show in featured sections on the homepage.' },
    },
  ],
}
