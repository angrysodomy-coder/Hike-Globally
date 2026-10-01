'use client'

import { createRowLabel } from './createRowLabel'

/**
 * For single-string arrays — trip highlights, includes, excludes, packing
 * items, marquee words, gallery captions.
 *
 * Reads several field names rather than forcing every array to call its
 * string `text`. A row label is a presentation detail; bending the content
 * model to suit it would be the wrong way round, and "caption" is the right
 * name for a caption.
 */
export const TextRowLabel = createRowLabel<{
  caption?: null | string
  label?: null | string
  text?: null | string
}>('Item', (data) => {
  const text = (data?.text ?? data?.caption ?? data?.label)?.trim()
  if (!text) return null

  return text.length > 72 ? `${text.slice(0, 72)}…` : text
})
