import type { Block } from 'payload'

/** A single inline figure. */
export const MediaBlock: Block = {
  slug: 'media',
  interfaceName: 'MediaBlock',
  labels: { singular: 'Image', plural: 'Images' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
    {
      name: 'size',
      type: 'select',
      required: true,
      defaultValue: 'inset',
      options: [
        { label: 'Full bleed', value: 'full' },
        { label: 'Inset', value: 'inset' },
        { label: 'Half width', value: 'half' },
      ],
    },
    {
      name: 'priority',
      type: 'checkbox',
      label: 'Load eagerly (above the fold)',
      admin: {
        description:
          'Only ever tick this for an image visible without scrolling. Eager-loading a mid-page photo competes with the hero and makes LCP worse, not better.',
      },
    },
  ],
}
