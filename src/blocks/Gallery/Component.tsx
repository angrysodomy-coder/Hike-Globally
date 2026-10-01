import React from 'react'

import type { GalleryBlock } from '@/payload-types'

import { CMSImage } from '@/components/CMSImage'

/**
 * `carousel` is a CSS scroll-snap strip, not a JS slider. It is keyboard
 * scrollable, works without hydration, and costs no bundle.
 */
export function GalleryBlockComponent({ heading, images, layout }: GalleryBlock) {
  if (!images?.length) return null

  const sizes =
    layout === 'carousel'
      ? '(max-width: 768px) 80vw, 32vw'
      : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'

  return (
    <section className="blk-gallery section-pad">
      <div className="shell">
        {heading ? <h2>{heading}</h2> : null}

        <div className={`blk-gallery__${layout}`}>
          {images.map((item, i) => (
            <figure key={item.id ?? i}>
              <div className="blk-gallery__frame">
                <CMSImage resource={item.image} sizes={sizes} />
              </div>
              {item.caption ? <figcaption>{item.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
