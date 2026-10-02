import type { Block } from 'payload'

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
  ],
}

export const ContentBlock: Block = {
  slug: 'content',
  fields: [
    { name: 'content', type: 'richText', required: true },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'narrow',
      options: [
        { label: 'Narrow (prose)', value: 'narrow' },
        { label: 'Full width', value: 'full' },
      ],
    },
  ],
}

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  labels: { singular: 'Media', plural: 'Media blocks' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
  ],
}

export const FeaturedTripsBlock: Block = {
  slug: 'featuredTrips',
  labels: { singular: 'Featured trips', plural: 'Featured trips' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Popular trips' },
    {
      name: 'trips',
      type: 'relationship',
      relationTo: 'trips',
      hasMany: true,
      maxRows: 6,
      required: true,
    },
  ],
}

export const TestimonialsBlock: Block = {
  slug: 'testimonialsBlock',
  labels: { singular: 'Testimonials', plural: 'Testimonials' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'What travellers say' },
    {
      name: 'testimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      maxRows: 9,
      required: true,
    },
  ],
}

export const CtaBlock: Block = {
  slug: 'cta',
  labels: { singular: 'Call to action', plural: 'CTAs' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    { name: 'buttonLabel', type: 'text', required: true },
    { name: 'buttonHref', type: 'text', required: true },
  ],
}

export const FaqBlock: Block = {
  slug: 'faqBlock',
  labels: { singular: 'FAQ section', plural: 'FAQ sections' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Frequently asked questions' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'richText', required: true },
      ],
    },
  ],
}
