# Payload CMS Integration — Task Tracker

Companion to [`payload-integration-plan.md`](./payload-integration-plan.md). The plan is the
*reference*; this file is the *state*. Update the status table as each step lands.

**Branch:** `arena/01a0f7cb-hike-globally` (steps 1–3 landed on `arena/01a0f76c-hike-globally`)
**Approach:** embedded Payload 3 inside Next.js App Router, one repo, one deploy, Local API.
**Last updated:** 2026-10-01 (step 5)

---

## Status at a glance

| # | Step | Deliverable | Status |
|---|------|-------------|--------|
| 1 | Scaffold | `package.json`, `next.config.ts`, `tsconfig.json`, `.env.example`, `.gitignore`, `src/app/(payload)/**` | ✅ **Done** |
| 2 | Shared primitives | `src/access/*`, `src/fields/{slug,seo,link,artDirectedImage,defaultLexical}.ts`, `src/lib/utils/*` | ✅ **Done** |
| 3 | First boot | `src/collections/{Media,Users}.ts` + `src/payload.config.ts` → `/admin` loads | ✅ **Done** |
| 4 | Core content | `src/collections/Trips/index.ts`, `src/collections/Departures.ts`, `src/hooks/revalidate.ts` | ✅ **Done** |
| 5 | First rendered route | `src/lib/payload.ts`, `src/lib/queries/trips.ts`, `src/app/(frontend)/trips/[slug]/page.tsx` | ✅ **Done** |
| 6 | Remaining collections | Pages, Posts, Destinations, Reviews, Enquiries, Categories, Authors; globals; blocks | ✅ **Done** (pulled into step 4) |

`/admin` boots, authenticates, and accepts uploads as of step 3. The full content model —
11 collections, 3 globals, 19 blocks — is live as of step 4. As of step 5 the first public
route, `/trips/[slug]`, renders from Postgres with draft preview and structured data, and the
npm scripts point at Next rather than Vite. Everything below was verified against a real
PostgreSQL 18 instance over HTTP, not just a typecheck.

**Step 6 was merged into step 4 deliberately.** The Trips schema in §8.5 of the plan has a
*required* `destination` relationship plus `leadGuide` → authors, `relatedPosts` → posts and a
`reviews` join. Payload validates relationship targets at boot, so shipping Trips without those
collections meant either an `InvalidFieldRelationship` crash (the exact failure that broke step 3)
or shipping a trip that cannot say where it goes. The plan's own §20 roadmap orders the
supporting collections *before* Trips for this reason. Only the redirects and search plugins
remain outstanding from the original step 6 list.

---

## Step 1 — Scaffold ✅

### Files created

| Path | Purpose |
|------|---------|
| `next.config.ts` | `withPayload()` wrapper, `images.localPatterns` for `/api/media/file/**`, remote patterns from `NEXT_PUBLIC_SERVER_URL` / `NEXT_PUBLIC_MEDIA_URL`, `sassOptions.loadPaths`, `turbopack.root`, `outputFileTracingExcludes` for the legacy Vite entrypoints |
| `tsconfig.json` | `allowJs: true` + `checkJs: false` so the existing `.jsx` app compiles untouched; `jsx: preserve`; `moduleResolution: bundler`; paths `@payload-config` → `./src/payload.config.ts`, `@/*` → `./src/*` |
| `.env.example` | Every env var the plan requires, grouped and commented |
| `src/app/(payload)/layout.tsx` | Payload admin root layout |
| `src/app/(payload)/custom.scss` | Admin theme overrides — currently the Hike Globally palette variables only |
| `src/app/(payload)/admin/importMap.js` | Empty stub; `npm run generate:importmap` rewrites it once collections exist |
| `src/app/(payload)/admin/[[...segments]]/page.tsx` | Admin UI catch-all |
| `src/app/(payload)/admin/[[...segments]]/not-found.tsx` | Admin 404 |
| `src/app/(payload)/api/[...slug]/route.ts` | REST API |
| `src/app/(payload)/api/graphql/route.ts` | GraphQL endpoint |
| `src/app/(payload)/api/graphql-playground/route.ts` | GraphQL playground |

### Files modified

