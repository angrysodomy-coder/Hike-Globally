import { useState } from 'react'
import { Plus } from 'lucide-react'

/* Vertical FAQ accordion — one panel open at a time. */
export default function TripFaqs({ faqs }) {
  const [open, setOpen] = useState(0)

  return (
    <ul className="tsp-faq">
      {faqs.map((faq, index) => {
        const isOpen = open === index
        return (
          <li key={faq.q} className={`tsp-faq__item ${isOpen ? 'is-open' : ''}`}>
            <h3>
              <button
                type="button"
                id={`tsp-faq-${index}`}
                aria-expanded={isOpen}
                aria-controls={`tsp-faq-panel-${index}`}
                onClick={() => setOpen(isOpen ? -1 : index)}
              >
                <span>{faq.q}</span>
                <i aria-hidden="true"><Plus size={18} /></i>
              </button>
            </h3>
            <div
              className="tsp-faq__panel"
              id={`tsp-faq-panel-${index}`}
              role="region"
              aria-labelledby={`tsp-faq-${index}`}
              hidden={!isOpen}
            >
              <p>{faq.a}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
