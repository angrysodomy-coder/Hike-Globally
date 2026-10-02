import React from 'react'
import type { Page } from '@/payload-types'
import { PayloadImage } from '@/components/PayloadImage'

type Props = Extract<Page['layout'][number], { blockType: 'mediaBlock' }>

export const MediaSection: React.FC<Props> = ({ image, caption }) => (
  <section className="mx-auto max-w-5xl px-6 py-12">
    <figure>
      <div className="overflow-hidden rounded-2xl">
        <PayloadImage media={image} sizeName="hero" sizes="(max-width: 1024px) 100vw, 1024px" />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-500">{caption}</figcaption>
      )}
    </figure>
  </section>
)
