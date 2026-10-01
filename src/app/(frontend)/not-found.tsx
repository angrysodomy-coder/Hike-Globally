import Link from 'next/link'
import React from 'react'

export default function NotFound() {
  return (
    <main className="tsp" id="main-content">
      <div className="tsp-shell" style={{ padding: '18vh 0 12vh', textAlign: 'center' }}>
        <p className="tsp-eyebrow">
          <span aria-hidden="true">404</span>Off the trail
        </p>
        <h1>We could not find that page</h1>
        <p className="tsp-lede__excerpt" style={{ marginInline: 'auto', maxWidth: '46ch' }}>
          The link may be out of date, or the journey may have been retired for the season.
        </p>
        <p style={{ marginTop: 28 }}>
          <Link className="tsp-ghost" href="/trips">
            Browse all journeys
          </Link>
        </p>
      </div>
    </main>
  )
}
