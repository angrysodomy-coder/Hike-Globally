import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '@/access'
import { artDirectedImage } from '@/fields/artDirectedImage'
import {
  CURRENCY_OPTIONS,
  DIFFICULTY_OPTIONS,
  MEAL_OPTIONS,
  SEASON_OPTIONS,
  TRIP_TYPE_OPTIONS,
} from '@/fields/options'
import { seoTab } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { revalidateTrip, revalidateTripDelete } from '@/hooks/revalidate'
import { generatePreviewPath } from '@/lib/utils/generatePreviewPath'

/**
 * ── Trips / packages — the core collection ───────────────────────────────
 *
 * Every field here maps to something the current site already renders. The
 * shape is organised into tabs rather than one flat form on purpose: a
 * 60-field edit screen is the single most reliable way to make an editorial
 * team stop using a CMS (pitfall 18).
 *
 * Modelling decisions worth defending in review:
 *
 * • `durationDays` is a NUMBER, not "15 days". The legacy data stores both
 *   (`duration: '15 days'` and `durationDays: 15`) and they can disagree.
 *   Store the number, format it in a helper. Same for `maxAltitudeMetres`.
 *
 * • `basePrice` is a whole-unit integer with an explicit `currency`. Never a
 *   float — float arithmetic on a 20% deposit yields 298.00000000000006 — and
 *   never a currency-less number.
 *
 * • Day numbers are DERIVED from itinerary row order, never stored. Inserting
 *   an acclimatisation day at position four renumbers everything for free.
 *
 * • `highlights` / `includes` / `excludes` are arrays of `{ text }` rather
 *   than one textarea, so each line is individually addressable for the
 *   two-column layout and for structured data.
 *
 * • There is ONE trips collection, not `trips` + `treks`. The legacy data has
 *   Everest Base Camp in both, which is two URLs for one product and splits
 *   its ranking. `showInTrekRail` is a presentation flag instead (pitfall 6).
 */
