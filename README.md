# Hike Globally

A premium, editorial travel-booking homepage for locally led Himalayan journeys.

## Highlights

- Immersive, art-directed desktop and mobile hero imagery
- A dedicated `/destinations` landing page with a pinned horizontal region showcase,
  animated stats, region explorer, sticky craft story, season guide, voices, and FAQ
  (framer-motion + GSAP), routed with a tiny History-API router
- A dedicated `/trips` collection page with a cinematic parallax hero, a sticky
  signature-journey itinerary, live search + region/effort/season filtering with
  animated re-layout, an animated season matrix, inclusions, voices, FAQ and a
  parallax closing CTA (framer-motion + GSAP)
- A fully redesigned single trip page at `/trips/<slug>` — cinematic featured hero,
  title/excerpt/byline, a highlights box, trek overview, day-to-day outline, a paginated
  booking calendar (name, email, country, travellers, Book now), a full-itinerary
  accordion with an altitude/duration/accommodation/meals fact box and auto-sliding
  photography, green/ochre includes & excludes columns, essential information, an
  illustrated route map, a four-box packing list, an FAQ accordion, and a sticky
  left price rail with an animated glowing border
- Functional trip discovery, search, filters, sorting and results
- Reusable data-driven trip, trek, journal and review components
- Horizontal trek storytelling with scroll-snap and keyboard-friendly controls
- Working trip-enquiry and article drawers
- Responsive fullscreen navigation and mobile booking CTA
- Newsletter interaction, semantic landmarks, visible focus states and reduced-motion support
- Local responsive WebP assets and self-hosted font packages

## Development

```bash
npm install
npm run dev
```

The Vite development server runs on `http://localhost:5173` by default.

## Palette

The accent is an ocean teal — there is no red anywhere in the interface.

| Token | Value | Used for |
| --- | --- | --- |
| `--clay` | `#0f8378` | the accent on light surfaces: CTAs, links, hovers, rules |
| `--clay-deep` | `#0a5f57` | the darker end of accent gradients |
| `--clay-bright` | `#3fc0ab` | the same accent lifted for dark bands (marquees, stats, hero) |
| `--gold` | `#c9962d` | review stars and other earned marks |
| `--tsp-green` | `#1f7a4d` | "included" / confirmed states |
| `--tsp-amber` | `#9c6414` | "not included", sold-out departures, form errors |

`scripts/check-no-red.mjs` (part of `npm test`) scans every colour literal in
`src/` and fails the build if a red one ever comes back.

## Validation

```bash
npm run lint
npm run build
npm test
```

## Structure

- `src/data/content.js` — CMS-ready content structures
- `src/components/` — reusable homepage and interaction components
- `src/components/destinations/` — sections for the `/destinations` landing page
- `src/pages/` — route-level pages (`HomePage`, `DestinationsPage`, `TripsPage`)
- `src/lib/router.jsx` — tiny History-API router, `Link`, and page-meta hook
- `src/styles.css` — visual system, motion and responsive layouts
- `src/styles/destinations.css` — isolated `dp-` design system for the destinations page
- `src/styles/trips.css` — isolated `tp-` design system for the trips page
- `src/components/trip/` — the single trip page pieces (price rail, booking calendar,
  itinerary accordion, image slider, FAQs)
- `src/data/tripPageContent.js` — the single trip page content model: hand-written copy
  for flagship journeys, generated copy for everything else, plus the departure calendar
- `src/styles/blog.css` — the single article design for every blog post: type scale
  and the symmetric vertical rhythm every block keeps above and below itself
- `src/styles/trip-single.css` — the isolated `tsp-` design system for the single trip
  page, fluid from a 5" phone to a 100" display
- `public/images/` — optimized local photography and credits
