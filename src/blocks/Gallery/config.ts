import type { Block } from 'payload'

/**
 * Shared by the page builder and the article rich-text editor, so it is
 * imported from two places. Blocks are plain objects — reusing one is safe.
 */
export const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'images',
      type: 'array',
      minRows: 2,
      maxRows: 24,
      admin: { components: { RowLabel: '@/components/admin/TextRowLabel#TextRowLabel' } },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      required: true,
      defaultValue: 'grid',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Masonry', value: 'masonry' },
        { label: 'Horizontal scroll', value: 'carousel' },
      ],
    },
  ],
}
