import { useState } from 'react'
import { BedDouble, ChevronDown, Minus, Mountain, Plus, Timer, Utensils } from 'lucide-react'
import ItinerarySlider from './ItinerarySlider'

/* Full itinerary — a vertical accordion. Each open day shows a fact box
   (altitude, trek duration, accommodation, meals), the day's copy, and a
   three-image slider that advances on its own. */
export default function ItineraryAccordion({ days }) {
  const [open, setOpen] = useState(() => new Set([days[0]?.id]))

  const toggle = (id) => {
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allOpen = open.size === days.length

  return (
    <div className="tsp-acc">
      <div className="tsp-acc__toolbar">
        <p>{days.length} detailed days · altitudes, lodges, walking hours and photographs</p>
        <button
          type="button"
          className="tsp-ghostBtn tsp-ghostBtn--sm"
          onClick={() => setOpen(allOpen ? new Set() : new Set(days.map((day) => day.id)))}
        >
          {allOpen ? <Minus size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
          {allOpen ? 'Collapse all days' : 'Expand all days'}
        </button>
      </div>

      <ul className="tsp-acc__list">
        {days.map((day, index) => {
          const isOpen = open.has(day.id)
          return (
            <li key={day.id} className={`tsp-acc__item ${isOpen ? 'is-open' : ''}`}>
              <h3 className="tsp-acc__heading">
                <button
                  type="button"
                  className="tsp-acc__trigger"
                  aria-expanded={isOpen}
                  aria-controls={`${day.id}-panel`}
                  id={`${day.id}-trigger`}
                  onClick={() => toggle(day.id)}
                >
                  <span className="tsp-acc__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <span className="tsp-acc__titles">
                    <small>{day.day}</small>
                    <strong>{day.title}</strong>
                  </span>
                  <span className="tsp-acc__peek" aria-hidden="true">
                    <em><Mountain size={13} /> {day.altitude}</em>
                    <em><Timer size={13} /> {day.trekDuration}</em>
                  </span>
                  <span className="tsp-acc__chev" aria-hidden="true"><ChevronDown size={20} /></span>
                </button>
              </h3>

              <div
                className="tsp-acc__panel"
                id={`${day.id}-panel`}
                role="region"
                aria-labelledby={`${day.id}-trigger`}
                hidden={!isOpen}
              >
                <div className="tsp-acc__panel-inner">
                  <dl className="tsp-factbox">
                    <div>
                      <dt><Mountain size={15} aria-hidden="true" /> Altitude</dt>
                      <dd>{day.altitude}</dd>
                    </div>
                    <div>
                      <dt><Timer size={15} aria-hidden="true" /> Trek duration</dt>
                      <dd>{day.trekDuration}</dd>
                    </div>
                    <div>
                      <dt><BedDouble size={15} aria-hidden="true" /> Accommodation</dt>
                      <dd>{day.accommodation}</dd>
                    </div>
                    <div>
                      <dt><Utensils size={15} aria-hidden="true" /> Meals</dt>
                      <dd>{day.meals}</dd>
                    </div>
                  </dl>

                  <div className="tsp-acc__copy">
                    {day.body.map((paragraph) => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)}
                  </div>

                  <ItinerarySlider images={day.images} active={isOpen} />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
