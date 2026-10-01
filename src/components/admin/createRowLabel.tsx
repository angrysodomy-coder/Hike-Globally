'use client'

import type React from 'react'

import { useRowLabel } from '@payloadcms/ui'

/**
 * Factory for the collapsed-row labels on array fields.
 *
 * Why these exist at all: pitfall 18 in the plan. A trip has a 17-row
 * itinerary, 8 packing groups and a dozen FAQs. Collapsed, Payload labels them
 * "Day 01 … Day 17", so finding the Namche acclimatisation day means opening
 * rows one at a time until you hit it. Editors respond by not using the CMS.
 *
 * ── The 0-based / 1-based trap ──────────────────────────────────────────
 * Payload exposes the row index through two different paths with two
 * different conventions, verified in @payloadcms/ui@3.90.2:
 *
 *   fields/Array/ArrayRow.js:121          rowNumber: rowIndex       → 0-based
 *   fieldSchemasToFormState/renderField.js:107  rowNumber: rowIndex + 1  → 1-based
 *
 * The first feeds `RowLabelProvider`, which is what `useRowLabel()` reads. So
 * the hook is 0-based and every label here adds one. Reading `rowNumber` from
 * server props instead would be 1-based and adding one would number the
 * itinerary from day two.
 */

/** "3" → "03". Keeps collapsed rows aligned in the sidebar. */
export const pad = (value: number): string => String(value).padStart(2, '0')

export function createRowLabel<T>(
  fallbackSingular: string,
  render: (data: T, rowNumber: number) => null | string | undefined,
): React.FC {
  const RowLabel: React.FC = () => {
    const { data, rowNumber } = useRowLabel<T>()

    // `useRowLabel` is 0-based — see the note above.
    const index = (rowNumber ?? 0) + 1
    const label = render(data, index)

    return <span>{label && label.trim() ? label : `${fallbackSingular} ${pad(index)}`}</span>
  }

  // Without this every label renders as "RowLabel" in React DevTools, which
  // makes debugging the admin bundle unnecessarily annoying.
  RowLabel.displayName = `${fallbackSingular.replace(/\s+/g, '')}RowLabel`

  return RowLabel
}
