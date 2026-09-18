# Hike Globally

A premium, editorial travel-booking platform for locally led Himalayan journeys, powered by a high-performance **Vite + React SPA** frontend and an integrated **Payload CMS 3.x (PostgreSQL)** content backend.

---

## Highlights

- **Cinematic Frontend:** Immersive desktop and mobile hero imagery, GSAP and Framer Motion micro-interactions, responsive typography, and accessible design.
- **Dedicated Route Architecture:**
  - `/` — Homepage with pinned horizontal trek rail, region showcase, and journal.
  - `/destinations` — Landing page with region explorer, stats, craft story, and season guides.
  - `/destinations/:slug` — Individual destination deep dive with related trips, season highlights, and permits.
  - `/trips` — Interactive collection with real-time search, multi-factor filters (region, difficulty, season), animated re-layout, and season matrix.
  - `/trips/:slug` — Full trip journey page with day-by-day itinerary, inclusions/exclusions, and booking integration.
  - `/blog` — Journal index with category filtering.
  - `/blog/:slug` — Editorial journal article reader with reading progress bar.
- **Interactive Booking Flow:** Smooth slide-out inquiry drawers, client-side validation, and instant feedback.
- **Payload CMS 3.x Backend:**
  - Native PostgreSQL persistence with full relationship indexing.
  - Collections: `trips`, `destinations`, `blogs`, `categories`, `media`, and `users`.
  - Rich Text (Lexical editor) + verbatim Markdown support for long-form editorial essays.
  - Strict role-based access control (public read of published records; authenticated admin management).
  - Drafts and publishing lifecycle.
  - Responsive image variants automatically generated with Sharp (`thumbnail`, `card`, `hero`).
- **Zero-Flicker Resilience:** Dynamic hooks (`useTrips`, `useDestinations`, `useBlogs`) immediately render fallback static content and seamlessly hydrate when connected to Payload CMS.

---

## Project Structure

```
Hike-Globally/
├── src/
│   ├── components/         # Homepage, destinations, trips, and layout components
│   ├── pages/              # Route pages (Home, Destinations, Trips, Blogs, Details, 404)
│   ├── services/payload/   # Payload REST client, media helpers, and data hooks
│   ├── lib/router.jsx      # History-API router and Link components
│   ├── data/content.js     # Default baseline content and static fallbacks
│   └── styles.css          # Core design system and animations
├── cms/
│   ├── src/
│   │   ├── collections/    # Users, Media, Categories, Destinations, Trips, Blogs
│   │   └── payload.config.ts # Payload CMS configuration with PostgreSQL
│   ├── scripts/
│   │   ├── seed.ts         # Database seed script for journeys and admin account
│   │   └── start-local-db.js # Embedded PostgreSQL runner for local dev
│   └── media/              # Uploaded media storage
├── HOSTINGER_DEPLOYMENT.md # Production deployment guide for Hostinger VPS & Shared
├── CMS_INTEGRATION.md      # Detailed architecture and API reference
├── vite.config.js          # Vite config with dev proxy to /admin and /api
└── package.json            # Root scripts and dependencies
```

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
# Install frontend and CMS dependencies
npm install
npm --prefix cms install
```

### 2. Start PostgreSQL & Seed Database
```bash
# Start embedded local PostgreSQL (port 54329)
npm run cms:db

# In a new terminal, seed the database with initial travel content
npm run cms:seed
```

### 3. Start Development Servers
```bash
# Start Payload CMS (http://localhost:3000)
npm run cms:dev

# In another terminal, start Vite Frontend (http://localhost:5173)
npm run dev
```

### 4. Admin Access
- **Admin URL:** [http://localhost:5173/admin](http://localhost:5173/admin) (via Vite proxy) or [http://localhost:3000/admin](http://localhost:3000/admin)
- **Email:** `admin@hikeglobally.com`
- **Password:** `password123`

---

## Validation & Testing

Run the automated test suite, linter, and production build:

```bash
# Run unit & smoke tests (all passing)
npm test

# Run ESLint across frontend code
npm run lint

# Build Vite frontend for production
npm run build

# Build Payload CMS for production
npm run cms:build
```

---

## Deployment to Hostinger

For comprehensive, step-by-step deployment instructions tailored to Hostinger environments (KVM VPS and Shared Hosting workarounds), see [HOSTINGER_DEPLOYMENT.md](./HOSTINGER_DEPLOYMENT.md).
