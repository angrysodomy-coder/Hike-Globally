import React from 'react'

import type { HeroBlock } from '@/payload-types'

import { ArtDirectedImage } from '@/components/CMSImage/ArtDirected'
import { CMSLink } from '@/components/CMSLink'

/**
 * `priority` is hardcoded true: a hero block is the LCP element on any page
 * that has one. The three variants differ only in typography and scrim, so
 * they share markup and branch in CSS.
 */
export function HeroBlockComponent({
  eyebrow,
  background,
  heading,
  links,
  overlayOpacity,
  subheading,
  variant,
}: HeroBlock) {
  return (
    <section className={`blk-hero blk-hero--${variant}`}>
      <div className="blk-hero__media">
        <ArtDirectedImage image={background} priority sizes="100vw" />
      </div>
      <div
        aria-hidden="true"
        className="blk-hero__scrim"
        style={{ opacity: (overlayOpacity ?? 50) / 100 }}
      />

      <div className="blk-hero__inner shell">
        {eyebrow ? <p className="eyebrow eyebrow--light">{eyebrow}</p> : null}
        <h1>{heading}</h1>
        {subheading ? <p className="blk-hero__sub">{subheading}</p> : null}

        {links?.length ? (
          <div className="blk-hero__actions">
            {links.map((item, i) => (
              <CMSLink
                className={i === 0 ? 'blk-btn blk-btn--primary' : 'blk-btn blk-btn--ghost'}
                key={item.id ?? i}
                link={item.link}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
