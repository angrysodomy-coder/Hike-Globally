import {
  Bed,
  HeartHandshake,
  type LucideIcon,
  Mountain,
  ShieldCheck,
  Stamp,
  Users,
  Utensils,
  Backpack,
} from 'lucide-react'
import React from 'react'

import type { InclusionsBlock } from '@/payload-types'

/**
 * Icon keys map to components here rather than being stored as class names in
 * the CMS, so an editor can never pick an icon that does not exist and the
 * tree-shaker can see exactly which eight icons ship.
 */
const ICONS: Record<string, LucideIcon> = {
  community: HeartHandshake,
  guide: Mountain,
  lodging: Bed,
  meals: Utensils,
  permits: Stamp,
  porter: Backpack,
  safety: ShieldCheck,
  transport: Users,
}

export function InclusionsBlockComponent({ heading, intro, items }: InclusionsBlock) {
  if (!items?.length) return null

  return (
    <section className="blk-inclusions section-pad">
      <div className="shell">
        {heading ? <h2>{heading}</h2> : null}
        {intro ? <p className="blk-intro">{intro}</p> : null}

        <ul className="blk-inclusions__grid">
          {items.map((item, i) => {
            const Icon = item.icon ? ICONS[item.icon] : null

            return (
              <li key={item.id ?? i}>
                {Icon ? (
                  <span aria-hidden="true" className="blk-inclusions__icon">
                    <Icon size={20} />
                  </span>
                ) : null}
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
