import { Info, Lightbulb, TriangleAlert } from 'lucide-react'
import React from 'react'

import type { CalloutBlock } from '@/payload-types'

import { RichText } from '@/components/RichText'

const TONE = {
  note: { Icon: Info, label: 'Note' },
  tip: { Icon: Lightbulb, label: 'Tip' },
  warning: { Icon: TriangleAlert, label: 'Warning' },
} as const

/**
 * Inline callout, used from inside Lexical rich text.
 *
 * `role="note"` plus a visually-hidden tone label means a screen-reader user
 * learns this is a warning; sighted users get the colour and icon.
 */
export function CalloutBlockComponent({ body, title, tone }: CalloutBlock) {
  const { Icon, label } = TONE[tone] ?? TONE.note

  return (
    <aside className={`blk-callout blk-callout--${tone}`} role="note">
      <span aria-hidden="true" className="blk-callout__icon">
        <Icon size={18} />
      </span>
      <div className="blk-callout__body">
        <span className="sr-only">{label}: </span>
        {title ? <p className="blk-callout__title">{title}</p> : null}
        <RichText data={body} />
      </div>
    </aside>
  )
}
