import React, { Fragment } from 'react'
import type { Page } from '@/payload-types'
import { Hero } from '@/components/blocks/Hero'
import { Content } from '@/components/blocks/Content'
import { MediaSection } from '@/components/blocks/MediaSection'
import { FeaturedTrips } from '@/components/blocks/FeaturedTrips'
import { Testimonials } from '@/components/blocks/Testimonials'
import { Cta } from '@/components/blocks/Cta'
import { Faq } from '@/components/blocks/Faq'

type LayoutBlock = Page['layout'][number]

const blockComponents: {
  [K in LayoutBlock['blockType']]: React.ComponentType<Extract<LayoutBlock, { blockType: K }>>
} = {
  hero: Hero,
  content: Content,
  mediaBlock: MediaSection,
  featuredTrips: FeaturedTrips,
  testimonialsBlock: Testimonials,
  cta: Cta,
  faqBlock: Faq,
}

export const RenderBlocks: React.FC<{ blocks: Page['layout'] }> = ({ blocks }) => (
  <Fragment>
    {blocks.map((block, i) => {
      const BlockComponent = blockComponents[block.blockType] as React.ComponentType<LayoutBlock>
      return <BlockComponent key={block.id ?? i} {...block} />
    })}
  </Fragment>
)
