import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Page } from '@/payload-types'

type Props = Extract<Page['layout'][number], { blockType: 'faqBlock' }>

export const Faq: React.FC<Props> = ({ heading, items }) => {
  if (!items || items.length === 0) return null

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      {heading && <h2 className="text-3xl font-bold text-gray-900">{heading}</h2>}
      <div className="mt-6 divide-y divide-gray-200">
        {items.map((item) => (
          <details key={item.id} className="group py-4">
            <summary className="cursor-pointer list-none font-semibold text-gray-900">
              {item.question}
            </summary>
            <div className="cms-prose cms-prose--sm mt-2 max-w-none">
              <RichText data={item.answer} />
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
