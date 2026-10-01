import type { Block } from 'payload'

import { DIFFICULTY_OPTIONS, SEASON_OPTIONS_SHORT } from '@/fields/options'

/**
 * The filterable trip grid — `TripsSection.jsx` and the `/trips` index.
 *
 * The auto/manual split is the important part. "Automatic" stores a query and
 * resolves it at render time, so a newly published trip appears without anyone
 * editing the page. "Hand-picked" stores explicit relationships for the cases
 * where editorial order matters more than freshness.
 *
 * The filter vocabularies come from `@/fields/options` rather than being
 * written out again here — they must match the values stored on Trips exactly
 * or the filter silently returns nothing.
 */
export const TripGridBlock: Block = {
  slug: 'tripGrid',
  interfaceName: 'TripGridBlock',
  labels: { singular: 'Trip grid', plural: 'Trip grids' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'intro', type: 'textarea', maxLength: 400 },
    {
      name: 'source',
      type: 'radio',
      required: true,
      defaultValue: 'auto',
      options: [
        { label: 'Automatic (by filter)', value: 'auto' },
        { label: 'Hand-picked', value: 'manual' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'filters',
      type: 'group',
      admin: { condition: (_, siblingData) => siblingData?.source === 'auto' },
      fields: [
        {
          name: 'destinations',
          type: 'relationship',
          relationTo: 'destinations',
          hasMany: true,
        },
        { name: 'difficulty', type: 'select', hasMany: true, options: DIFFICULTY_OPTIONS },
        { name: 'seasons', type: 'select', hasMany: true, options: SEASON_OPTIONS_SHORT },
        { name: 'featuredOnly', type: 'checkbox' },
        { name: 'limit', type: 'number', defaultValue: 6, max: 24, min: 1 },
      ],
    },
    {
      name: 'trips',
      type: 'relationship',
      relationTo: 'trips',
      hasMany: true,
      maxDepth: 1,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
    },
    {
      name: 'showFilters',
      type: 'checkbox',
      label: 'Show the interactive filter bar',
      defaultValue: false,
    },
  ],
}
