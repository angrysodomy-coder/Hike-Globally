import React from 'react'

import type { CTABlock } from '@/payload-types'

import { ArtDirectedImage } from '@/components/CMSImage/ArtDirected'
import { CMSLink } from '@/components/CMSLink'

export function CTABlockComponent({
  background,
  body,
  eyebrow,
  heading,
  links,
  theme,
}: CTABlock) {
  const photo = theme === 'photo' && background?.desktop

  return (
    <section className={`blk-cta blk-cta--${theme} section-pad`}>
      {photo ? (
        <>
          <div className="blk-cta__media">
            <ArtDirectedImage image={background} sizes="100vw" />
          </div>
          <div aria-hidden="true" className="blk-cta__scrim" />
        </>
      ) : null}

      <div className="blk-cta__inner shell">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{heading}</h2>
        {body ? <p className="blk-cta__body">{body}</p> : null}

        {links?.length ? (
          <div className="blk-cta__actions">
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