- **`package.json`** — Next 16.3.8 + Payload 3.90.2 added *alongside* the existing Vite deps. React/React-DOM pinned `19.2.6`, TypeScript `5.7.3`; added `cross-env`, `sass`, `tsx`, `@types/node`, `@types/react`, `@types/react-dom`.
- **`.gitignore`** — added `.next/`, `out/`, `next-env.d.ts`, `*.tsbuildinfo`, `.vercel`, `/media/`. Includes a comment that `src/migrations/` and `src/payload-types.ts` **must stay committed**.
- **`eslint.config.js`** — ignores `.next`, the generated `importMap.js`, and the generated `payload-types.ts`.

### Script naming — deliberate, and it owes a change at step 3

`npm run dev` still runs **Vite**. Next.js is parked on suffixed scripts:

| Script | Runs |
|--------|------|
| `dev` / `build` / `preview` | Vite (the current live site) |
| `dev:next` / `build:next` / `start:next` | Next.js + Payload |

This keeps the existing site bootable throughout the migration.

**Status of the planned flip:** step 1 noted that the names should swap once `/admin` renders.
They have deliberately **not** been swapped yet. `/admin` works, but there is still no
`(frontend)` route group — `npm run dev:next` serves a 404 at `/`. Making that the default
`npm run dev` would hand you a worse developer experience than you have today. The flip happens
at **step 5**, when `app/(frontend)/trips/[slug]/page.tsx` renders a real page. Vite scripts are
retired entirely at step 6. The original `test` script chain is preserved verbatim and passes.

### Verification performed

| Check | Result |
|-------|--------|
| `npm install` (lockfile deleted, regenerated) | ✅ 630 packages, **no `--legacy-peer-deps` needed** |
| `npx tsc --noEmit` | 6 errors, **all** `Cannot find module '@payload-config'` — expected until step 3; nothing else |
| `npx eslint .` | ✅ clean |
| `npm test` (legacy smoke suite) | ✅ all pass on React 19.2.6 — the Vite app is unharmed |

---

## Decisions made or changed during step 1

### 1. Database adapter: `db-vercel-postgres` → **`@payloadcms/db-postgres`** (changed)

Installing `@payloadcms/db-vercel-postgres` pulls **deprecated** `@vercel/postgres@0.10.0`:

```
npm warn deprecated @vercel/postgres@0.10.0: @vercel/postgres is deprecated…
it should have been migrated to Neon as a native Vercel integration
```

Vercel Postgres *is* Neon now, so that wrapper is a dead branch. Swapped to
`@payloadcms/db-postgres` (driver: `pg@8.20.0`, actively maintained, portable to self-host).
`npm ls @vercel/postgres` now returns empty. Both adapters share `drizzle-orm@0.45.2` and
`@payloadcms/drizzle@3.90.2`, so schema and migration behaviour are identical.

Consequences, already propagated into the plan (§5.1, §5.6, §6, §16):

- `postgresAdapter({ pool: { connectionString } })` instead of `vercelPostgresAdapter()`.
- Env var is **`DATABASE_URL`** (pooled, `-pooler` hostname) rather than `POSTGRES_URL`.
- Add **`DATABASE_URL_UNPOOLED`** (direct endpoint). Migrations issue DDL, which is unreliable
  through PgBouncer transaction pooling — `payload.config.ts` detects `payload migrate` via
  `process.argv[2]` and switches endpoints automatically.
- Client pool kept small (`max: 1` on Vercel) because Neon's pooler already fronts the database.

### 2. Package manager: pnpm → **npm** (changed)

The plan originally recommended pnpm because the Payload install docs warn that npm may need
`--legacy-peer-deps`. With these exact pins (Payload 3.90.2 / Next 16.3.8 / React 19.2.6) plain
`npm install` resolves the full graph cleanly. Staying on npm avoids a lockfile migration.

### 3. Scripts kept non-breaking — see the table above.

---

## Running it locally

1. `npm install`
2. Create `.env` from `.env.example`. Minimum to boot: `DATABASE_URL`, `PAYLOAD_SECRET`,
   `NEXT_PUBLIC_SERVER_URL`. Any Postgres 14+ works; no S3 bucket is needed (uploads fall
   back to `/media` on disk, which is gitignored).
3. `npm run dev` → http://localhost:3000/admin and create the first user.
4. `http://localhost:3000/trips/<slug>` renders a published trip.

As of step 5, `npm run dev` / `build` / `start` are **Next**. The old Vite app is still there
under `npm run legacy:dev` / `legacy:build` / `legacy:preview`, and `npm test` still covers it.

