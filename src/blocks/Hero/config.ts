import type { Block } from 'payload'

import { LINKABLE_COLLECTIONS } from '@/collections/linkable'
import { artDirectedImage } from '@/fields/artDirectedImage'
import { linkField } from '@/fields/link'

/**
 * Concept — blocks. A `blocks` field is a repeatable, ordered list where each
 * row can be a DIFFERENT shape. That is how an editor builds a landing page:
 * add a Hero, then a stats band, then a trip rail, then drag to reorder.
 * Each block is `{ slug, fields }` here and one React component on the
 * frontend; `RenderBlocks` maps between the two.
 *
 * `interfaceName` names the generated TypeScript interface. Without it you get
 * a deeply nested anonymous type that is painful to reference from the
 * component that renders it.
 */
export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'cinematic',
      options: [
        { label: 'Cinematic full-bleed (home)', value: 'cinematic' },
        { label: 'Parallax (trips / destinations)', value: 'parallax' },
        { label: 'Editorial (about, legal)', value: 'editorial' },
      ],
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea', maxLength: 280 },
    artDirectedImage('background', 'Background image'),
    {
      name: 'links',
      type: 'array',
      maxRows: 2,
      admin: { components: { RowLabel: '@/components/admin/LinkRowLabel#LinkRowLabel' } },
      fields: [linkField({ relationTo: [...LINKABLE_COLLECTIONS] })],
    },
    {
      name: 'overlayOpacity',
      type: 'number',
      defaultValue: 35,
      max: 100,
      min: 0,
      admin: {
        description:
          'Percentage of dark overlay. Raise it when the headline is hard to read against the photo.',
      },
    },
  ],
}
