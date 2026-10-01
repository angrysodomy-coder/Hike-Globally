import React from 'react'

import type { RichTextBlock } from '@/payload-types'

import { RichText } from '@/components/RichText'

export function RichTextBlockComponent({ content, width }: RichTextBlock) {
  return (
    <section className={`blk-richText blk-richText--${width} section-pad`}>
      <div className="shell">
        <RichText className="blk-prose" data={content} />
      </div>
    </section>
  )
}
