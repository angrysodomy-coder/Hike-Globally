import React from 'react'

/**
 * The numbered section header used down the whole trip article.
 * Matches the `.tsp-secHead` markup in src/styles/trip-single.css.
 */
export function SectionHead({
  eyebrow,
  id,
  index,
  intro,
  title,
}: {
  eyebrow: string
  id?: string
  index: string
  intro?: string
  title: string
}) {
  return (
    <header className="tsp-secHead">
      <p className="tsp-eyebrow">
        <span aria-hidden="true">{index}</span>
        {eyebrow}
      </p>
      <h2 id={id}>{title}</h2>
      {intro ? <p className="tsp-secHead__intro">{intro}</p> : null}
    </header>
  )
}
