import { ChevronDown } from 'lucide-react'
import React from 'react'

import type { FAQBlock } from '@/payload-types'

import { JsonLd } from '@/components/JsonLd'
import { RichText } from '@/components/RichText'
import { lexicalToPlainText } from '@/hooks/populateReadingTime'
import { faqJsonLd } from '@/lib/seo/jsonLd'

/**
 * `emitStructuredData` is per-block and defaults off for a reason: Google
 * only honours ONE FAQPage per URL. Two FAQ blocks on one page both emitting
 * it produces a duplicate-schema warning and can suppress the rich result
 * entirely, so the editor opts in on exactly one.
 */
export function FAQBlockComponent({ emitStructuredData, heading, items }: FAQBlock) {
  if (!items?.length) return null

  return (
    <section className="blk-faq section-pad">
      {emitStructuredData ? (
        <JsonLd
          data={faqJsonLd(
            items.map((item) => ({
              answerPlain: lexicalToPlainText(item.answer),
              question: item.question,
            })),
          )}
        />
      ) : null}

      <div className="shell">
        {heading ? <h2>{heading}</h2> : null}

        <ul className="tsp-faq">
          {items.map((item, i) => (
            <li className="tsp-faq__item" key={item.id ?? i}>
              <details name="blk-faq">
                <summary className="tsp-acc__trigger">
                  <span className="tsp-acc__titles">
                    <strong>{item.question}</strong>
                  </span>
                  <span aria-hidden="true" className="tsp-acc__chev">
                    <ChevronDown size={16} />
                  </span>
                </summary>
                <div className="tsp-faq__panel">
                  <RichText className="tsp-prose" data={item.answer} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