export const Trips: CollectionConfig<'trips'> = {
  slug: 'trips',
  labels: { singular: 'Trip', plural: 'Trips & packages' },

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'destination', 'durationDays', 'basePrice', '_status', 'updatedAt'],
    group: 'Catalogue',
    listSearchableFields: ['title', 'summary', 'slug'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({ collection: 'trips', req, slug: String(data?.slug ?? '') }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({ collection: 'trips', req, slug: String(data?.slug ?? '') }),
  },

  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },

  /**
   * What comes back when a trip is REFERENCED from somewhere else — a related
   * trip, a blog cross-link, a nav item. Without it every one of those drags
   * the full document, itinerary and all. On a 12-card index that is the
   * difference between a 40KB and a 900KB payload (pitfall 12).
   */
  defaultPopulate: {
    title: true,
    slug: true,
    basePrice: true,
    cardImage: true,
    currency: true,
    destination: true,
    difficulty: true,
    durationDays: true,
    summary: true,
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'e.g. "Everest Base Camp"' },
    },

    {
      type: 'tabs',
      tabs: [
        // ── 1. Overview ──────────────────────────────────────────────────
        {
          label: 'Overview',
          fields: [
            {
              name: 'summary',
              type: 'textarea',
              required: true,
              maxLength: 320,
              admin: {
                description:
                  'One or two sentences. Used on cards, in search results, and as the SEO description fallback.',
              },
            },
            {
              name: 'highlight',
              type: 'text',
              required: true,
              admin: {
                description:
                  'The single image everyone carries home: "First light on the icefall from the ridge above Gorak Shep".',
              },
            },
            {
              name: 'overview',
              type: 'richText',
              admin: { description: 'Long-form "about this trek" copy for the detail page.' },
            },
            {
              name: 'highlights',
              type: 'array',
              minRows: 3,
              maxRows: 10,
              labels: { singular: 'Highlight', plural: 'Highlights' },
              admin: {
                components: { RowLabel: '@/components/admin/TextRowLabel#TextRowLabel' },
              },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'destination',
                  type: 'relationship',
                  relationTo: 'destinations',
                  required: true,
                  admin: { width: '50%' },
                },
                {
                  name: 'location',
                  type: 'text',
                  required: true,
                  admin: { width: '50%', description: 'Human-readable: "Khumbu, Nepal".' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'durationDays',
                  type: 'number',
                  required: true,
                  max: 120,
                  min: 1,
                  admin: { width: '25%' },
                },
                {
                  name: 'difficulty',
                  type: 'select',
                  required: true,
                  options: DIFFICULTY_OPTIONS,
                  admin: { width: '25%' },
                },
                {
                  name: 'tripType',
                  type: 'select',
                  required: true,
                  defaultValue: 'trek',
                  options: TRIP_TYPE_OPTIONS,
                  admin: { width: '25%' },
                },
                {
                  name: 'maxAltitudeMetres',
                  type: 'number',
                  required: true,
                  max: 9000,
                  min: 0,
                  admin: { width: '25%', description: 'Metres. Formatted for display in code.' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'seasons',
                  type: 'select',
                  hasMany: true,
                  required: true,
                  options: SEASON_OPTIONS,
                  admin: { width: '50%', description: 'Every season this trip can run in.' },
                },
                {
                  name: 'primeSeason',
                  type: 'select',
                  required: true,
                  options: SEASON_OPTIONS,
                  admin: { width: '50%', description: 'The one you would recommend.' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'groupSizeMax',
                  type: 'number',
                  required: true,
                  defaultValue: 8,
                  min: 1,
                  admin: { width: '33%' },
                },
                {
                  name: 'guideRatio',
                  type: 'text',
                  defaultValue: '1:4',
                  admin: { width: '33%', description: 'Guides to travellers.' },
                },
                { name: 'minimumAge', type: 'number', min: 0, admin: { width: '33%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'featured',
                  type: 'checkbox',
                  label: 'Feature on the homepage',
                  admin: { width: '33%' },
                },
                {
                  name: 'showInTrekRail',
                  type: 'checkbox',
                  label: 'Show in the "Trails worth taking" rail',
                  admin: { width: '33%' },
                },
                {
                  name: 'railOrder',
                  type: 'number',
                  admin: {
                    width: '33%',
                    condition: (_, siblingData) => Boolean(siblingData?.showInTrekRail),
                    description: 'Lower sorts first.',
                  },
                },
              ],
            },
          ],
        },

        // ── 2. Itinerary ─────────────────────────────────────────────────
        {
          label: 'Itinerary',
          fields: [
            {
              name: 'itinerary',
              type: 'array',
              minRows: 1,
              labels: { singular: 'Day', plural: 'Days' },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: '@/components/admin/ItineraryRowLabel#ItineraryRowLabel',
                },
                description:
                  'One row per day. Day numbers come from the row order — just drag to reorder.',
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                  admin: { description: 'e.g. "Phakding to Namche Bazaar"' },
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'altitudeMetres', type: 'number', admin: { width: '25%' } },
                    {
                      name: 'walkingHours',
                      type: 'text',
                      admin: { width: '25%', description: '"6 hours", "3–4 hours", "No walking".' },
                    },
                    { name: 'distanceKm', type: 'number', admin: { width: '25%' } },
                    { name: 'ascentMetres', type: 'number', admin: { width: '25%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'accommodation',
                      type: 'text',
                      admin: { width: '50%', description: '"Panorama Lodge, Namche Bazaar"' },
                    },
                    {
                      name: 'meals',
                      type: 'select',
                      hasMany: true,
                      options: MEAL_OPTIONS,
                      admin: { width: '50%' },
                    },
                  ],
                },
                { name: 'body', type: 'richText', required: true },
                {
                  name: 'gallery',
                  type: 'upload',
                  relationTo: 'media',
                  hasMany: true,
                  maxRows: 4,
                  admin: {
                    description:
                      'Up to four photos for this day. They auto-slide in the accordion — and must stay lazy-loaded, since a 17-day trek is 68 images that are mostly hidden.',
                  },
                },
                { name: 'isAcclimatisationDay', type: 'checkbox' },
              ],
            },
            {
              name: 'routeMap',
              type: 'group',
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media' },
                { name: 'caption', type: 'text' },
                {
                  name: 'legend',
                  type: 'array',
                  maxRows: 6,
                  admin: {
                    components: { RowLabel: '@/components/admin/TitleRowLabel#TitleRowLabel' },
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'label', type: 'text', required: true, admin: { width: '40%' } },
                        { name: 'value', type: 'text', required: true, admin: { width: '60%' } },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },

        // ── 3. Pricing & departures ──────────────────────────────────────
        {
          label: 'Pricing & departures',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'basePrice',
                  type: 'number',
                  required: true,
                  min: 0,
                  admin: {
                    width: '33%',
                    description:
                      'Per person, twin share, in the currency beside it. Whole units — no decimals.',
                  },
                },
                {
                  name: 'currency',
                  type: 'select',
                  required: true,
                  defaultValue: 'USD',
                  options: CURRENCY_OPTIONS,
                  admin: { width: '33%' },
                },
                {
                  name: 'depositPercent',
                  type: 'number',
                  defaultValue: 20,
                  max: 100,
                  min: 0,
                  admin: { width: '33%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'singleSupplement',
                  type: 'number',
                  min: 0,
                  admin: { width: '50%', description: 'Flat amount, same currency as above.' },
                },
                {
                  name: 'privateSurchargePercent',
                  type: 'number',
                  defaultValue: 18,
                  max: 100,
                  min: 0,
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'groupPricing',
              type: 'array',
              maxRows: 6,
              labels: { singular: 'Group tier', plural: 'Group tiers' },
              admin: {
                description:
                  'Optional per-head discounts by group size. Leave empty to charge the base price for everyone.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'minTravellers',
                      type: 'number',
                      required: true,
                      min: 1,
                      admin: { width: '33%' },
                    },
                    { name: 'maxTravellers', type: 'number', min: 1, admin: { width: '33%' } },
                    {
                      name: 'pricePerPerson',
                      type: 'number',
                      required: true,
                      min: 0,
                      admin: { width: '33%' },
                    },
                  ],
                },
              ],
            },
            /**
             * Live view of the Departures collection, creatable inline. Gives
             * editors the array-like experience without the write contention,
             * query and access-control problems an array field would cause —
             * see the note at the top of Departures.ts.
             */
            {
              name: 'departures',
              type: 'join',
              collection: 'departures',
              on: 'trip',
              defaultLimit: 25,
              defaultSort: 'startDate',
              admin: {
                allowCreate: true,
                defaultColumns: ['startDate', 'status', 'spotsRemaining', 'price'],
              },
            },
          ],
        },

        // ── 4. Inclusions ────────────────────────────────────────────────
        {
          label: 'Inclusions',
          fields: [
            {
              name: 'includes',
              type: 'array',
              minRows: 1,
              admin: {
                components: { RowLabel: '@/components/admin/TextRowLabel#TextRowLabel' },
              },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
            {
              name: 'excludes',
              type: 'array',
              minRows: 1,
              admin: {
                components: { RowLabel: '@/components/admin/TextRowLabel#TextRowLabel' },
              },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
            {
              name: 'packingList',
              type: 'array',
              maxRows: 8,
              labels: { singular: 'Packing group', plural: 'Packing groups' },
              admin: {
                initCollapsed: true,
                components: { RowLabel: '@/components/admin/TitleRowLabel#TitleRowLabel' },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'title', type: 'text', required: true, admin: { width: '50%' } },
                    { name: 'note', type: 'text', admin: { width: '50%' } },
                  ],
                },
                {
                  name: 'items',
                  type: 'array',
                  minRows: 1,
                  admin: {
                    components: { RowLabel: '@/components/admin/TextRowLabel#TextRowLabel' },
                  },
                  fields: [{ name: 'text', type: 'text', required: true }],
                },
              ],
            },
          ],
        },

        // ── 5. Practical ─────────────────────────────────────────────────
        {
          label: 'Practical',
          fields: [
            {
              name: 'essentialInfo',
              type: 'array',
              admin: {
                initCollapsed: true,
                components: { RowLabel: '@/components/admin/TitleRowLabel#TitleRowLabel' },
              },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'body', type: 'richText', required: true },
              ],
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
            {
              /**
               * A permit cap is a constraint, not a paragraph (pitfall 11).
               * Modelled as data so it can be displayed consistently and,
               * later, validated against `groupSizeMax`.
               */
              name: 'permits',
              type: 'array',
              admin: {
                components: { RowLabel: '@/components/admin/TitleRowLabel#TitleRowLabel' },
                description: 'Restricted-area and conservation permits this trip requires.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                      required: true,
                      label: 'Permit',
                      admin: { width: '70%' },
                    },
                    {
                      name: 'handledByUs',
                      type: 'checkbox',
                      defaultValue: true,
                      admin: { width: '30%' },
                    },
                  ],
                },
              ],
            },
          ],
        },

        // ── 6. Media & relationships ─────────────────────────────────────
        {
          label: 'Media',
          fields: [
            artDirectedImage('heroImage', 'Hero image'),
            {
              name: 'cardImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: { description: 'The crop used on grids, rails and search results.' },
            },
            { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, maxRows: 24 },
            { name: 'leadGuide', type: 'relationship', relationTo: 'authors' },
            {
              name: 'relatedTrips',
              type: 'relationship',
              relationTo: 'trips',
              hasMany: true,
              maxDepth: 1,
              // Stops a trip relating to itself, which would otherwise render
              // an infinite related-trips loop.
              filterOptions: ({ id }) => ({ id: { not_equals: id } }),
            },
            {
              name: 'relatedPosts',
              type: 'relationship',
              relationTo: 'posts',
              hasMany: true,
              maxDepth: 1,
            },
            {
              name: 'reviews',
              type: 'join',
              collection: 'reviews',
              on: 'trip',
              defaultLimit: 10,
              admin: { defaultColumns: ['name', 'rating', 'travelledOn', 'verified'] },
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
    afterChange: [revalidateTrip],
    afterDelete: [revalidateTripDelete],
  },

  versions: {
    drafts: { autosave: { interval: 375 }, schedulePublish: true },
    maxPerDoc: 50,
  },
}
