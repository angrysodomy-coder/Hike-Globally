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
| 2 | Shared primitives | `src/access/*`, `src/fields/{slug,seo,link,artDirectedImage,defaultLexical}.ts` | ⬜ Not started |
| 3 | First boot | `src/collections/{Media,Users}.ts` + `src/payload.config.ts` → `/admin` loads | ⬜ Not started |
| 4 | Core content | `src/collections/Trips/index.ts`, `src/collections/Departures.ts`, `src/hooks/revalidate.ts` | ⬜ Not started |
| 5 | First rendered route | `src/lib/payload.ts`, `src/lib/queries/trips.ts`, `src/app/(frontend)/trips/[slug]/page.tsx` | ⬜ Not started |
| 6 | Remaining collections | Pages, Posts, Destinations, Reviews, Enquiries, Categories, Authors; globals; blocks; plugins | ⬜ Not started |

Nothing boots until **step 3**. That is expected, not a regression — see "Known-failing commands" below.

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

This keeps the existing site bootable throughout the migration. **At step 3, once `/admin`
renders, flip the names** so `dev`/`build` mean Next and the Vite ones become
`dev:vite`/`build:vite`. Retire the Vite scripts entirely at step 6 when the last page has moved.
The original `test` script chain is preserved verbatim and still passes.

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

## Known-failing commands (expected until step 3)

`src/payload.config.ts` does not exist yet, so the `@payload-config` alias used by all eight
`(payload)` files is unresolved. These therefore fail **by design**:

- `npm run dev:next`
- `npm run build:next`
- `npm run typecheck`
- `npm run generate:types` / `generate:importmap` / `migrate`

Everything that does not touch Payload (`npm run dev`, `npm run build`, `npm test`,
`npm run lint`) works right now.

---

## Next step — 2. Shared primitives

Pure building blocks with no dependency on a config, so they can land before `payload.config.ts`:

- `src/access/` — `anyone.ts`, `authenticated.ts`, `authenticatedOrPublished.ts`
- `src/fields/slug.ts` — hand-rolled (`slugField()` in core is `@experimental`)
- `src/fields/seo.ts`, `src/fields/link.ts`, `src/fields/artDirectedImage.ts`
- `src/fields/defaultLexical.ts` — shared editor config

---

## Deferred, promised in the plan

To be generated on request, after step 6:

- The 14 remaining layout block configs
- The `Footer` global
- Admin `RowLabel` components: `@/components/admin/{ItineraryRowLabel,TextRowLabel,TitleRowLabel,QuestionRowLabel,LinkRowLabel}`

## Environment reminder

`node_modules/` is **not** persisted between sessions. If anything is missing, run `npm install`.
