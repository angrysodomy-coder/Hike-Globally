import React from 'react'

import type { MarqueeBlock } from '@/payload-types'

/**
 * CSS-animated scrolling strip — no JS, no measuring.
 *
 * The item list is duplicated so the translate can loop seamlessly at -50%.
 * The clone is `aria-hidden` so a screen reader does not read the whole strip
 * twice, and the animation is disabled under `prefers-reduced-motion`.
 */
export function MarqueeBlockComponent({ items, speed, theme }: MarqueeBlock) {
  if (!items?.length) return null

  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="blk-marquee__row">
      {items.map((item, i) => (
        <li key={item.id ?? i}>
          {item.text}
          <i aria-hidden="true" />
        </li>
      ))}
    </ul>
  )

  return (
    <section className={`blk-marquee blk-marquee--${theme} blk-marquee--${speed}`}>
      <div className="blk-marquee__track">
        {row(false)}
        {row(true)}
      </div>
    </section>
  )
}
