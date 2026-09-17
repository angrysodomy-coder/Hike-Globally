import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { tripsFaqs } from '../../data/content'
import Reveal from '../Reveal'

const EASE = [0.22, 1, 0.36, 1]

export default function TripFaq() {
  const [open, setOpen] = useState(0)

  return (
    <section id="tp-faq" className="tp-faq" aria-labelledby="tp-faq-title">
      <div className="shell tp-faq__layout">
        <Reveal className="tp-faq__intro">
          <p className="eyebrow"><span>06</span> Before you ask</p>
          <h2 id="tp-faq-title">The practical <em>questions.</em></h2>
          <p className="tp-faq__lede">
            The things every traveller asks before the trailhead — answered straight,
            the way our designers answer them over tea in Kathmandu.
          </p>
        </Reveal>

        <Reveal delay={110}>
          <div className="tp-faq__list">
            {tripsFaqs.map((item, index) => {
              const isOpen = open === index
              return (
                <div className="tp-faq__item" key={item.q}>
                  <button
                    type="button"
                    className="tp-faq__question"
                    aria-expanded={isOpen}
                    aria-controls={`tp-faq-panel-${index}`}
                    onClick={() => setOpen(isOpen ? -1 : index)}
                  >
                    {item.q}
                    <i aria-hidden="true"><Plus size={16} /></i>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`tp-faq-panel-${index}`}
                        className="tp-faq__answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: EASE }}
                      >
                        <p>{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
