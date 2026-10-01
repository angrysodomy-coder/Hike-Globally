import React from 'react'

import type { Media } from '@/payload-types'

import { getMediaURL } from '@/lib/utils/getURL'

type ArtDirectedField = {
  desktop: Media | number
  mobile?: Media | null | number
  objectPosition?: null | string
}

const resolve = (url: string): string => (url.startsWith('http') ? url : `${getMediaURL()}${url}`)

const asMedia = (m: Media | null | number | undefined): Media | null =>
  m && typeof m === 'object' ? m : null

/** Build a srcset from Payload's generated derivatives, widest last. */
const srcSet = (media: Media): string => {
  const entries = Object.values(media.sizes ?? {})
    .filter((s): s is { url: string; width: number } => Boolean(s?.url && s?.width))
    .sort((a, b) => a.width - b.width)
    .map((s) => `${resolve(s.url)} ${s.width}w`)

  if (media.url && media.width) entries.push(`${resolve(media.url)} ${media.width}w`)
  return entries.join(', ')
}

/**
 * Art-directed hero: a genuinely different crop per breakpoint.
 *
 * Deliberately a raw `<picture>` and NOT `next/image`.
 *
 *  - `next/image` has no art-direction API. It solves resolution, not
 *    composition, so there is no way to say "portrait plate under 768px".
 *  - Payload's image processing has already produced correctly-sized WebP
 *    derivatives at upload time. Routing those through /_next/image re-encodes
 *    an already-optimised file and, on Vercel, bills every variant as a
 *    transformation (§12.5). This costs nothing and ships the same bytes.
 *
 * The trade-off is that `priority` has to be expressed manually, hence
 * `fetchPriority="high"` plus eager loading on the hero.
 */
export function ArtDirectedImage({
  className,
  image,
  priority = false,
  sizes = '100vw',
}: {
  className?: string
  image: ArtDirectedField | null | undefined
  priority?: boolean
  sizes?: string
}) {
  const desktop = asMedia(image?.desktop)
  if (!desktop?.url) return null

  const mobile = asMedia(image?.mobile)

  return (
    <picture className={className}>
      {mobile?.url ? (
        <source media="(max-width: 767px)" sizes={sizes} srcSet={srcSet(mobile)} />
      ) : null}
      <source media="(min-width: 768px)" sizes={sizes} srcSet={srcSet(desktop)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={desktop.alt || ''}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        height={desktop.height ?? undefined}
        loading={priority ? 'eager' : 'lazy'}
        src={resolve(desktop.url)}
        style={{
          objectPosition:
            image?.objectPosition || `${desktop.focalX ?? 50}% ${desktop.focalY ?? 50}%`,
        }}
        width={desktop.width ?? undefined}
      />
    </picture>
  )
}
