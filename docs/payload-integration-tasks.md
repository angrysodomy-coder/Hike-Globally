# Payload CMS Integration — Task Tracker

Companion to [`payload-integration-plan.md`](./payload-integration-plan.md). The plan is the
*reference*; this file is the *state*. Update the status table as each step lands.

**Branch:** `arena/01a0f76c-hike-globally`
**Approach:** embedded Payload 3 inside Next.js App Router, one repo, one deploy, Local API.
**Last updated:** 2026-10-01

---

## Status at a glance

| # | Step | Deliverable | Status |
|---|------|-------------|--------|
| 1 | Scaffold | `package.json`, `next.config.ts`, `tsconfig.json`, `.env.example`, `.gitignore`, `src/app/(payload)/**` | ✅ **Done** |
| 2 | Shared primitives | `src/access/*`, `src/fields/{slug,seo,link,artDirectedImage,defaultLexical}.ts`, `src/lib/utils/*` | ✅ **Done** |
| 3 | First boot | `src/collections/{Media,Users}.ts` + `src/payload.config.ts` → `/admin` loads | ✅ **Done** |
| 4 | Core content | `src/collections/Trips/index.ts`, `src/collections/Departures.ts`, `src/hooks/revalidate.ts` | ⬜ Not started |
| 5 | First rendered route | `src/lib/payload.ts`, `src/lib/queries/trips.ts`, `src/app/(frontend)/trips/[slug]/page.tsx` | ⬜ Not started |
| 6 | Remaining collections | Pages, Posts, Destinations, Reviews, Enquiries, Categories, Authors; globals; blocks; plugins | ⬜ Not started |

`/admin` boots, authenticates, and accepts uploads as of step 3. Verified against a real
PostgreSQL 18 instance, not just a typecheck — see the verification table below.

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
3. `npm run dev:next` → http://localhost:3000/admin and create the first user.

`npm run dev` still runs **Vite**, not Next — see the script table above.

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

## Next step — 4. Core content

- `src/collections/Trips/index.ts` — the core collection: pricing, itinerary blocks, gallery, SEO
- `src/collections/Departures.ts` — real booking inventory, replacing `buildDepartures()`
- `src/hooks/revalidate.ts` — on-demand revalidation with the `EDITORIAL` / `CRITICAL` split

---

## Deferred, promised in the plan

To be generated on request, after step 6:

- The 14 remaining layout block configs
- The `Footer` global
- Admin `RowLabel` components: `@/components/admin/{ItineraryRowLabel,TextRowLabel,TitleRowLabel,QuestionRowLabel,LinkRowLabel}`

## Environment reminder

`node_modules/` is **not** persisted between sessions. If anything is missing, run `npm install`.
