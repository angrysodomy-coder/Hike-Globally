import type { Block } from 'payload'

/**
 * A plain prose section. Inherits the global Lexical config from
 * `payload.config.ts`, so the toolbar matches every other rich-text field on
 * the site.
 */
export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: { singular: 'Rich text', plural: 'Rich text sections' },
  fields: [
    { name: 'content', type: 'richText', required: true },
    {
      name: 'width',
      type: 'select',
      required: true,
      defaultValue: 'prose',
      options: [
        { label: 'Prose column (readable measure)', value: 'prose' },
        { label: 'Wide', value: 'wide' },
        { label: 'Full bleed', value: 'full' },
      ],
      admin: {
        description:
          'Prose caps the line length at around 70 characters. Use it for anything anyone is expected to actually read.',
      },
    },
  ],
}
