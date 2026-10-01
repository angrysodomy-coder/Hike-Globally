'use client'

import { createRowLabel } from './createRowLabel'

type LinkRow = {
  children?: unknown[] | null
  link?: {
    label?: null | string
    newTab?: boolean | null
    type?: null | string
  } | null
}

/** For nav arrays in the Header/Footer globals, built from `linkField()`. */
export const LinkRowLabel = createRowLabel<LinkRow>('Link', (data) => {
  const label = data?.link?.label?.trim()
  if (!label) return null

  const notes: string[] = []
  if (data?.link?.type === 'custom') notes.push('external')
  if (data?.link?.newTab) notes.push('new tab')

  const childCount = Array.isArray(data?.children) ? data.children.length : 0
  if (childCount > 0) notes.push(`${childCount} sub-item${childCount === 1 ? '' : 's'}`)

  return notes.length > 0 ? `${label} (${notes.join(', ')})` : label
})
