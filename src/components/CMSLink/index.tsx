import Link from 'next/link'
import React from 'react'

import type { LinkValue } from '@/lib/utils/resolveLinkHref'

import { resolveLinkHref } from '@/lib/utils/resolveLinkHref'

/**
 * Renders a CMS link field.
 *
 * Degrades to a `<span>` when the href cannot be resolved, rather than
 * emitting a dead anchor. `rel="noopener noreferrer"` is attached to every
 * new-tab link — without `noopener` the opened page gets a handle on
 * `window.opener` and can navigate this tab somewhere else.
 */
export function CMSLink({
  children,
  className,
  link,
}: {
  children?: React.ReactNode
  className?: string
  link: LinkValue | null | undefined
}) {
  const href = resolveLinkHref(link)
  const label = children ?? link?.label

  if (!href) return <span className={className}>{label}</span>

  const external = link?.newTab || href.startsWith('http')

  return (
    <Link
      className={className}
      href={href}
      {...(external ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
    >
      {label}
    </Link>
  )
}
