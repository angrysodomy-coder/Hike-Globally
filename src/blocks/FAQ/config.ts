import type { Block } from 'payload'

export const FAQBlock: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Questions, answered' },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
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
      name: 'emitStructuredData',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Adds FAQPage JSON-LD. Enable on only ONE FAQ block per page — duplicate FAQPage markup gets rich results suppressed.',
      },
    },
  ],
}
