import { ArrowRight, ShieldCheck } from 'lucide-react'
import React from 'react'

import type { Departure, Trip } from '@/payload-types'

import { longDate, money, shortDate } from './format'

const STATUS_LABEL: Record<string, string> = {
  available: 'Available',
  limited: 'Few places left',
  'sold-out': 'Sold out',
}

/**
 * Departure list, grouped by month.
 *
 * Server-rendered from live `departures` rows, so availability is accurate at
 * the moment the page was last revalidated — and the `revalidateDeparture`
 * hook purges this page's tag on every seat change, so "accurate" means
 * within seconds, not within an hour.
 */
export function TripDepartures({
  departures,
  trip,
}: {
  departures: Departure[]
  trip: Trip
}) {
  if (departures.length === 0) {
    return (
      <p className="tsp-calendar__note">
        No scheduled departures are open right now. We run this trek privately on any date that
        suits you — <a href="#enquire">ask for a private departure</a>.
      </p>
    )
  }

  const months = new Map<string, Departure[]>()
  for (const d of departures) {
    const key = new Date(d.startDate).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    })
    const bucket = months.get(key)
    if (bucket) bucket.push(d)
    else months.set(key, [d])
  }

  return (
    <div className="tsp-calendar">
      {[...months.entries()].map(([month, rows]) => (
        <section className="tsp-calendar__month" key={month}>
          <h3 className="tsp-calendar__head">{month}</h3>
          <ul className="tsp-depList">
            {rows.map((d) => {
              const soldOut = d.status === 'sold-out'

              return (
                <li className={`tsp-depRow is-${d.status}`} key={d.id}>
                  <div className="tsp-depRow__dates">
                    <strong>{longDate(d.startDate)}</strong>
                    {d.endDate ? <span>→ {shortDate(d.endDate)}</span> : null}
                  </div>

                  <div className="tsp-depRow__status">
                    <span className={`tsp-pill tsp-pill--${d.status}`}>
                      {STATUS_LABEL[d.status] ?? d.status}
                    </span>
                    {d.guaranteed ? (
                      <span className="tsp-depRow__guaranteed">
                        <ShieldCheck aria-hidden="true" size={13} /> Guaranteed
                      </span>
                    ) : null}
                    {!soldOut && d.spotsRemaining <= 4 ? (
                      <span className="tsp-depRow__seats">{d.spotsRemaining} places left</span>
                    ) : null}
                  </div>

                  <div className="tsp-depRow__price">{money(d.price ?? trip.basePrice, trip.currency)}</div>

                  <div className="tsp-depRow__cta">
                    {soldOut ? (
                      <span className="tsp-ghost is-disabled">Sold out</span>
                    ) : (
                      <a className="tsp-ghost" href={`#enquire?departure=${d.id}`}>
                        Reserve <ArrowRight aria-hidden="true" size={14} />
                      </a>
                    )}
                  </div>

                  {d.note ? <p className="tsp-depRow__note">{d.note}</p> : null}
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <p className="tsp-calendar__assure">
        <ShieldCheck aria-hidden="true" size={15} /> No payment is taken on this page. We hold your
        place for 48 hours while you confirm flights.
      </p>
    </div>
  )
}
