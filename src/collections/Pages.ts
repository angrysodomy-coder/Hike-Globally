import type { CollectionConfig } from 'payload'
import { authenticated, authenticatedOrPublished } from '@/lib/access'
import { slugField } from '@/fields/slug'
import { buildRevalidateHook, buildRevalidateDeleteHook } from '@/hooks/revalidate'
import {
  HeroBlock,
  ContentBlock,
  MediaBlock,
  FeaturedTripsBlock,
  TestimonialsBlock,
  CtaBlock,
  FaqBlock,
} from '@/blocks'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'slug', '_status'],
  },
  access: {
    read: authenticatedOrPublished,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    drafts: { autosave: { interval: 300 }, schedulePublish: true },
    maxPerDoc: 50,
  },
  hooks: {
    afterChange: [buildRevalidateHook({ pathPrefix: '', tag: 'pages' })],
    afterDelete: [buildRevalidateDeleteHook({ pathPrefix: '', tag: 'pages' })],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    // Pages live at the site root → guard against shadowing /trips, /blog, /admin…
    slugField({ checkReserved: true }),
    {
      name: 'layout',
      type: 'blocks',
      required: true,
      blocks: [
        HeroBlock,
        ContentBlock,
        MediaBlock,
        FeaturedTripsBlock,
        TestimonialsBlock,
        CtaBlock,
        FaqBlock,
      ],
    },
  ],
}
