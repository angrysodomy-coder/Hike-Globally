import Image from 'next/image'
import React from 'react'
import type { Media } from '@/payload-types'

type Props = {
  media: Media | number | null | undefined
  /** Which pre-generated Payload rendition to serve — pick the one closest to the layout slot. */
  sizeName?: 'thumbnail' | 'card' | 'tablet' | 'hero' | 'og'
  className?: string
  /** Set true ONLY on the LCP/hero image. */
  priority?: boolean
  sizes?: string
  fill?: boolean
}

export const PayloadImage: React.FC<Props> = ({
  media,
  sizeName = 'card',
  className,
  priority,
  sizes,
  fill,
}) => {
  if (!media || typeof media !== 'object' || !media.url) return null

  const rendition = media.sizes?.[sizeName]
  const src = rendition?.url ?? media.url
  const width = rendition?.width ?? media.width ?? 1200
  const height = rendition?.height ?? media.height ?? 800

  if (fill) {
    return (
      <Image
        src={src}
        alt={media.alt}
        fill
        className={className}
        priority={priority}
        sizes={sizes ?? '100vw'}
        style={{ objectFit: 'cover' }}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={media.alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
    />
  )
}
