import React from 'react'

import type { SeasonMatrixBlock } from '@/payload-types'

const MONTHS: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Aug',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dec',
}

const RATING_LABEL: Record<string, string> = {
  good: 'Good',
  mixed: 'Mixed',
  poor: 'Poor',
  prime: 'Prime',
}

/**
 * A real `<table>`, not a grid of divs.
 *
 * The rating is also written as text in each cell rather than conveyed by
 * colour alone — a colour-only legend fails WCAG 1.4.1 and is unreadable to
 * roughly one in twelve men.
 */
export function SeasonMatrixBlockComponent({ heading, intro, rows }: SeasonMatrixBlock) {
  if (!rows?.length) return null

  return (
    <section className="blk-season section-pad">
      <div className="shell">
        {heading ? <h2>{heading}</h2> : null}
        {intro ? <p className="blk-intro">{intro}</p> : null}

        <table className="blk-season__table">
          <caption className="sr-only">Month-by-month trekking conditions</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Conditions</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id ?? i}>
                <th scope="row">{MONTHS[row.month] ?? row.month}</th>
                <td>
                  <span className={`blk-season__pill is-${row.rating}`}>
                    {RATING_LABEL[row.rating] ?? row.rating}
                  </span>
                </td>
                <td>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