**If preview 403s:** `NEXT_PUBLIC_SERVER_URL` must equal the origin the browser is actually on.
Payload's `csrf` allowlist is built from it, and a cookie-authenticated request from any other
origin is rejected — including a tunnelled or proxied dev host.

---

## Step 2 — Shared primitives ✅

| Path | Purpose |
|------|---------|
| `src/access/index.ts` | `anyone`, `authenticated`, `isAdmin`, `isAdminField`, `isAdminOrOperations`, `canAccessAdminUI`, `publishedOrAuthenticated` |
| `src/fields/slug.ts` | `formatSlug()` + `slugField()`. Hand-rolled: core's `slugField()` is `@experimental`. NFKD-strips diacritics so "Pokharā" → "pokhara" |
| `src/fields/seo.ts` | `seoTab` — the shared SEO tab, identical on every public collection |
| `src/fields/link.ts` | `linkField()` — polymorphic relationship so links survive slug renames |
| `src/fields/artDirectedImage.ts` | desktop/mobile crop pair + `objectPosition`, matching your existing `-mobile.webp` assets |
| `src/fields/defaultLexical.ts` | shared Lexical editor config |
| `src/collections/linkable.ts` | `LINKABLE_COLLECTIONS` — single source of truth for link targets |
| `src/lib/utils/getURL.ts` | `getServerSideURL()` / `getClientSideURL()` / `getMediaURL()`. Referenced throughout the plan but never defined in it — written here |
| `src/lib/utils/documentHref.ts` | `COLLECTION_PATH_PREFIX` + `documentHref()`. One place mapping collection → URL prefix, shared by SEO, sitemap, links and preview |

**Also in step 2: `src/pages/` was renamed to `src/views/`.** See the pitfalls section below — this
was not cosmetic, it was blocking the production build.

---

## Step 3 — First boot ✅

| Path | Purpose |
|------|---------|
| `src/collections/Media.ts` | Upload collection: 6 image sizes, focal point, crop, WebP conversion, licence/credit/location, `defaultPopulate`, folders |
| `src/collections/Users.ts` | Auth collection: 3 roles, 8-hour sessions, lockout, field-level role guard |
| `src/hooks/generateBlurDataURL.ts` | 16px base64 blur placeholder generated once on upload |
| `src/payload.config.ts` | Postgres adapter with pooled/unpooled split, Lexical, SEO plugin, S3/R2 storage, Resend email, jobs access guard |
| `src/payload-types.ts` | **Generated** — commit it; `npm run generate:types` rewrites it |
| `src/app/(payload)/admin/importMap.js` | **Generated** — `npm run generate:importmap` rewrites it |

### Verification — actually executed, not assumed

A real PostgreSQL 18.4 was started locally for this (`embedded-postgres`, port 55432) so the
claims below are observed behaviour rather than a typecheck.

| Check | Result |
|-------|--------|
| `GET /admin` | **HTTP 200**, `<title>Dashboard · Hike Globally CMS</title>`, renders the "Create first user" screen |
| Schema push | 12 tables created: `media`, `users`, `users_roles`, `users_sessions`, `payload_folders`, `payload_locked_documents(_rels)`, `payload_preferences(_rels)`, `payload_migrations`, `payload_kv` |
| `POST /api/users/first-register` | 200, user created with `roles: ['admin']` |
| `POST /api/media` (real 2400×1658 hero from `public/images/`) | **201**; all 6 derivatives generated — `thumbnail` 400×300, `card` 768×531, `feature` 1280×884, `hero` 1920×1326, `heroMobile` 900×1200, `og` 1200×630 |
| `og` format override | correctly `image/jpeg` while every other size is `image/webp` |
| Blur placeholder | 163-byte base64 WebP data URI stored on the document |
| **Privilege-escalation test** | An `editor` PATCHing `roles: ['admin']` onto their own record returns 200 but roles stay `['editor']` — Payload silently strips the field. A control request renaming themselves succeeded. The field-level guard holds. |
| `payload migrate:create` | Generates valid up/down SQL. Output discarded — see below |
| `npx tsc --noEmit` | **clean, 0 errors** |
| `npx eslint .` | clean |
| `npm run build:next` | **succeeds**; route table is exactly `/admin/[[...segments]]`, `/api/[...slug]`, `/api/graphql`, `/api/graphql-playground`, `/_not-found` |
| `npm run build` (Vite) | succeeds |
| `npm test` (legacy smoke suite) | **447 assertions pass** |

