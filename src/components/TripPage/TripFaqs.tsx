import { ChevronDown } from 'lucide-react'
import React from 'react'

import type { Trip } from '@/payload-types'

import { RichText } from '@/components/RichText'

type Faq = NonNullable<Trip['faqs']>[number]

/**
 * FAQ list. Native `<details>` again — and here it matters for more than
 * bundle size: Google will only award an FAQ rich result when the answer text
 * is present in the HTML. A JS-gated accordion that renders answers on click
 * does not qualify, no matter how correct the JSON-LD is.
 */
export function TripFaqs({ faqs }: { faqs: Faq[] }) {
  return (
    <ul className="tsp-faq">
      {faqs.map((faq, index) => (
        <li className="tsp-faq__item" key={faq.id ?? index}>
          <details name="faqs">
            <summary className="tsp-acc__trigger">
              <span className="tsp-acc__titles">
                <strong>{faq.question}</strong>
              </span>
              <span aria-hidden="true" className="tsp-acc__chev">
                <ChevronDown size={16} />
              </span>
            </summary>
            <div className="tsp-faq__panel">
              <RichText className="tsp-prose" data={faq.answer} />
            </div>
          </details>
        </li>
      ))}
    </ul>
  )
}
