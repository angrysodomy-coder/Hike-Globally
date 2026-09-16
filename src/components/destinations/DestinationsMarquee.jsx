import { destinationMarquee } from '../../data/content'
import { Mountain } from 'lucide-react'

/* A two-copy CSS-driven marquee. The track is duplicated so the loop is
   seamless; `aria-hidden` hides the clone from assistive tech. */
export default function DestinationsMarquee() {
  const row = (
    <div className="dp-marquee__group" aria-hidden="false">
      {destinationMarquee.map((word) => (
        <span className="dp-marquee__item" key={word}>
          <span>{word}</span>
          <Mountain size={15} aria-hidden="true" />
        </span>
      ))}
    </div>
  )

  return (
    <div className="dp-marquee" aria-label="Himalayan regions">
      <div className="dp-marquee__track">
        {row}
        <div className="dp-marquee__group" aria-hidden="true">
          {destinationMarquee.map((word) => (
            <span className="dp-marquee__item" key={`clone-${word}`}>
              <span>{word}</span>
              <Mountain size={15} aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
