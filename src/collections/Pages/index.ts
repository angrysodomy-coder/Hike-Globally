import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '@/access'
import { CTABlock } from '@/blocks/CTA/config'
import { DestinationBentoBlock } from '@/blocks/DestinationBento/config'
import { EnquiryFormBlock } from '@/blocks/EnquiryForm/config'
import { FAQBlock } from '@/blocks/FAQ/config'
import { GalleryBlock } from '@/blocks/Gallery/config'
import { HeroBlock } from '@/blocks/Hero/config'
import { InclusionsBlock } from '@/blocks/Inclusions/config'
import { ItineraryShowcaseBlock } from '@/blocks/ItineraryShowcase/config'
import { MarqueeBlock } from '@/blocks/Marquee/config'
import { MediaBlock } from '@/blocks/Media/config'
import { PostFeedBlock } from '@/blocks/PostFeed/config'
import { RichTextBlock } from '@/blocks/RichText/config'
import { SeasonMatrixBlock } from '@/blocks/SeasonMatrix/config'
import { StatsBlock } from '@/blocks/Stats/config'
import { TestimonialsBlock } from '@/blocks/Testimonials/config'
import { TripGridBlock } from '@/blocks/TripGrid/config'
import { TripRailBlock } from '@/blocks/TripRail/config'
import { seoTab } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { revalidatePage, revalidatePageDelete } from '@/hooks/revalidate'
import { generatePreviewPath } from '@/lib/utils/generatePreviewPath'

/**
 * The catch-all page builder: home, about, legal, and any landing page
 * marketing invents next season without needing a deploy.
 *
 * The homepage is the page whose slug is `home`, rendered at `/`. That
 * convention is encoded in `documentHref()` and in `revalidatePage()`, so it
 * only has to be remembered in one place.
 */
export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    group: 'Site',
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({ collection: 'pages', req, slug: String(data?.slug ?? '') }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({ collection: 'pages', req, slug: String(data?.slug ?? '') }),
  },

  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },

  defaultPopulate: { title: true, slug: true },

  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Layout',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              required: true,
              minRows: 1,
              admin: { initCollapsed: true },
              blocks: [
                HeroBlock,
                RichTextBlock,
                MediaBlock,
                MarqueeBlock,
                StatsBlock,
                DestinationBentoBlock,
                TripRailBlock,
                TripGridBlock,
                ItineraryShowcaseBlock,
                InclusionsBlock,
                SeasonMatrixBlock,
                TestimonialsBlock,
                PostFeedBlock,
                GalleryBlock,
                FAQBlock,
                CTABlock,
                EnquiryFormBlock,
              ],
            },
          ],
        },
        seoTab,
      ],
    },
    /**
     * Pages live at the URL root, so their slugs compete with every top-level
     * route the app defines. See the `reserved` argument in fields/slug.ts.
     */
    slugField('title', {}, ['admin', 'api', 'blog', 'destinations', 'next', 'trips']),
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
  ],

  hooks: {
    beforeChange: [populatePublishedAt],
    afterChange: [revalidatePage],
    afterDelete: [revalidatePageDelete],
  },

  versions: {
    drafts: { autosave: { interval: 375 }, schedulePublish: true },
    maxPerDoc: 50,
  },
}
