import type { Metadata } from 'next'

import { Check, X } from 'lucide-react'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import React from 'react'

import { CMSImage } from '@/components/CMSImage'
import { JsonLd } from '@/components/JsonLd'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { RichText } from '@/components/RichText'
import { SectionHead } from '@/components/TripPage/SectionHead'
import { metres, money, nights, titleCase } from '@/components/TripPage/format'
import { TripDepartures } from '@/components/TripPage/TripDepartures'
import { TripFaqs } from '@/components/TripPage/TripFaqs'
import { TripHero } from '@/components/TripPage/TripHero'
import { TripItinerary } from '@/components/TripPage/TripItinerary'
import { TripPriceRail } from '@/components/TripPage/TripPriceRail'
import { lexicalToPlainText } from '@/hooks/populateReadingTime'
import { getAllTripSlugs, getTripBySlug, getTripDepartures } from '@/lib/queries/trips'
import { breadcrumbJsonLd, faqJsonLd, tripJsonLd } from '@/lib/seo/jsonLd'
import { generateMeta } from '@/lib/seo/generateMeta'

/**
 * Pre-render every published trip at build time. There are tens of these, not
 * thousands, and they are the highest-intent pages on the site — none of them
 * should ever cost a visitor a cold render.
 */
export async function generateStaticParams() {
  const slugs = await getAllTripSlugs()
  return slugs.map((slug) => ({ slug }))
}

/**
 * `true` lets a trip published after the last build render on demand and then
 * stay cached, instead of 404ing until someone redeploys. The revalidation
 * hooks keep it fresh from there.
 */
export const dynamicParams = true

/**
 * A SAFETY NET, not the mechanism. Freshness comes from `revalidateTrip` /
 * `revalidateDeparture` calling `revalidateTag` the instant an editor saves;
 * this hour-long floor only catches changes that bypassed the hooks entirely
 * (a direct SQL edit, a restored backup).
 */
export const revalidate = 3600

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  // Deduped with the call below by React `cache()` — one query, not two.
  const trip = await getTripBySlug(slug)

  return generateMeta({ doc: trip, pathname: `/trips/${slug}` })
}

