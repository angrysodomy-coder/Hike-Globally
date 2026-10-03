# Hike Globally

A premium, editorial travel-booking homepage for locally led Himalayan journeys.

## Highlights

- Immersive, art-directed desktop and mobile hero imagery
- A dedicated `/destinations` landing page with a pinned horizontal region showcase,
  animated stats, region explorer, sticky craft story, season guide, voices, and FAQ
  (framer-motion + GSAP)
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
- **Payload 3 CMS embedded in the same Next.js app**: branded `/admin` with a custom
  analytics dashboard (live KPIs, inquiry chart, pipeline, departures), trips with
  itineraries/pricing/departures, blog, block-built pages, destinations, testimonials,
  header/footer globals, booking inquiries with a status workflow, draft + live
  preview, editor-managed redirects, on-demand revalidation, SEO fields, JSON-LD and
  a generated sitemap

## Architecture

The site runs on **Next.js 15 (App Router)** with **Payload 3 embedded in the same
app** — one deployment, one process, no separate CMS service.

```
src/app/(frontend)/   the public site  — every URL you already had, unchanged
src/app/(payload)/    the admin panel at /admin + REST & GraphQL under /api
```

Payload's hooks run in the same process as Next, so publishing a document calls
`revalidatePath`/`revalidateTag` directly — the frontend updates in about a second
with no webhooks and no rebuild.

### Hand-built pages vs. CMS pages

The art-directed pages are untouched; the CMS sits alongside them and takes over
a URL only once something is published there.

| Route | Rendered by |
| --- | --- |
| `/` | hand-built `HomePage` (swap in `(frontend)/home-page.example.tsx` for the CMS `home` page) |
| `/destinations` | hand-built page, plus a CMS region shelf once destinations exist |
| `/destinations/<slug>` | Payload destination landing page |
| `/trips` | hand-built page, plus a CMS strip of newly published journeys |
| `/trips/<slug>` | **Payload trip if published**, otherwise the original hand-built page |
| `/blog` | CMS posts first, then the journal archive from `src/data/content.js` |
| `/blog/<slug>` | **Payload post if published**, otherwise the original article page |
| `/contact` | Payload booking-inquiry form (structured leads → `/admin` → Bookings) |
| `/<slug>` | CMS pages built from layout blocks (`/about` is seeded) |

The site header's navigation is driven by the Payload `header` global and falls back
to `src/data/content.js` if the CMS is empty or the database is unreachable.

## Development

```bash
npm install
```

**Create `.env.local` before starting anything.** It is git-ignored, so a fresh
clone has none — and without `POSTGRES_URL` node-postgres silently falls back to
its default `localhost:5432`, where nothing listens. Every CMS request then fails,
and signing in at `/admin` dies with the opaque *"An unknown error has occurred."*
(the real error — `connect ECONNREFUSED 127.0.0.1:5432` — is only visible in the
`npm run dev` terminal).

```bash
cp .env.example .env.local   # the copied values already point at the dev database
```

While you are there, set a real `PAYLOAD_SECRET` (`openssl rand -hex 32`) and
note the `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` values — those become your
first `/admin` login. Then start the database and the app:

```bash
npm run db:dev     # terminal 1 — local Postgres (binaries come from npm, nothing to install)
npm run dev        # terminal 2 — http://localhost:3000
```

Seed it once:

```bash
npm run seed           # first admin user + 3 destinations + 3 trips (images from public/seed/)
npm run seed:content   # categories, 2 posts, home + about pages, testimonials, globals
```

Then sign in at `http://localhost:3000/admin` with the `SEED_ADMIN_*` credentials
from your `.env.local`.

Any Postgres works — `npm run db:dev` is a convenience for sandboxes with no system
Postgres. Point `POSTGRES_URL` at Neon/Vercel Postgres and nothing else changes.

#### "An unknown error has occurred." when logging in to `/admin`

That message is the admin panel's generic wrapper around **any HTTP 500 from the
login endpoint** — it never names the real cause. Check the terminal running
`npm run dev`; the actual error is always printed there:

| Dev-server log shows | Meaning | Fix |
| --- | --- | --- |
| `connect ECONNREFUSED 127.0.0.1:5432` | No `POSTGRES_URL` was found, so node-postgres fell back to its default port where nothing listens — i.e. `.env.local` is missing | `cp .env.example .env.local`, then **restart** `npm run dev` (env files are only read at startup) |
| `connect ECONNREFUSED 127.0.0.1:5433` | `.env.local` points at the dev database, but the database is not running | Start `npm run db:dev` in its own terminal (it stays in the foreground) |
| `relation "users" does not exist` | Database reachable, but its schema was never created (typical for a production DB that never ran migrations) | In dev the schema auto-syncs when Payload first initializes; in production run `npx payload migrate` (or deploy with `npm run build:prod`) |

If login instead answers **401 "The email or password provided is incorrect."**,
Payload and the database are both fine — there is just no matching user yet, so
run `npm run seed` to create the first admin from `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`.

### Payload commands

```bash
npm run generate:types      # src/payload-types.ts — commit it
npm run generate:importmap  # src/app/(payload)/admin/importMap.js — commit it
npx payload migrate:create  # after every schema change — commit src/migrations/
```

Dev auto-syncs the schema; **production only ever runs committed migrations**
(`npm run build:prod` = `payload migrate && next build`).

## Deploying to Vercel

This app needs a real Postgres database at **build time**, not just at runtime —
several pages (`/`, `/blog`, `/trips`, `/destinations`, `/[slug]`, `sitemap.xml`,
the header/footer globals) query Payload while Next.js prerenders them. Set
these in the Vercel project's **Settings → Environment Variables** before
deploying:

