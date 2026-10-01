import { ArrowLeft, CalendarDays, Clock3, Compass, Gauge, MapPin, Mountain } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import type { Trip } from '@/payload-types'

import { ArtDirectedImage } from '@/components/CMSImage/ArtDirected'

import { metres, nights, titleCase } from './format'

export function TripHero({ trip }: { trip: Trip }) {
  const destination = typeof trip.destination === 'object' ? trip.destination : null

  return (
    <section aria-label={`${trip.title} featured image`} className="tsp-hero">
      <div className="tsp-hero__media">
        <ArtDirectedImage image={trip.heroImage} priority sizes="100vw" />
      </div>
      <div aria-hidden="true" className="tsp-hero__scrim" />

      <div className="tsp-hero__inner tsp-shell">
        <nav aria-label="Breadcrumb" className="tsp-crumbs">
          <Link href="/">
            <ArrowLeft aria-hidden="true" size={14} /> Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/trips">Journeys</Link>
          <span aria-hidden="true">/</span>
          <em>{trip.title}</em>
        </nav>

        <div className="tsp-hero__foot">
          <p className="tsp-hero__kicker">
            <MapPin aria-hidden="true" size={14} /> {trip.location}
            <i aria-hidden="true" />
            {titleCase(trip.tripType)}
          </p>
          <ul className="tsp-hero__chips">
            <li>
              <Clock3 aria-hidden="true" size={15} />
              <span>
                <small>Duration</small>
                {nights(trip.durationDays)}
              </span>
            </li>
            <li>
              <Gauge aria-hidden="true" size={15} />
              <span>
                <small>Grade</small>
                {titleCase(trip.difficulty)}
              </span>
            </li>
            <li>
              <Mountain aria-hidden="true" size={15} />
              <span>
                <small>Max altitude</small>
                {metres(trip.maxAltitudeMetres)}
              </span>
            </li>
            <li>
              <CalendarDays aria-hidden="true" size={15} />
              <span>
                <small>Best season</small>
                {titleCase(trip.primeSeason)}
              </span>
            </li>
            {destination ? (
              <li>
                <Compass aria-hidden="true" size={15} />
                <span>
                  <small>Region</small>
                  {destination.title}
                </span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  )
}
