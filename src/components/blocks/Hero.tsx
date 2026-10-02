import Link from 'next/link'
import React from 'react'
import type { Page } from '@/payload-types'
import { PayloadImage } from '@/components/PayloadImage'

type Props = Extract<Page['layout'][number], { blockType: 'hero' }>

export const Hero: React.FC<Props> = ({ heading, subheading, image, cta }) => (
  <section className="relative h-[70vh] min-h-[480px] w-full">
    <PayloadImage media={image} sizeName="hero" fill priority sizes="100vw" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
    <div className="absolute inset-0 flex items-end">
      <div className="mx-auto w-full max-w-6xl px-6 pb-16 text-white">
        <h1 className="max-w-3xl text-4xl font-bold md:text-6xl">{heading}</h1>
        {subheading && <p className="mt-4 max-w-2xl text-lg text-white/90">{subheading}</p>}
        {cta?.label && cta?.href && (
          <Link
            href={cta.href}
            className="mt-8 inline-block rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </div>
  </section>
)
