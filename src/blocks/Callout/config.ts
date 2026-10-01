import type { Block } from 'payload'

/**
 * An inline aside inside an article body. Registered through `BlocksFeature`
 * on the Posts rich-text field, so a writer can drop it mid-paragraph.
 *
 * Lexical blocks are stored inside the rich-text JSON rather than in their own
 * table, so adding one of these costs no schema change.
 */
export const CalloutBlock: Block = {
  slug: 'callout',
  interfaceName: 'CalloutBlock',
  labels: { singular: 'Callout', plural: 'Callouts' },
  fields: [
    {
      name: 'tone',
      type: 'select',
      required: true,
      defaultValue: 'note',
      options: [
        { label: 'Note', value: 'note' },
        { label: 'Tip', value: 'tip' },
        { label: 'Warning — safety or altitude', value: 'warning' },
      ],
    },
    { name: 'title', type: 'text' },
    { name: 'body', type: 'richText', required: true },
  ],
}
