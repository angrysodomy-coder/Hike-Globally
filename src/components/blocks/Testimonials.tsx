import React from 'react'
import type { Page, Testimonial } from '@/payload-types'

type Props = Extract<Page['layout'][number], { blockType: 'testimonialsBlock' }>

export const Testimonials: React.FC<Props> = ({ heading, testimonials }) => {
  const resolved = (testimonials ?? []).filter(
    (t): t is Testimonial => typeof t === 'object' && t !== null,
  )
  if (resolved.length === 0) return null

  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-6xl px-6">
        {heading && <h2 className="text-3xl font-bold text-gray-900">{heading}</h2>}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {resolved.map((t) => (
            <blockquote
              key={t.id}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              {typeof t.rating === 'number' && (
                <div aria-label={`${t.rating} out of 5 stars`} className="text-amber-400">
                  {'★'.repeat(t.rating)}
                  <span className="text-gray-300">{'★'.repeat(5 - t.rating)}</span>
                </div>
              )}
              <p className="mt-3 flex-1 text-gray-700">“{t.quote}”</p>
              <footer className="mt-4 text-sm">
                <span className="font-semibold text-gray-900">{t.authorName}</span>
                {t.authorLocation && <span className="text-gray-500"> · {t.authorLocation}</span>}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
