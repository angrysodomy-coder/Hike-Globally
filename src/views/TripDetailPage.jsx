import { useMemo } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Compass,
  Gauge,
  MapPin,
  Mountain,
  Star,
  X,
} from 'lucide-react'
import { getTripBySlug } from '../data/tripDetails'
import { buildDepartures, getTripPageContent } from '../data/tripPageContent'
import { Link, usePageMeta } from '../lib/router'
import Reveal from '../components/Reveal'
import TripPriceRail from '../components/trip/TripPriceRail'
import TripBookingCalendar from '../components/trip/TripBookingCalendar'
import ItineraryAccordion from '../components/trip/ItineraryAccordion'
import TripFaqs from '../components/trip/TripFaqs'

/* ------------------------------------------------------------------
   Single trip page — /trips/<slug>

   Reading order, top to bottom:
     hero · title · excerpt · byline · highlights · overview ·
     day-to-day outline · booking calendar · full itinerary ·
     includes & excludes · essential information · route map ·
     packing list · FAQs

   A sticky left rail carries the price and the Book now CTA on every
   screen wide enough to hold it, and folds into a full-width card
   above the article below 1080px.
   ------------------------------------------------------------------ */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatShortDate(iso) {
  if (!iso) return 'On request'
  const [year, month, day] = iso.split('-').map(Number)
  return `${day} ${MONTHS_SHORT[month - 1]} ${year}`
}

