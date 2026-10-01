import React from 'react'

import type { MediaBlock } from '@/payload-types'

import { CMSImage } from '@/components/CMSImage'

/**
 * `sizes` is derived from the chosen width rather than hardcoded. A `half`
 * image inside the prose column that claims `100vw` downloads roughly four
 * times the bytes it displays.
 */
const SIZES: Record<string, string> = {
  full: '100vw',
  half: '(max-width: 768px) 100vw, 45vw',
  inset: '(max-width: 768px) 100vw, 70vw',
}

export function MediaBlockComponent({ caption, image, priority, size }: MediaBlock) {
  return (
    <figure className={`blk-media blk-media--${size}`}>
      <div className="blk-media__frame">
        <CMSImage priority={Boolean(priority)} resource={image} sizes={SIZES[size] ?? '100vw'} />
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
