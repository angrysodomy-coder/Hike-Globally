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

## Validation

```bash
npm run lint
npm run build
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
- `src/styles/blog.css` — the single article design for every blog post: type scale
  and the symmetric vertical rhythm every block keeps above and below itself
- `public/images/` — optimized local photography and credits