| Variable | Required | Notes |
| --- | --- | --- |
| `PAYLOAD_SECRET` | Yes | Any long random string, e.g. `openssl rand -hex 32`. Build fails immediately with "missing secret key" if unset. |
| `POSTGRES_URL` | Yes | A real, reachable Postgres connection string (Neon, Vercel Postgres, etc.) — `?sslmode=require` for managed providers. Not the local `npm run db:dev` URL that `.env.example` defaults to. |
| `NEXT_PUBLIC_SERVER_URL` | Yes | The deployed URL with no trailing slash, e.g. `https://your-site.vercel.app`. Must be the origin you actually open `/admin` on — see below. |
| `PAYLOAD_CSRF_ORIGINS` | Only for extra domains | Comma-separated extra origins allowed to make authenticated admin requests (`www.` alias, staging/custom domain, tunnel, cloud dev sandbox). Vercel's production/preview/branch URLs are trusted automatically. |
| `BLOB_READ_WRITE_TOKEN` | Only if using the Blob storage plugin | From the Vercel Blob store. |
| `PREVIEW_SECRET` | Recommended | Shared secret for `/admin` live preview. |

Set the project's **Build Command** to `npm run build:prod` (not the default
`npm run build`) so committed migrations run before `next build` — otherwise
the first deploy will fail with "relation does not exist" once the schema is
queried.

#### "You are not allowed to perform this action." when publishing

If `/admin` loads and shows you as signed in, but **Publish/Save** returns that
error, it is almost never a permissions problem — it is an origin mismatch.

Payload adds `serverURL` to its **CSRF allowlist**. Admin writes are `fetch()`
`POST`/`PATCH` calls, and browsers always attach an `Origin` header to those; if
that origin is not on the allowlist Payload discards the `payload-token` cookie
*before* access control runs, so the write executes as an anonymous user and
every `authenticated` access rule returns `false`. Page navigations are plain
`GET`s with no `Origin` header, which is why the panel still looks logged in.

The API adapter now recognizes requests that are demonstrably same-origin from
the reverse-proxy headers and lets Payload authenticate them via its built-in
`Sec-Fetch-Site` check. This means a custom-domain or deployment alias no longer
silently loses its login cookie. Cross-origin requests remain subject to the
strict allowlist. Keep `NEXT_PUBLIC_SERVER_URL` set to the canonical public URL
(for generated links), and list genuinely cross-origin admin clients in
`PAYLOAD_CSRF_ORIGINS`. The adapter is in
`src/lib/allowSameOriginPayloadRequest.ts`; unexpected rejected origins are
logged with the full allowlist by `src/hooks/explainRejectedOrigin.ts`.

Build-time data fetches for `generateStaticParams()` and `sitemap.ts` are
wrapped so a transient database hiccup degrades to on-demand rendering
instead of failing the whole build (see `src/lib/safeStaticParams.ts`), but
the app still needs a reachable, migrated database to serve real content —
there is no way around configuring the two required variables above.

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

The palette reaches the CMS surfaces too:

- **CMS pages** — `src/styles/cms.css` loads Tailwind *without* Preflight (the
  hand-authored stylesheets own the global reset) and remaps the colour scales onto
  the brand, so stock utilities like `text-emerald-700` or `bg-gray-50` render as
  ocean teal and brand navy. `.cms-prose` styles Lexical rich text.
- **Admin panel** — `src/app/(payload)/custom.scss` retints Payload's base and
  success ramps, primary buttons, links, focus rings and status pills, and
  `src/components/admin/{Logo,Icon}.tsx` put the ridgeline mark on the login screen
  and in the nav. The favicon is `public/favicon.svg`.
- **Custom dashboard** — `/admin` renders a mission-control home
  (`src/components/admin/CustomDashboard.tsx`, a server component reading the
  Local API, plus the animated `DashboardClient.tsx`): live KPI cards with
  count-up numbers and sparklines, a 30-day inquiry-flow chart with hover
  tooltips, the inquiry pipeline by stage, latest leads, upcoming departures
  with seat fills, and quick actions. Theming lives in
  `src/app/(payload)/admin-dashboard.scss` and flips between light/dark via CSS
  variables. `npm run seed:inquiries` sprinkles demo inquiries across the last
  60 days so the dashboard has something to chart (safe to delete anytime).

## Validation

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

## Structure

- `src/payload.config.ts` — collections, globals, plugins, admin branding
- `src/collections/` — Users, Media, Categories, Destinations, Posts, Trips, Pages,
  Testimonials, Inquiries
- `src/globals/` — Header and Footer singletons
- `src/blocks/` + `src/components/blocks/` — the 7-block page builder
- `src/lib/queries.ts` — cached, draft-aware data access (Payload Local API)
- `src/hooks/revalidate.ts` — on-demand revalidation on publish
- `src/scripts/seed*.ts` — seed data via the Local API
- `src/styles/cms.css` — brand-mapped Tailwind for the CMS surfaces
- `src/lib/next-router.jsx` — bridges the original SPA router API onto Next's router
- `src/components/SiteShell.jsx` — persistent header/footer/booking drawer
- `docs/payload-integration-plan.md` — the full integration reference
- `src/data/content.js` — CMS-ready content structures
- `src/components/` — reusable homepage and interaction components
- `src/components/destinations/` — sections for the `/destinations` landing page
- `src/views/` — page bodies (`HomePage`, `DestinationsPage`, `TripsPage`, …), mounted by thin route files in `src/app/(frontend)/`
- `src/lib/router.jsx` — the original `Link`/`useRouter`/`usePageMeta` API (now fed by Next)
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
