'use client'

import { createRowLabel } from './createRowLabel'

/**
 * For arrays whose rows have a heading plus detail — essential-information
 * sections, packing groups, stats, route-map legend entries, permits,
 * inclusions, footer columns.
 *
 * Same reasoning as TextRowLabel: it adapts to whatever the row calls its
 * heading (`title`, `label` or `name`) instead of making every collection
 * rename a perfectly good field to satisfy a sidebar widget.
 */
export const TitleRowLabel = createRowLabel<{
  label?: null | string
  name?: null | string
  note?: null | string
  title?: null | string
  value?: null | string
}>('Section', (data) => {
  const heading = (data?.title ?? data?.label ?? data?.name)?.trim()
  if (!heading) return null

  const detail = (data?.note ?? data?.value)?.trim()
  return detail ? `${heading} · ${detail}` : heading
})