function SectionHead({ index, eyebrow, title, intro, id }) {
  return (
    <header className="tsp-secHead">
      <p className="tsp-eyebrow"><span>{index}</span> {eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {intro && <p className="tsp-secHead__intro">{intro}</p>}
    </header>
  )
}

function NotFound() {
  usePageMeta({ title: 'Journey not found — Hike Globally' })
  return (
    <main id="main-content" className="trip-detail trip-detail--missing">
      <div className="shell">
        <p className="eyebrow"><span>—</span> Off the map</p>
        <h1>We couldn’t find that journey.</h1>
        <p>The trail you followed doesn’t match any of our current departures.</p>
        <Link className="button button--dark" href="/trips">
          <span>Browse all journeys</span><ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </main>
  )
}

export default function TripDetailPage({ slug, onBook, cmsTrip }) {
  const content = useMemo(() => getTripPageContent(slug, cmsTrip), [slug, cmsTrip])
  const trip = content?.trip || getTripBySlug(slug)

  const nextDeparture = useMemo(() => {
    if (!trip) return null
    const departures = buildDepartures(trip)
    const iso = Object.keys(departures).sort().find((key) => departures[key].status !== 'sold-out')
    return iso || null
  }, [trip])

  usePageMeta({
    title: trip ? `${trip.title} — ${trip.duration} trek, itinerary & dates | Hike Globally` : 'Journey not found — Hike Globally',
    description: content?.excerpt || trip?.description,
  })

  if (!trip || !content) return <NotFound />

  const { author } = content

  return (
    <main id="main-content" className="tsp">
      {/* ---------- 1 · Hero + featured image ---------- */}
      <section className="tsp-hero" aria-label={`${trip.title} featured image`}>
        <div className="tsp-hero__media">
          <img
            src={trip.image}
            alt={trip.alt}
            style={{ objectPosition: trip.imagePosition }}
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div className="tsp-hero__scrim" aria-hidden="true" />

        <div className="tsp-hero__inner tsp-shell">
          <nav className="tsp-crumbs" aria-label="Breadcrumb">
            <Link href="/"><ArrowLeft size={14} aria-hidden="true" /> Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/trips">Journeys</Link>
            <span aria-hidden="true">/</span>
            <em>{trip.title}</em>
          </nav>

          <div className="tsp-hero__foot">
            <p className="tsp-hero__kicker">
              <MapPin size={14} aria-hidden="true" /> {trip.location}
              <i aria-hidden="true" />
              {trip.type}
              <i aria-hidden="true" />
              <Star size={13} aria-hidden="true" className="tsp-hero__star" /> 4.9 · 218 reviews
            </p>
            <ul className="tsp-hero__chips">
              <li><Clock3 size={15} aria-hidden="true" /> <span><small>Duration</small>{trip.duration}</span></li>
              <li><Gauge size={15} aria-hidden="true" /> <span><small>Grade</small>{trip.difficulty}</span></li>
              <li><Mountain size={15} aria-hidden="true" /> <span><small>Max altitude</small>{trip.elevation}</span></li>
              <li><CalendarDays size={15} aria-hidden="true" /> <span><small>Best season</small>{trip.prime}</span></li>
              <li><Compass size={15} aria-hidden="true" /> <span><small>Region</small>{trip.destination}</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Layout: left price rail + article ----------
          85% of the viewport, centered — the hero above stays full-bleed. */}
      <div className="tsp-layout">
        <TripPriceRail trip={trip} nextDeparture={formatShortDate(nextDeparture)} onBook={onBook} />

        <article className="tsp-article">
          {/* 2 · Title  3 · Excerpt  4 · Byline */}
          <header className="tsp-lede">
            <p className="tsp-lede__tag">{trip.destination} · {trip.type}</p>
            <h1>{trip.title}</h1>
            <p className="tsp-lede__excerpt">{content.excerpt}</p>

            <div className="tsp-byline">
              <span className="tsp-byline__avatar" aria-hidden="true">{author.initials}</span>
              <div className="tsp-byline__who">
                <p className="tsp-byline__name">{author.name}</p>
                <p className="tsp-byline__role">{author.role}</p>
              </div>
              <dl className="tsp-byline__meta">
                <div><dt>Published</dt><dd>{content.published}</dd></div>
                <div><dt>Updated</dt><dd>{content.updated}</dd></div>
                <div><dt>Reading time</dt><dd>{content.readingTime}</dd></div>
              </dl>
            </div>
          </header>

          {/* 5 · Highlights */}
          <Reveal as="section" className="tsp-section" id="highlights" aria-labelledby="highlights-title">
            <SectionHead index="01" eyebrow="Why this trek" title="Trip highlights" id="highlights-title" />
            <div className="tsp-highlights">
              <ul>
                {content.highlights.map((item) => (
                  <li key={item}><i aria-hidden="true"><Check size={13} /></i><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* 6 · Overview */}
          <Reveal as="section" className="tsp-section" id="overview" aria-labelledby="overview-title">
            <SectionHead index="02" eyebrow="The route, honestly" title="Trek overview" id="overview-title" />
            <div className="tsp-prose">
              {content.overview.map((paragraph) => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)}
              <blockquote>“{trip.highlight}” — the moment the whole itinerary is built around.</blockquote>
            </div>
          </Reveal>

          {/* 7 · Day-to-day outline */}
          <Reveal as="section" className="tsp-section" id="itinerary-outline" aria-labelledby="outline-title">
            <SectionHead
              index="03"
              eyebrow="At a glance"
              title="Day-to-day itinerary"
              intro="The shape of the journey in one screen. Full detail — altitudes, lodges, walking hours and photographs — is in section 05."
              id="outline-title"
            />
            <ol className="tsp-outline">
              {content.outline.map((day) => (
                <li key={day.id}>
                  <span className="tsp-outline__day">{day.day}</span>
                  <span className="tsp-outline__title">{day.title}</span>
                  <span className="tsp-outline__meta">{day.altitude}<i aria-hidden="true" />{day.trekDuration}</span>
                </li>
              ))}
            </ol>
          </Reveal>

          {/* 8 · Booking calendar */}
          <Reveal as="section" className="tsp-section tsp-section--booking" id="booking" aria-labelledby="booking-title">
            <SectionHead
              index="04"
              eyebrow="Departure dates"
              title="Book your departure"
              intro="Pick a date, tell us who is coming, and we will hold your place for 48 hours. No payment is taken on this page."
              id="booking-title"
            />
            <TripBookingCalendar trip={trip} />
          </Reveal>

          {/* 9 · Full itinerary */}
          <Reveal as="section" className="tsp-section" id="itinerary" aria-labelledby="itinerary-title">
            <SectionHead
              index="05"
              eyebrow="Every single day"
              title="Full itinerary details"
              intro="Open any day for its altitude, walking hours, lodge, meals, the story of the stage and photographs from the trail."
              id="itinerary-title"
            />
            <ItineraryAccordion days={content.itinerary} />
          </Reveal>

          {/* 10 · Includes & excludes */}
          <Reveal as="section" className="tsp-section" id="inclusions" aria-labelledby="inclusions-title">
            <SectionHead
              index="06"
              eyebrow="The full picture"
              title="What’s included & excluded"
              intro="No asterisks and no on-trail surprises. If it is in the left column, it is paid for."
              id="inclusions-title"
            />
            <div className="tsp-inex">
              <div className="tsp-inex__col tsp-inex__col--in">
                <header><span aria-hidden="true"><Check size={17} /></span><h3>What’s included</h3></header>
                <ul>
                  {content.includes.map((item) => (
                    <li key={item}><i aria-hidden="true"><Check size={13} /></i>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="tsp-inex__col tsp-inex__col--ex">
                <header><span aria-hidden="true"><X size={17} /></span><h3>What’s excluded</h3></header>
                <ul>
                  {content.excludes.map((item) => (
                    <li key={item}><i aria-hidden="true"><X size={13} /></i>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          {/* 11 · Essential information */}
          <Reveal as="section" className="tsp-section" id="essential-information" aria-labelledby="essential-title">
            <SectionHead
              index="07"
              eyebrow="Before you fly"
              title="Essential information"
              id="essential-title"
            />
            <div className="tsp-prose tsp-prose--split">
              {content.essentialInfo.map((block) => (
                <div key={block.title} className="tsp-prose__block">
                  <h3>{block.title}</h3>
                  {block.body.map((paragraph) => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)}
                </div>
              ))}
            </div>
          </Reveal>

          {/* 12 · Map */}
          <Reveal as="section" className="tsp-section" id="route-map" aria-labelledby="map-title">
            <SectionHead index="08" eyebrow="The line on the ground" title="Route map" id="map-title" />
            <figure className="tsp-map">
              <div className="tsp-map__frame">
                <img src={content.map.image} alt={content.map.alt} loading="lazy" decoding="async" />
              </div>
              <figcaption>
                <p>{content.map.caption}</p>
                <dl>
                  {content.map.legend.map((entry) => (
                    <div key={entry.label}><dt>{entry.label}</dt><dd>{entry.value}</dd></div>
                  ))}
                </dl>
              </figcaption>
            </figure>
          </Reveal>

          {/* 13 · Packing list */}
          <Reveal as="section" className="tsp-section" id="packing-list" aria-labelledby="packing-title">
            <SectionHead
              index="09"
              eyebrow="Pack once, pack right"
              title="Packing list"
              intro="Your duffel is carried by a porter and capped at 15 kg; your daypack is yours to carry all day. Down jacket, four-season sleeping bag and poles are loaned free of charge."
              id="packing-title"
            />
            <div className="tsp-packing">
              {content.packing.map((box) => (
                <section key={box.title} className="tsp-packing__box">
                  <header>
                    <h3>{box.title}</h3>
                    <p>{box.note}</p>
                  </header>
                  <ul>
                    {box.items.map((item) => (
                      <li key={item}><i aria-hidden="true" />{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </Reveal>

          {/* 14 · FAQs */}
          <Reveal as="section" className="tsp-section" id="faqs" aria-labelledby="faqs-title">
            <SectionHead index="10" eyebrow="Asked and answered" title="Frequently asked questions" id="faqs-title" />
            <TripFaqs faqs={content.faqs} />
          </Reveal>

          {/* Closing CTA */}
          <Reveal as="section" className="tsp-closing" aria-label="Book this journey">
            <div className="tsp-closing__inner">
              <p className="tsp-eyebrow tsp-eyebrow--light"><span>—</span> Your dates, your pace</p>
              <h2>Ready to walk {trip.title}?</h2>
              <p>
                {trip.availability}. Reserve a date with a 20% deposit, or talk it through with the
                Kathmandu team first — both start in the same place.
              </p>
              <div className="tsp-closing__actions">
                <button className="tsp-bookBtn tsp-bookBtn--wide" type="button" onClick={() => onBook(trip)}>
                  <span className="tsp-bookBtn__shine" aria-hidden="true" />
                  <span className="tsp-bookBtn__label">Book this journey</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
                <Link className="tsp-closing__link" href="/trips">
                  Browse other journeys <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Reveal>
        </article>
      </div>
    </main>
  )
}
