import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { destinationFaqs } from '../../data/content'
import Reveal from '../Reveal'

const EASE = [0.22, 1, 0.36, 1]

export default function FaqSection() {
  const [open, setOpen] = useState(0)

  const toggle = (index) => setOpen((current) => (current === index ? -1 : index))

  return (
    <section className="dp-faq section-pad" aria-labelledby="dp-faq-title">
      <div className="shell dp-faq__layout">
        <Reveal className="dp-faq__intro">
          <p className="eyebrow"><span>06</span> Good to know</p>
          <h2 id="dp-faq-title">Questions,<br /><em>answered.</em></h2>
          <p className="dp-faq__lede">Everything travellers ask us before choosing a region — answered plainly, by the people who lead the trips.</p>
        </Reveal>

        <div className="dp-faq__list">
          {destinationFaqs.map((item, index) => {
            const isOpen = open === index
            return (
              <Reveal key={item.q} delay={index * 70}>
                <div className={`dp-faq__item ${isOpen ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="dp-faq__question"
                    aria-expanded={isOpen}
                    aria-controls={`dp-faq-panel-${index}`}
                    id={`dp-faq-button-${index}`}
                    onClick={() => toggle(index)}
                  >
                    <span>{item.q}</span>
                    <motion.i animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.35, ease: EASE }} aria-hidden="true">
                      <Plus size={18} />
                    </motion.i>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="panel"
                        id={`dp-faq-panel-${index}`}
                        role="region"
                        aria-labelledby={`dp-faq-button-${index}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: EASE }}
                        className="dp-faq__answer"
                      >
                        <p>{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
