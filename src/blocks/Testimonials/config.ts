import type { Block } from 'payload'

/** Traveller voices — `ReviewsSection.jsx` and `destinationVoices`. */
export const TestimonialsBlock: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  labels: { singular: 'Testimonials', plural: 'Testimonial sections' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'source',
      type: 'radio',
      required: true,
      defaultValue: 'auto',
      options: [
        { label: 'Automatic (featured reviews)', value: 'auto' },
        { label: 'Hand-picked', value: 'manual' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'trip',
      type: 'relationship',
      relationTo: 'trips',
      maxDepth: 0,
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'auto',
        description: 'Limit to reviews of one trip. Leave empty for all trips.',
      },
    },
    {
      name: 'minimumRating',
      type: 'number',
      defaultValue: 5,
      max: 5,
      min: 1,
      admin: { condition: (_, siblingData) => siblingData?.source === 'auto' },
    },
    {
      name: 'reviews',
      type: 'relationship',
      relationTo: 'reviews',
      hasMany: true,
      maxDepth: 1,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
    },
    { name: 'limit', type: 'number', defaultValue: 3, max: 12, min: 1 },
    {
      name: 'emitStructuredData',
      type: 'checkbox',
      admin: {
        description:
          'Emit Review JSON-LD. Only verified reviews are ever included, and never an aggregateRating you cannot evidence.',
      },
    },
  ],
}
