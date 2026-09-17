import { Mountain } from 'lucide-react'
import { tripsMarquee } from '../../data/content'

export default function TripsMarquee() {
  const group = (ariaHidden) => (
    <div className="tp-marquee__group" aria-hidden={ariaHidden || undefined}>
      {tripsMarquee.map((name) => (
        <span className="tp-marquee__item" key={name}>
          {name}
          <Mountain size={17} aria-hidden="true" />
        </span>
      ))}
    </div>
  )

  return (
    <div className="tp-marquee" aria-label="The eight journeys in the collection">
      <div className="tp-marquee__track">
        {group(false)}
        {group(true)}
      </div>
    </div>
  )
}