### Migrations are deliberately NOT committed yet

`payload migrate:create` was run, produced correct SQL, and the output was **deleted**. The
schema still changes in steps 4 and 6, and this database has never been deployed — three
migrations replaying the intermediate states of a schema nobody ever ran is noise. `push: true`
covers development. Generate the real initial migration **once, immediately before the first
deploy**, and commit it from then on.

---

## Problems found by booting it, and how they were fixed

Four of these only surface at runtime or at build time. A typecheck would have shipped all four.

**1. `src/pages/` was being consumed by the Next.js Pages Router.**
Your Vite view components live in `src/pages/`. With `src/` as Next's base directory, Next read
that folder as the Pages Router and turned every file into a route — then pulled
`SummerFamilyTreksBlog.jsx` and its Vite-only `import '…md?raw'` into the production build,
which failed with a bare `Unknown module type` naming the markdown file and never mentioning
routing. Renamed to **`src/views/`** (5 imports updated in `src/App.jsx`). Added as pitfall 19.

**2. `LinkFeature({ enabledCollections: [...] })` made the admin unbootable.**
Payload validates relationship targets at boot and threw
`InvalidFieldRelationship: … has invalid relationship 'pages'`, because Pages/Posts/Trips/
Destinations do not exist until step 6. Fixed by *removing* `enabledCollections` and having
each collection opt out with `admin.enableRichTextLink: false`. Payload then derives the set
from what is registered, so new collections become linkable automatically — one mechanism
instead of two lists to keep in sync. Added as pitfall 19 in the plan; §5.7 updated.

**3. `blurDataURL` became the Postgres column `blur_data_u_r_l`.**
Payload splits camelCase for column names and gives each capital in a run its own underscore.
`dbName` is not available on scalar fields, so the field name is the only lever. Renamed to
**`blurDataUrl`** → column `blur_data_url`, confirmed in `information_schema`. Added as
pitfall 21.

**4. `push: true` silently hung the dev server.**
Renaming that field produced a column rename, and Drizzle cannot distinguish a rename from a
drop-plus-add — so it printed an interactive prompt into the dev-server log and the request
never returned. The admin just hung, with no error. Added as pitfall 20.

Three further type errors appeared only once `payload-types.ts` existed and narrowed
`CollectionSlug` to the registered collections. All three were fixed properly rather than cast:

- `access.admin` takes a narrower signature than `Access` (no `Where` form) → added `canAccessAdminUI`.
- `Partial<TextField>` breaks the `hasMany` discriminated union → `SlugFieldOverrides` omits the variant keys.
- `collectionSlug === 'posts'` no longer type-narrows → replaced the ternary chain with the shared `documentHref()` map.

`next dev` also rewrote `tsconfig.json`'s `jsx` from `preserve` to `react-jsx` on first boot.
That is Next asserting its own requirement; the value was kept and Vite is unaffected.

---

## Step 4 — Core content (and the rest of the model) ✅

### Files created

**Hooks and utilities**

| Path | Purpose |
|------|---------|
| `src/hooks/revalidate.ts` | Every on-demand revalidation hook, with the `EDITORIAL` / `CRITICAL` split |
| `src/hooks/populatePublishedAt.ts` | Stamps `publishedAt` the first time a document is *published*, not created |
| `src/hooks/populateReadingTime.ts` | Lexical → plain text → minutes; `lexicalToPlainText` exported for later reuse |
| `src/lib/utils/generatePreviewPath.ts` | Builds the `/next/preview?path=…` url for the Preview button and live preview |
| `src/fields/options.ts` | Shared season / difficulty / currency / trip-type / meal vocabularies |

**Collections** — `Trips/index.ts`, `Departures.ts`, `Destinations.ts`, `Posts/index.ts`,
`Pages/index.ts`, `Categories.ts`, `Authors.ts`, `Reviews.ts`, `Enquiries.ts`
(joining `Media.ts` and `Users.ts` from step 3).

**Globals** — `Header.ts`, `Footer.ts`, `SiteSettings.ts`.

**Blocks** — all 19 under `src/blocks/*/config.ts`: the 17 page blocks from the plan's table
plus `Callout` and `TripCard`, which the Posts rich-text editor needs. `Gallery` is shared
between the page builder and the article editor.

**Admin RowLabels** — `createRowLabel.tsx` (shared factory) plus `TextRowLabel`,
`TitleRowLabel`, `QuestionRowLabel`, `ItineraryRowLabel`, `LinkRowLabel`.

