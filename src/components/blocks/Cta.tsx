import Link from 'next/link'
import React from 'react'
import type { Page } from '@/payload-types'

type Props = Extract<Page['layout'][number], { blockType: 'cta' }>

export const Cta: React.FC<Props> = ({ heading, text, buttonLabel, buttonHref }) => (
  <section className="mx-auto max-w-5xl px-6 py-16">
    <div className="rounded-2xl bg-emerald-700 p-10 text-center text-white">
      <h2 className="text-3xl font-bold">{heading}</h2>
      {text && <p className="mx-auto mt-3 max-w-xl text-emerald-100">{text}</p>}
      <Link
        href={buttonHref}
        className="mt-6 inline-block rounded-xl bg-white px-8 py-3 font-semibold text-emerald-700 hover:bg-emerald-50"
      >
        {buttonLabel}
      </Link>
    </div>
  </section>
)
