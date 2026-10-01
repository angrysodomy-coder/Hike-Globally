import React from 'react'

import type { StatsBlock } from '@/payload-types'

/**
 * The `animate` flag is honoured as a CSS class, not a count-up script.
 *
 * A JS count-up would make the number absent from the server HTML until
 * hydration, which costs the CLS budget and hides the figure from scrapers.
 * The real value renders immediately; CSS just fades it in.
 */
export function StatsBlockComponent({ animate, heading, items }: StatsBlock) {
  if (!items?.length) return null

  return (
    <section className={`blk-stats section-pad${animate ? ' is-animated' : ''}`}>
      <div className="shell">
        {heading ? <h2 className="blk-stats__heading">{heading}</h2> : null}
        <dl className="blk-stats__grid">
          {items.map((item, i) => (
            <div className="blk-stats__item" key={item.id ?? i}>
              <dt>
                <span className="blk-stats__value">{item.value.toLocaleString('en-GB')}</span>
                {item.suffix ? <span className="blk-stats__suffix">{item.suffix}</span> : null}
              </dt>
              <dd>
                <span className="blk-stats__label">{item.label}</span>
                {item.note ? <small>{item.note}</small> : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