**Also:** `scripts/dev-postgres.mjs` — throwaway PostgreSQL for verification. Not wired into any
npm script and `embedded-postgres` is deliberately **not** in `devDependencies` (it downloads a
database binary). Run `npm i --no-save embedded-postgres` first if you need it.

### Ten corrections made to the plan

Each of these is a real defect in the §8 / §11 code as drafted, not a style preference.

1. **`context.disableRevalidate` is mandatory, not an optimisation.** §11.3 describes it as
   avoiding pointless work. In fact a Local API write without it **throws** —
   `Invariant: static generation store missing in revalidatePath /trips/…` — because
   `revalidatePath` requires a Next request scope and a seed script has none. The step-7 seed
   script cannot work without passing it. Verified both ways.
2. **Departures silently resurrected cancelled dates.** The plan guards status derivation with
   `data?.status !== 'cancelled'`. On a partial update `data.status` is `undefined`, so editing
   only the `note` on a cancelled departure flipped it back to `available` — i.e. put a
   cancelled trek back on sale. Now reads `data?.status ?? originalDoc?.status`. There is a
   regression test for exactly this.
3. **`endDate` went stale on partial updates.** The plan skips derivation unless `data.startDate`
   is present, which a `PATCH` of `spotsRemaining` never is. Now falls back to
   `originalDoc.startDate`.
4. **`Departures.defaultPopulate` listed a `currency` field that does not exist.** Removed —
   `price` is an override of the trip's base price and must inherit the trip's currency.
5. **Posts used `defaultFeatures` instead of `rootFeatures`.** Verified in
   `@payloadcms/richtext-lexical@3.90.2`: `defaultFeatures` is Payload's own built-in set, while
   `rootFeatures` is what `editor:` in `payload.config.ts` configures. The plan's version would
   have silently discarded the curated toolbar in `defaultLexical.ts` and handed writers back H1.
6. **`generatePreviewPath` duplicated the collection → URL map.** It now calls `documentHref()`,
   which step 2 created precisely to be the single source of that mapping.
7. **Season and difficulty lists were written out three times** — Trips, Destinations and the
   TripGrid filter — and must match exactly or the filter returns nothing. Now one
   `src/fields/options.ts`. In Postgres these are real enum types, so drift is a migration.
8. **No inventory validation.** `spotsRemaining` could exceed `spotsTotal`. Added a cross-field
   `validate`.
9. **`Destinations` had no way to see its own trips.** Added the reciprocal `trips` join.
10. **`RowLabel` row numbering is a trap.** `useRowLabel().rowNumber` is **0-based**
    (`ArrayRow.js:121` → `rowNumber: rowIndex`) while server props are **1-based**
    (`renderField.js:107` → `rowIndex + 1`). Reading the wrong one numbers the itinerary from
    day two. Documented at the top of `createRowLabel.tsx`.

### Two deliberate design choices

- **RowLabel components adapt to the data, not the reverse.** An earlier pass renamed
  `label` → `title` and `caption` → `text` across several arrays so one component could read
  them. That was backwards, and it was reverted: the field names now follow the plan, and
  `TextRowLabel` / `TitleRowLabel` read `text ?? caption ?? label` and `title ?? label ?? name`.
- **`spotsRemainingField` is extracted from the `fields` array.** A field literal nested inside
  `tabs` → `row` → `fields` is contextually typed as the whole `Field` union, so TypeScript
  cannot infer the `validate` signature and `siblingData` arrives as an implicit `any` under
  `strict`. Annotating it `NumberField` fixes inference without a cast.

### Verification — executed against PostgreSQL 18.4 over HTTP

| Check | Result |
|-------|--------|
| `npm run generate:types` | ✅ config loads; no `InvalidFieldRelationship` |
| `npm run generate:importmap` | ✅ all five RowLabels resolved into the import map |
| `npx tsc --noEmit` | ✅ **0 errors** |
| `npx eslint .` | ✅ clean |
| Schema push from an empty database | ✅ **148 tables, 86 enums** |
| Longest table / enum name | 44 / 51 chars — clear of the Postgres 63-char limit |
| camelCase column mangling (pitfall 21) | ✅ none introduced; the only hit is Payload's own internal `media.thumbnail_u_r_l` |
| Compound unique index on `(trip, startDate)` | ✅ `CREATE UNIQUE INDEX` confirmed, and enforced — duplicate insert rejected by Postgres |
| Join fields store no column | ✅ `trips.departures` / `trips.reviews` resolve, no stored column |
| Drafts wiring | ✅ `_status` on trips, 15 version tables |
| **Functional suite (25 checks)** | ✅ **25/25** — see below |
| `npm run build:next` | ✅ succeeds; route table unchanged (frontend routes are step 5) |
| `npm run build` (Vite) | ✅ succeeds |
| `npm test` (legacy smoke suite) | ✅ all pass |
| `GET /admin` | ✅ HTTP 200, renders with every new collection in the sidebar |

