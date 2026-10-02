# Payload 3 Travel Starter — Trips + Content Slices

A complete, production-ready setup for a travel booking platform:
**Payload scaffold → Trips (itinerary, pricing, departures) → Blog, CMS Pages with layout blocks, Testimonials, Header/Footer globals → Booking inquiries (structured leads + email notifications + CRM sync) → Destination landing pages → editor-managed redirects → seed data → live frontend routes with draft preview, live preview, on-demand revalidation, SEO, JSON-LD and sitemap.**

Copy this `src/` tree into your existing Next.js 15 (App Router, TS) project. Your current
frontend moves into `src/app/(frontend)/` — route groups do not change URLs.

---

> **✅ Validated end-to-end** against Next 15.4.11 + Payload 3.90.2 + Postgres 17:
> clean `tsc --noEmit`, both seed scripts, all 10 routes (200), 404s, sitemap,
> JSON-LD, admin panel, REST login, and editor-created redirects (307 verified).
> Version note: `@payloadcms/next` pins `next` to security-patched lines only
> (e.g. `>=15.4.11 <15.5.0`) — if install fails with ERESOLVE, pin
> `"next": "~15.4.11"` (or whatever line your Payload version's peer range allows).

## 1. Install dependencies

```bash
pnpm add payload @payloadcms/next @payloadcms/richtext-lexical \
  @payloadcms/db-postgres @payloadcms/storage-vercel-blob \
  @payloadcms/plugin-seo @payloadcms/plugin-redirects \
  @payloadcms/live-preview-react @payloadcms/email-nodemailer sharp graphql
```

## 2. Wire up config files

- Replace / merge `next.config.ts` with the one in this starter (wraps with `withPayload`).
- Add to `tsconfig.json` → `compilerOptions.paths`:

```jsonc
"@payload-config": ["./src/payload.config.ts"]
```

- Add scripts to `package.json`:

```jsonc
{
  "build": "payload migrate && next build",
  "payload": "payload",
  "generate:types": "payload generate:types",
  "generate:importmap": "payload generate:importmap",
  "seed": "payload run src/scripts/seed.ts",
  "seed:content": "payload run src/scripts/seed-content.ts"
}
```

## 3. Database (local dev)

Any Postgres works — the `postgresAdapter` used in `payload.config.ts` runs
identically against local Postgres in dev and Neon/Vercel Postgres in prod.
Quickest local setup:

```bash
# Debian/Ubuntu: sudo apt install postgresql && sudo pg_ctlcluster <ver> main start
sudo -u postgres psql -c "CREATE USER payload WITH PASSWORD 'payload' CREATEDB;"
sudo -u postgres createdb -O payload travel
# POSTGRES_URL=postgresql://payload:payload@127.0.0.1:5432/travel
```

## 4. Environment

Copy `.env.example` → `.env.local` and fill in values. For local dev, point
`POSTGRES_URL` at a dev database (a Neon branch is ideal). `BLOB_READ_WRITE_TOKEN`
is only required once you deploy — locally, you can comment out the
`vercelBlobStorage` plugin in `payload.config.ts` and files land in `/media` on disk.

## 5. Move your frontend into the route group

```
src/app/layout.tsx      →  src/app/(frontend)/layout.tsx
src/app/page.tsx        →  src/app/(frontend)/page.tsx
...every existing route →  src/app/(frontend)/...
```

Your existing `/api/*` routes stay where they are — Payload's API lives in
`src/app/(payload)/api/` and does not collide.

## 6. Generate, run, seed

```bash
pnpm generate:importmap   # writes src/app/(payload)/admin/importMap.js — commit it
pnpm generate:types       # writes src/payload-types.ts — commit it
pnpm dev                  # http://localhost:3000/admin → create first admin user
pnpm seed                 # 2 destinations + 3 trips with images from public/seed/
pnpm seed:content         # categories, 2 posts, home + about pages, testimonials, globals
```

Then open:

- `http://localhost:3000/trips` — listing page (tagged cache, purged on publish)
- `http://localhost:3000/trips/everest-base-camp-trek` — full trip detail
- `http://localhost:3000/blog` and `/blog/how-to-train-for-everest-base-camp`
- `http://localhost:3000/about` — block-built CMS page
- `http://localhost:3000/contact` — booking inquiry form (try an Enquire button on a
  trip's departures table: the trip + date arrive pre-filled). Submissions appear in
  `/admin` → Bookings → Inquiries with a status workflow (new → contacted → quoted →
  converted), and a notification email is sent when SMTP is configured.
- `http://localhost:3000/destinations` and `/destinations/everest-region` — region
  landing pages listing every published trip in that destination
- `/admin` → Trips/Posts/Pages → edit → Publish → the frontend updates in ~1s
- `/admin` → open any doc → **Live Preview** tab → edit and watch it refresh
- `/admin` → Admin → Redirects → create one (e.g. from `/old-trek-page` to a trip) →
  visit the old URL and get 301'd. Dynamic routes check redirects before rendering
  their 404, so editors fix dead URLs without a deploy.

### Optional wiring into your existing layout

- **CMS homepage**: rename `src/app/(frontend)/home-page.example.tsx` to `page.tsx`
  to serve the seeded `home` page (blocks) instead of your current homepage.
- **CMS nav/footer**: render `<SiteHeader />` and `<SiteFooter />` (from
  `src/components/layout/`) inside your `(frontend)/layout.tsx` — both are server
  components fed by the Header/Footer globals and revalidate on save.

## 7. Production (Vercel + Neon)

1. Vercel → Storage → create **Neon Postgres** + **Blob store** (env vars auto-set).
2. Add `PAYLOAD_SECRET`, `PREVIEW_SECRET`, `NEXT_PUBLIC_SERVER_URL` env vars.
3. Before first deploy: `pnpm payload migrate:create initial` and commit `src/migrations/`.
4. Every future schema change: edit collections → `pnpm payload migrate:create` → commit → push.
   Dev uses push-mode auto-sync; **prod only ever runs committed migrations** (the
   `build` script applies them).

## File map

```
next.config.ts                              withPayload wrapper + Blob remotePatterns
src/payload.config.ts                       buildConfig: DB, Blob, SEO, live preview
src/collections/{Users,Media,Categories,Destinations,Posts,Trips,Pages,Testimonials,Inquiries}.ts
src/globals/{Header,Footer}.ts              nav + footer singletons
src/actions/submitInquiry.ts                server action: validate → Local API create
src/components/forms/InquiryForm.tsx        client form (useActionState, honeypot)
src/app/(frontend)/contact/page.tsx         inquiry page with trip/departure deep links
src/app/(frontend)/destinations/...         /destinations and /destinations/[slug]
src/lib/redirects.ts                        cached redirect lookup + redirectOrNotFound()
src/hooks/revalidateRedirects.ts            purge redirect cache on editor save
src/hooks/syncInquiryToCrm.ts               fail-safe webhook push of new leads to a CRM
src/blocks/index.ts                         7 layout blocks for the Pages builder
src/fields/slug.ts                          auto-slug field with reserved-slug guard
src/lib/{access,queries,formatters,lexical,generateMeta,generatePreviewPath,structuredData}.ts
src/hooks/revalidate.ts                     on-demand revalidation (collections + globals)
src/app/(payload)/...                       admin panel + REST/GraphQL routes
src/app/(frontend)/trips/...                /trips and /trips/[slug]
src/app/(frontend)/blog/...                 /blog and /blog/[slug]
src/app/(frontend)/[slug]/page.tsx          CMS pages (about, contact, landing pages…)
src/app/(frontend)/home-page.example.tsx    optional CMS-driven homepage (rename to page.tsx)
src/app/(frontend)/next/...                 draft preview enter/exit routes
src/app/sitemap.ts                          sitemap from published Payload content
src/components/RenderBlocks.tsx             blockType → React component mapper
src/components/blocks/...                   Hero, Content, Media, FeaturedTrips, Testimonials, CTA, FAQ
src/components/layout/...                   SiteHeader / SiteFooter fed by globals
src/components/{trips,blog}/...             TripCard, TripDetail, PostCard
src/scripts/{seed,seed-content}.ts          migrate mock data via Local API
public/seed/*.jpg                           seed images (replace with your own)
```

## How the inquiry pipeline works

```
TripDetail "Enquire" → /contact?trip=<slug>&departure=<date>   (pre-filled form)
          ↓ submit (server action — no public REST create access, honeypot-protected)
   validate fields → verify trip is real & published → payload.create('inquiries')
          ↓ afterChange hook (create only)
   notification email to INQUIRY_NOTIFY_EMAIL (fails silently, never blocks the lead)
          ↓
   /admin → Bookings → Inquiries: status workflow new → contacted → quoted → converted
```

Design choice: a **dedicated `inquiries` collection + server action** instead of the
generic form-builder plugin — booking leads need structured fields (trip, date, pax)
your ops team can filter and report on, and the server-action-only write path removes
the public API as a spam surface.

## What's left after this

The platform is feature-complete. The only remaining optional layer is
**localization**: add the `localization` key to `payload.config.ts`, mark
content fields `localized: true`, and pair with `next-intl` + an
`app/(frontend)/[locale]/` segment — existing content migrates into the
default locale automatically, so there is zero penalty for adding it later.
