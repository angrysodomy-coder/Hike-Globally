import { Bed, ChevronDown, Mountain, Utensils } from 'lucide-react'
import React from 'react'

import type { Trip } from '@/payload-types'

import { CMSImage } from '@/components/CMSImage'
import { RichText } from '@/components/RichText'

import { metres } from './format'

type Day = NonNullable<Trip['itinerary']>[number]

const mealLabel = (meals: Day['meals']): null | string => {
  if (!meals?.length) return null
  return meals.map((m) => m.charAt(0).toUpperCase()).join(' · ')
}

/**
 * Full day-by-day itinerary.
 *
 * Built on native `<details>/<summary>` instead of the Vite version's
 * useState accordion. That is a deliberate downgrade in machinery and an
 * upgrade in behaviour: it is a pure server component (zero JS shipped), it
 * works before hydration, Ctrl+F finds text inside collapsed days in Chrome,
 * and the open/close state is accessible for free. The `.is-open` styling
 * hook the original CSS toggled in JS is reproduced from `details[open]` in
 * trip-single-next.css.
 */
export function TripItinerary({ days }: { days: Day[] }) {
  return (
    <div className="tsp-acc">
      <ul className="tsp-acc__list">
        {days.map((day, index) => {
          const meals = mealLabel(day.meals)

          return (
            <li className="tsp-acc__item" key={day.id ?? index}>
              <details name="itinerary" open={index === 0}>
                <summary className="tsp-acc__trigger">
                  <span aria-hidden="true" className="tsp-acc__index">
                    {index + 1}
                  </span>
                  <span className="tsp-acc__titles">
                    <small>
                      Day {index + 1}
                      {day.isAcclimatisationDay ? ' · Acclimatisation' : ''}
                    </small>
                    <strong>{day.title}</strong>
                  </span>
                  <span className="tsp-acc__peek">
                    {typeof day.altitudeMetres === 'number' ? metres(day.altitudeMetres) : null}
                    {day.walkingHours ? <i aria-hidden="true" /> : null}
                    {day.walkingHours}
                  </span>
                  <span aria-hidden="true" className="tsp-acc__chev">
                    <ChevronDown size={16} />
                  </span>
                </summary>

                <div className="tsp-acc__panel">
                  <div className="tsp-acc__panel-inner">
                    <dl className="tsp-factbox">
                      {typeof day.altitudeMetres === 'number' ? (
                        <div>
                          <dt>
                            <Mountain aria-hidden="true" size={13} /> Altitude
                          </dt>
                          <dd>{metres(day.altitudeMetres)}</dd>
                        </div>
                      ) : null}
                      {day.walkingHours ? (
                        <div>
                          <dt>Walking</dt>
                          <dd>{day.walkingHours}</dd>
                        </div>
                      ) : null}
                      {typeof day.distanceKm === 'number' ? (
                        <div>
                          <dt>Distance</dt>
                          <dd>{day.distanceKm} km</dd>
                        </div>
                      ) : null}
                      {typeof day.ascentMetres === 'number' ? (
                        <div>
                          <dt>Ascent</dt>
                          <dd>{metres(day.ascentMetres)}</dd>
                        </div>
                      ) : null}
                      {day.accommodation ? (
                        <div>
                          <dt>
                            <Bed aria-hidden="true" size={13} /> Night
                          </dt>
                          <dd>{day.accommodation}</dd>
                        </div>
                      ) : null}
                      {meals ? (
                        <div>
                          <dt>
                            <Utensils aria-hidden="true" size={13} /> Meals
                          </dt>
                          <dd>{meals}</dd>
                        </div>
                      ) : null}
                    </dl>

                    <RichText className="tsp-acc__copy tsp-prose" data={day.body} />

                    {day.gallery?.length ? (
                      <div className="tsp-acc__shots">
                        {day.gallery.slice(0, 3).map((shot, i) => (
                          <figure key={typeof shot === 'object' ? shot.id : i}>
                            <CMSImage
                              resource={shot}
                              sizes="(max-width: 767px) 90vw, 30vw"
                            />
                          </figure>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </details>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
