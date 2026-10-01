import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { CTABlockComponent } from '@/blocks/CTA/Component'
import { DestinationBentoBlockComponent } from '@/blocks/DestinationBento/Component'
import { EnquiryFormBlockComponent } from '@/blocks/EnquiryForm/Component'
import { FAQBlockComponent } from '@/blocks/FAQ/Component'
import { GalleryBlockComponent } from '@/blocks/Gallery/Component'
import { HeroBlockComponent } from '@/blocks/Hero/Component'
import { InclusionsBlockComponent } from '@/blocks/Inclusions/Component'
import { ItineraryShowcaseBlockComponent } from '@/blocks/ItineraryShowcase/Component'
import { MarqueeBlockComponent } from '@/blocks/Marquee/Component'
import { MediaBlockComponent } from '@/blocks/Media/Component'
import { PostFeedBlockComponent } from '@/blocks/PostFeed/Component'
import { RichTextBlockComponent } from '@/blocks/RichText/Component'
import { SeasonMatrixBlockComponent } from '@/blocks/SeasonMatrix/Component'
import { StatsBlockComponent } from '@/blocks/Stats/Component'
import { TestimonialsBlockComponent } from '@/blocks/Testimonials/Component'
import { TripGridBlockComponent } from '@/blocks/TripGrid/Component'
import { TripRailBlockComponent } from '@/blocks/TripRail/Component'

export type LayoutBlock = NonNullable<Page['layout']>[number]

/**
 * blockType → component. The keys must match the `slug` in each block's
 * `config.ts` exactly; a typo here renders nothing in production and throws
 * in development, which is the behaviour below.
 *
 * `any` is load-bearing here, and the plan's `ComponentType<never>` sketch
 * does not compile: `never` makes every props type unassignable, so the
 * lookup result cannot be used as a JSX element at all. A heterogeneous
 * registry of components with 17 different props types has no sound shared
 * signature — the narrowing happens at the `blockType` switch, which TypeScript
 * cannot follow through a Record lookup. The cast below is where the type
 * safety is reasserted.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components: Record<string, React.ComponentType<any>> = {
  cta: CTABlockComponent,
  destinationBento: DestinationBentoBlockComponent,
  enquiryForm: EnquiryFormBlockComponent,
  faq: FAQBlockComponent,
  gallery: GalleryBlockComponent,
  hero: HeroBlockComponent,
  inclusions: InclusionsBlockComponent,
  itineraryShowcase: ItineraryShowcaseBlockComponent,
  marquee: MarqueeBlockComponent,
  media: MediaBlockComponent,
  postFeed: PostFeedBlockComponent,
  richText: RichTextBlockComponent,
  seasonMatrix: SeasonMatrixBlockComponent,
  stats: StatsBlockComponent,
  testimonials: TestimonialsBlockComponent,
  tripGrid: TripGridBlockComponent,
  tripRail: TripRailBlockComponent,
}

export function RenderBlocks({ blocks }: { blocks: LayoutBlock[] | null | undefined }) {
  if (!blocks?.length) return null

  return (
    <Fragment>
      {blocks.map((block, index) => {
        const Component = components[block.blockType]

        if (!Component) {
          /**
           * Loud in development, silent in production. A block the renderer
           * does not know about is a bug worth stopping for locally — but on
           * a live page it must degrade to a gap, never to a white screen for
           * every visitor.
           */
          if (process.env.NODE_ENV === 'development') {
            throw new Error(`No component registered for block "${block.blockType}"`)
          }
          return null
        }

        return <Component key={block.id ?? index} {...block} />
      })}
    </Fragment>
  )
}
