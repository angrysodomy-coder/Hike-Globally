import Image from 'next/image'
import React from 'react'

import type { Media } from '@/payload-types'

import { getMediaURL } from '@/lib/utils/getURL'

export type CMSImageProps = {
  className?: string
  /** Set on the LCP image only — usually the hero. More than one and they compete. */
  priority?: boolean
  resource: Media | null | number | string | undefined
  /**
   * REQUIRED, and the one prop worth arguing about.
   *
   * `next/image` cannot see your CSS. Omit `sizes` on a `fill` image and it
   * assumes `100vw`, so a 320px-wide card downloads the 1920px plate. On a
   * trips grid that is the difference between a 400 KB page and a 4 MB one.
   * Write the real layout: '(max-width: 768px) 100vw, 33vw'.
   */
  sizes: string
}

const resolve = (url: string): string => (url.startsWith('http') ? url : `${getMediaURL()}${url}`)

/**
 * Standard responsive image, filling its positioned parent.
 *
 * Two things it does that a bare `next/image` does not:
 *
 *  1. Honours the editor's focal point. Payload stores `focalX`/`focalY` as
 *     0–100; CSS `object-position` takes percentages, so they map directly.
 *     This is why a cropped hero keeps the climber's face in frame instead of
 *     centring on empty sky.
 *  2. Uses the stored blur placeholder. The `generateBlurDataURL` hook writes
 *     a ~400-byte base64 LQIP at upload time, so there is no layout flash and
 *     no runtime cost.
 *
 * NOTE: the field is `blurDataUrl` (lowercase `rl`), not `blurDataURL`.
 * Field names with runs of capitals get mangled into Postgres columns
 * (`blurDataURL` → `blur_data_u_r_l`), so step 3 renamed it deliberately.
 */
export function CMSImage({ className, priority = false, resource, sizes }: CMSImageProps) {
  if (!resource || typeof resource !== 'object' || !resource.url) return null

  const { alt, blurDataUrl, focalX, focalY, height, url, width } = resource

  return (
    <Image
      alt={alt || ''}
      blurDataURL={blurDataUrl || undefined}
      className={className}
      fill
      placeholder={blurDataUrl ? 'blur' : 'empty'}
      priority={priority}
      sizes={sizes}
      src={resolve(url)}
      style={{
        objectFit: 'cover',
        objectPosition: `${focalX ?? 50}% ${focalY ?? 50}%`,
      }}
      {...(width && height ? {} : {})}
    />
  )
}