The 25 functional checks, run over the REST API against the dev server, cover: slug derivation,
`publishedAt` stamping on publish, the derived `endDate` (15 Mar + 16 days → 30 Mar), the
`available` → `limited` → `sold-out` status ladder, the cancelled-status regression, inventory
validation, the unique-index rejection, both join directions, draft non-leakage to anonymous
readers, departures being publicly readable, the anonymous-create / authenticated-read split on
Enquiries, and both globals accepting a polymorphic link.

Revalidation was confirmed from the server log rather than assumed —
`Revalidated /destinations/khumbu`, `Revalidated /trips/everest-base-camp`, and
`Revalidated departures for /trips/everest-base-camp` on every departure write. That last one
exercises the depth-0 branch of `revalidateDepartureDoc`, where `doc.trip` is a bare ID and the
slug has to be looked up.

---

## Step 5 — First rendered route ✅

`/trips/[slug]` renders from Postgres through the Local API, as a server component, with
draft preview, structured data and canonical metadata. The npm scripts now point at Next.

### Files created

| File | What it is |
| --- | --- |
| `src/lib/payload.ts` | Cached `getPayload()` client, guarded with `import 'server-only'` |
| `src/lib/queries/trips.ts` | `getTripBySlug`, `getTripDepartures`, `getTrips`, `getAllTripSlugs` |
| `src/lib/seo/generateMeta.ts` | Title/description/OG/canonical builder |
| `src/lib/seo/jsonLd.ts` | `tripJsonLd`, `breadcrumbJsonLd`, `faqJsonLd` |
| `src/components/JsonLd.tsx` | `<script type="application/ld+json">` emitter |
| `src/components/CMSImage/index.tsx` | `next/image` + focal point + stored blur placeholder |
| `src/components/CMSImage/ArtDirected.tsx` | Raw `<picture>`, bypasses the Next optimizer on purpose |
| `src/components/RichText/index.tsx` | Server-side Lexical → JSX with link resolution |
| `src/components/LivePreviewListener/index.tsx` | `RefreshRouteOnSave`, draft mode only |
| `src/app/(frontend)/layout.tsx` | Second root layout — isolates site CSS from the admin |
| `src/app/(frontend)/not-found.tsx` | 404 page |
| `src/app/(frontend)/trips/[slug]/page.tsx` | The page: 10 sections, SSG + on-demand |
| `src/app/(frontend)/next/preview/route.ts` | Draft-mode gateway (3 checks) |
| `src/app/(frontend)/next/exit-preview/route.ts` | Clears the draft cookie |
| `src/components/TripPage/*.tsx` | 6 section components + `format.ts` |
| `src/styles/trip-single-next.css` | `details[open]` equivalents of the JS `.is-open` states |

### Corrections and findings

1. **`blurDataURL` → `blurDataUrl`.** Plan §12.1 reads `resource.blurDataURL`; the real field
   is `blurDataUrl`, renamed back in step 3 so Postgres does not mangle the column into
   `blur_data_u_r_l`. The plan's component would have silently never shown a placeholder.
2. **`DefaultNodeTypes` is not exported from `@payloadcms/richtext-lexical/react`,** and
   parameterising `JSXConvertersFunction<DefaultNodeTypes>` does not compile anyway — the
   `blocks` key in `defaultConverters` is a map of block slugs, not a converter, so it fails
   assignment. Left unparameterised; the default type argument is already correct.
3. **Block converters deferred, deliberately.** Only the Posts `content` field enables
   `BlocksFeature`, and the blog route has not landed. `callout` / `tripCard` / `gallery`
   converters arrive with it.