export default async function TripPage({ params }: { params: Params }) {
  const { slug } = await params
  const { isEnabled: draft } = await draftMode()

  const trip = await getTripBySlug(slug)
  if (!trip) notFound()

  const departures = await getTripDepartures(trip.id)
  const destination = typeof trip.destination === 'object' ? trip.destination : null

  const faqs = trip.faqs ?? []
  const structuredData: Record<string, unknown>[] = [
    tripJsonLd(trip, departures),
    breadcrumbJsonLd([
      { name: 'Home', url: '/' },
      { name: 'Journeys', url: '/trips' },
      { name: trip.title, url: `/trips/${trip.slug}` },
    ]),
  ]

  if (faqs.length) {
    structuredData.push(
      faqJsonLd(
        faqs.map((faq) => ({
          answerPlain: lexicalToPlainText(faq.answer),
          question: faq.question,
        })),
      ),
    )
  }

  return (
    <main className="tsp" id="main-content">
      <JsonLd data={structuredData} />
      {draft ? <LivePreviewListener /> : null}

      <TripHero trip={trip} />

      <div className="tsp-layout">
        <TripPriceRail departures={departures} trip={trip} />

        <article className="tsp-article">
          <header className="tsp-lede">
            <p className="tsp-lede__tag">
              {destination ? `${destination.title} · ` : ''}
              {titleCase(trip.tripType)}
            </p>
            <h1>{trip.title}</h1>
            <p className="tsp-lede__excerpt">{trip.summary}</p>
          </header>

          {/* 01 · Highlights */}
          {trip.highlights?.length ? (
            <section aria-labelledby="highlights-title" className="tsp-section" id="highlights">
              <SectionHead
                eyebrow="Why this trek"
                id="highlights-title"
                index="01"
                title="Trip highlights"
              />
              <div className="tsp-highlights">
                <ul>
                  {trip.highlights.map((item, i) => (
                    <li key={item.id ?? i}>
                      <i aria-hidden="true">
                        <Check size={13} />
                      </i>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {/* 02 · Overview */}
          {trip.overview ? (
            <section aria-labelledby="overview-title" className="tsp-section" id="overview">
              <SectionHead
                eyebrow="The route, honestly"
                id="overview-title"
                index="02"
                title="Trek overview"
              />
              <RichText className="tsp-prose" data={trip.overview} />
              <blockquote className="tsp-pull">{trip.highlight}</blockquote>
            </section>
          ) : null}

          {/* 03 · Outline */}
          {trip.itinerary?.length ? (
            <section
              aria-labelledby="outline-title"
              className="tsp-section"
              id="itinerary-outline"
            >
              <SectionHead
                eyebrow="At a glance"
                id="outline-title"
                index="03"
                intro="The shape of the journey in one screen. Full detail — altitudes, lodges, walking hours and photographs — is in section 05."
                title="Day-to-day itinerary"
              />
              <ol className="tsp-outline">
                {trip.itinerary.map((day, i) => (
                  <li key={day.id ?? i}>
                    <span className="tsp-outline__day">Day {i + 1}</span>
                    <span className="tsp-outline__title">{day.title}</span>
                    <span className="tsp-outline__meta">
                      {metres(day.altitudeMetres)}
                      {day.walkingHours ? <i aria-hidden="true" /> : null}
                      {day.walkingHours}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* 04 · Departures */}
          <section
            aria-labelledby="booking-title"
            className="tsp-section tsp-section--booking"
            id="booking"
          >
            <SectionHead
              eyebrow="Departure dates"
              id="booking-title"
              index="04"
              intro="Pick a date and we will hold your place for 48 hours. No payment is taken on this page."
              title="Book your departure"
            />
            <TripDepartures departures={departures} trip={trip} />
          </section>

          {/* 05 · Full itinerary */}
          {trip.itinerary?.length ? (
            <section aria-labelledby="itinerary-title" className="tsp-section" id="itinerary">
              <SectionHead
                eyebrow="Every single day"
                id="itinerary-title"
                index="05"
                intro="Open any day for its altitude, walking hours, lodge, meals and the story of the stage."
                title="Full itinerary details"
              />
              <TripItinerary days={trip.itinerary} />
            </section>
          ) : null}

          {/* 06 · Includes & excludes */}
          {trip.includes?.length || trip.excludes?.length ? (
            <section aria-labelledby="inclusions-title" className="tsp-section" id="inclusions">
              <SectionHead
                eyebrow="The full picture"
                id="inclusions-title"
                index="06"
                intro="No asterisks and no on-trail surprises. If it is in the left column, it is paid for."
                title="What’s included & excluded"
              />
              <div className="tsp-inex">
                <div className="tsp-inex__col tsp-inex__col--in">
                  <header>
                    <span aria-hidden="true">
                      <Check size={17} />
                    </span>
                    <h3>What’s included</h3>
                  </header>
                  <ul>
                    {(trip.includes ?? []).map((item, i) => (
                      <li key={item.id ?? i}>
                        <i aria-hidden="true">
                          <Check size={13} />
                        </i>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="tsp-inex__col tsp-inex__col--ex">
                  <header>
                    <span aria-hidden="true">
                      <X size={17} />
                    </span>
                    <h3>What’s excluded</h3>
                  </header>
                  <ul>
                    {(trip.excludes ?? []).map((item, i) => (
                      <li key={item.id ?? i}>
                        <i aria-hidden="true">
                          <X size={13} />
                        </i>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          {/* 07 · Essential information */}
          {trip.essentialInfo?.length ? (
            <section
              aria-labelledby="essential-title"
              className="tsp-section"
              id="essential-information"
            >
              <SectionHead
                eyebrow="Before you fly"
                id="essential-title"
                index="07"
                title="Essential information"
              />
              <div className="tsp-prose tsp-prose--split">
                {trip.essentialInfo.map((block, i) => (
                  <div className="tsp-prose__block" key={block.id ?? i}>
                    <h3>{block.title}</h3>
                    <RichText data={block.body} />
                  </div>
                ))}
              </div>

              {trip.permits?.length ? (
                <dl className="tsp-factbox">
                  {trip.permits.map((permit, i) => (
                    <div key={permit.id ?? i}>
                      <dt>{permit.name}</dt>
                      <dd>{permit.handledByUs ? 'Handled by us' : 'Arranged by you'}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </section>
          ) : null}

          {/* 08 · Route map */}
          {trip.routeMap?.image ? (
            <section aria-labelledby="map-title" className="tsp-section" id="route-map">
              <SectionHead
                eyebrow="Where you actually walk"
                id="map-title"
                index="08"
                title="Route map"
              />
              <figure className="tsp-map">
                <div className="tsp-map__frame">
                  <CMSImage
                    resource={trip.routeMap.image}
                    sizes="(max-width: 1100px) 92vw, 760px"
                  />
                </div>
                {trip.routeMap.caption ? <figcaption>{trip.routeMap.caption}</figcaption> : null}
              </figure>
              {trip.routeMap.legend?.length ? (
                <dl className="tsp-factbox">
                  {trip.routeMap.legend.map((row, i) => (
                    <div key={row.id ?? i}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </section>
          ) : null}

          {/* 09 · Packing list */}
          {trip.packingList?.length ? (
            <section aria-labelledby="packing-title" className="tsp-section" id="packing-list">
              <SectionHead
                eyebrow="What to bring"
                id="packing-title"
                index="09"
                title="Packing list"
              />
              <div className="tsp-packing">
                {trip.packingList.map((group, i) => (
                  <div className="tsp-packing__box" key={group.id ?? i}>
                    <h3>{group.title}</h3>
                    {group.note ? <p>{group.note}</p> : null}
                    <ul>
                      {(group.items ?? []).map((item, j) => (
                        <li key={item.id ?? j}>{item.text}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* 10 · FAQs */}
          {faqs.length ? (
            <section aria-labelledby="faq-title" className="tsp-section" id="faqs">
              <SectionHead
                eyebrow="Asked before every trek"
                id="faq-title"
                index="10"
                title="Frequently asked questions"
              />
              <TripFaqs faqs={faqs} />
            </section>
          ) : null}

          <section className="tsp-closing" id="enquire">
            <div className="tsp-closing__inner">
              <h2>Ready to walk {trip.title}?</h2>
              <p>
                {nights(trip.durationDays)} · {titleCase(trip.difficulty)} ·{' '}
                {metres(trip.maxAltitudeMetres)} · from {money(trip.basePrice, trip.currency)}
              </p>
              <div className="tsp-closing__actions">
                <a className="tsp-bookBtn tsp-bookBtn--wide" href="#booking">
                  <span aria-hidden="true" className="tsp-bookBtn__shine" />
                  <span className="tsp-bookBtn__label">See departure dates</span>
                </a>
              </div>
            </div>
          </section>
        </article>
      </div>
    </main>
  )
}