4. **`<details>` instead of a `useState` accordion.** The itinerary and FAQ lists are pure
   server components with zero client JS. Beyond bundle size this is an SEO requirement: an
   FAQ rich result is only awarded when the answer text is in the HTML, which a click-to-render
   accordion cannot satisfy no matter how correct the JSON-LD is.
5. **Name collision with the Vite app.** `src/components/trip/` already held
   `TripPriceRail.jsx` and `TripFaqs.jsx`; adding `.tsx` files of the same name silently
   shadowed them, because esbuild resolves `.tsx` first. The legacy smoke suite caught it.
   New server components live in `src/components/TripPage/`.
6. **Reserved slugs implemented (§10.1).** `slugField()` takes a third `reserved` argument;
   Pages passes `['admin','api','blog','destinations','next','trips']`. Without it a page
   slugged `trips` does not 404 — Next resolves the static segment first, so the page just
   never renders while the editor insists they published it.
7. **Availability text is derived, never typed.** The rail's "N departures open" and the
   per-row seat counts come from live `departures` rows.
8. **`csrf: [getServerSideURL()]` gates cookie auth.** Payload rejects a cookie-authenticated
   request whose `Origin` is not in the allowlist. Browsers always send `Origin`, so the admin
   and the live-preview iframe are fine — but `NEXT_PUBLIC_SERVER_URL` must match the real
   origin or preview will 403. This cost an hour of debugging a "broken" preview route that
   was working correctly.

### npm scripts flipped

`dev`, `build` and `start` are now Next. `dev:next` / `build:next` / `start:next` remain as
aliases so `ci` and existing docs keep working. The Vite app moved to `legacy:dev`,
`legacy:build`, `legacy:preview` — it still builds, and `npm test` still covers it.

### Verification — executed against PostgreSQL, not assumed

A fully-populated trip (3 itinerary days, 2 FAQs, permits, route map, packing list, 3
departures across `available` / `limited` / `sold-out`) plus one unpublished trip were seeded
through the Local API, then the rendered HTML was asserted on.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | clean |
| `npx eslint .` | clean |
| `npm run build` (Next, production) | ✅ `/trips/everest-base-camp-classic` emitted as ● SSG |
| `npm test` (legacy Vite smoke suite) | ✅ `NO RED OK` |
| `npm run legacy:build` (Vite) | ✅ built in 4.42s |
| 33 content assertions on the rendered HTML | ✅ all pass |
| JSON-LD `TouristTrip` + `BreadcrumbList` + `FAQPage` | ✅ present |
| JSON-LD offers exclude the sold-out departure | ✅ 2 of 3 emitted |
| Published trip | 200 |
| **Unpublished trip, anonymous** | **404** — `overrideAccess: false` holds |
| Unknown slug | 404 |
| Preview: no secret / wrong secret | 403 / 403 |
| Preview: `?path=https://evil.com` and `//evil.com` | 400 / 400 — open redirect closed |
| Preview: valid secret, not logged in | 403 |
| Preview: valid secret + session | 307 → sets `__prerender_bypass`, draft renders 200 |
| `LivePreviewListener` chunk | loaded on draft, absent from published |
| `/next/exit-preview` then reload | 404 again |
| `/admin` | 200, still boots |

---

## Next step — 6 (remainder). Blocks, routes and plugins

- `RenderBlocks` + the 19 frontend block components, and the `callout` / `tripCard` /
  `gallery` Lexical converters that go with them
- The remaining routes: `/` and the Pages catch-all, `/trips` index (the `getTrips` helper is
  already written and tagged), `/blog/[slug]`, `/destinations/[slug]`
- `redirectsPlugin` and `searchPlugin`
- A real enquiry form posting to the `enquiries` collection — the trip page's `#enquire`
  anchor and the departure "Reserve" links are placeholders pointing at it

---

## Deferred, promised in the plan

- `redirectsPlugin` and `searchPlugin` — the last items from the original step 6 list. Pitfall 5
  wants redirects installed before the first slug rename reaches production.
- The frontend React components for all 19 blocks (`RenderBlocks` and friends) — step 4
  delivered the CMS-side configs only.
- The initial migration. Still **not** generated, for the reason given under step 3: the schema
  is not deployed anywhere and `push: true` covers development. Generate it once, immediately
  before the first deploy. Note that step 4 renamed several fields during development — exactly
  the pitfall-20 rename prompt — which was handled by dropping and re-pushing the dev schema.

## Environment reminder

`node_modules/` is **not** persisted between sessions. If anything is missing, run `npm install`.
