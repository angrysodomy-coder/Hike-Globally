# Payload CMS Integration Plan — Hike Globally

**Author:** senior full-stack engineer, Next.js + Payload for travel operators
**Date:** 2026-10-01
**Target repo:** `angrysodomy-coder/Hike-Globally` (branch `arena/01a0f76c-hike-globally`)
**Verified against:** `payload@3.90.2`, `next@16.3.8`, `react@19.3.0`, Payload docs + official `website` template (3.x), all checked on 2026-10-01.

---

## Contents

0. [Three corrections to the brief — read first](#0-three-corrections-to-the-brief--read-first)
1. [Assumptions I made for the questions you didn't answer](#1-assumptions-i-made-for-the-questions-you-didnt-answer)
2. [Architecture decision: embedded vs separate](#2-architecture-decision-embedded-vs-separate)
3. [Target repository structure](#3-target-repository-structure)
4. [Migration strategy: Vite SPA → Next.js App Router](#4-migration-strategy-vite-spa--nextjs-app-router)
5. [Installation and configuration — exact steps](#5-installation-and-configuration--exact-steps)
6. [Database: Neon Postgres, migrations, and the `push` trap](#6-database-neon-postgres-migrations-and-the-push-trap)
7. [Media storage: R2 / S3 and the Vercel 4.5 MB ceiling](#7-media-storage-r2--s3-and-the-vercel-45-mb-ceiling)
8. [Collection schemas (full TypeScript)](#8-collection-schemas-full-typescript)
9. [Data layer: Local API vs REST vs GraphQL](#9-data-layer-local-api-vs-rest-vs-graphql)
10. [Dynamic routing strategy](#10-dynamic-routing-strategy)
11. [Revalidation: ISR + on-demand](#11-revalidation-isr--on-demand)
12. [Media rendering: next/image, focal point, art direction](#12-media-rendering-nextimage-focal-point-art-direction)
13. [SEO, Open Graph, and structured data for travel](#13-seo-open-graph-and-structured-data-for-travel)
14. [Drafts, preview, and live preview](#14-drafts-preview-and-live-preview)
15. [Localization — deferred, but decide these now](#15-localization--deferred-but-decide-these-now)
16. [Environment variables and deployment](#16-environment-variables-and-deployment)
17. [Content migration and seeding](#17-content-migration-and-seeding)
18. [What happens to your test suite](#18-what-happens-to-your-test-suite)
19. [Travel-website pitfalls and how to avoid them](#19-travel-website-pitfalls-and-how-to-avoid-them)
20. [Delivery roadmap](#20-delivery-roadmap)

---

## 0. Three corrections to the brief — read first

### 0.1 This is not a Next.js project yet

Your brief assumes a Next.js app. The repo is a **Vite 7 + React 19 SPA in plain JavaScript** with a hand-rolled History-API router (`src/lib/router.jsx`). Payload 3 is not a library you bolt onto any React app — it *is* a set of Next.js App Router route handlers, server components, and a Next plugin. **The Next.js migration is not optional; it is step one.** Section 4 covers it in detail, phased so the site stays shippable throughout.

### 0.2 Use Next.js **16.3.x**, not 15

This is the single most expensive mistake you could make this week. `@payloadcms/next@3.90.2` declares this peer range:

```
next: ">=15.2.9 <15.3.0 || >=15.3.9 <15.4.0 || >=15.4.11 <15.5.0 || >=16.3.3 <17.0.0"
```

Read that carefully: **Next 15.5 and 15.6 are not supported at all**, and the 15.x versions that are supported are narrow patch windows that receive no new features. The Payload docs state the same requirement ("15.2.9–15.2.x, 15.3.9–15.3.x, 15.4.11–15.4.x, 16.2.6+"). The official Payload templates currently pin `next@16.3.3`.

**Decision: `next@16.3.8`, `react@19.2.6`, `react-dom@19.2.6`.** Pin them exactly. Payload's admin panel is a React Server Components application that shares your React instance; a mismatched React minor is a classic source of "Invalid hook call" and hydration errors in the admin panel.

> **Why versions are pinned, not caret-ranged:** Payload ships `@payloadcms/*` packages that are version-locked to `payload` itself (`"payload": "3.90.2"` is an exact peer dependency, not a range). If npm resolves `@payloadcms/ui` to 3.91 while `payload` stays at 3.90, the admin panel breaks in non-obvious ways. Upgrade all `payload`/`@payloadcms/*` packages together, as one commit.

### 0.3 Do not enable Next 16 Cache Components yet

Next 16's headline caching feature is `cacheComponents` (the `'use cache'` directive, `cacheTag`, `cacheLife`). Payload's installation docs say, verbatim: *"While Next.js `cacheComponents` can be enabled alongside Payload without causing errors in the admin panel, full compatibility is not guaranteed."*

**Decision: leave `cacheComponents` off.** Use the stable combination — static rendering + `generateStaticParams` for ISR, `unstable_cache` for tagged dynamic queries, and `revalidatePath` / `revalidateTag` from Payload hooks for on-demand invalidation. Section 11 explains the trade-off and the migration path for when Payload declares compatibility.

Two Next 16 API changes you must know because they appear in the code below:

- **`revalidateTag(tag, profile)` now takes two arguments.** The one-argument form is deprecated. `revalidateTag('trips', 'max')` means "serve stale content while revalidating in the background"; `revalidateTag('trips', { expire: 0 })` means "expire immediately, next request blocks". Both are used below, deliberately, for different content.
- **`next/image` with remote sources blocks private IPs**, and non-default `quality` values must be declared in `images.qualities`. Both are handled in `next.config.ts` in section 5.

---

## 1. Assumptions I made for the questions you didn't answer

You answered six of twenty-eight questions. Here is exactly what I assumed for the rest, and what it costs to change later. **Correct any of these before we write code — the first four are cheap now and expensive in three weeks.**

| # | Question | Assumption | Cost to change later |
| --- | --- | --- | --- |
| 1 | Monorepo? | **Single repo**, one `package.json`, Payload embedded. | Low |
| 2 | Package manager | **pnpm** (Payload's documented preference; npm needs `--legacy-peer-deps` because of the exact peer pins). | Low — swap lockfiles |
| 3 | TS conversion scope | **Phased**: new CMS/data/route code is TS from day one; existing `.jsx` components are converted file-by-file as each page is ported. `allowJs: true` during the transition. | Low |
| 4 | Content migration | **Migrate everything** from `src/data/*.js` + `public/images/*` + the root markdown article into Payload via an idempotent seed script. | Medium — hand re-entry is ~2 days of someone's life |
| 5 | Destinations | **Own collection** (`destinations`) with `/destinations/[slug]` pages, not just a taxonomy string on trips. Your 5 regions already have rich editorial copy, hero images, and stats — that is a content type, not a label. | **High** — converting a `select` field to a relationship after launch means a data migration |
| 6 | Treks vs Trips | **One collection** (`trips`). The "trek rail" is a *presentation* of trips flagged `showInTrekRail`, not a parallel content type. Your own `tripDetails.js` already does this by promoting Annapurna Circuit from a trek into a trip. | Medium |
| 7 | Departures | **Own collection** (`departures`) joined to trips, not an array field. Rationale in §8.7. | **High** |
| 8 | Booking | Payload **captures enquiries** (`enquiries` collection + email notification). No payment processing, no third-party booking engine. The existing `BookingDrawer` posts to a Next route handler. | Medium |
| 9 | Blog body format | **Lexical rich text**. The root markdown article is converted once at seed time. | Medium |
| 10 | Editors | **Non-technical operator staff.** Schemas get descriptions, sensible defaults, `admin.components.RowLabel` on arrays, and grouped sidebars. | Low |
| 11 | Auth | Payload's admin auth is the only auth. No customer accounts. | Medium |
| 12 | Site chrome | Nav, footer, brand, default SEO become **globals** (editable). Section headlines inside bespoke pages stay in code unless you say otherwise. | Low |
| 13 | Reviews | **Own collection**, related to trips. | Low |
| 14 | Search | `@payloadcms/plugin-search` on trips + posts, powering the existing `/trips` search box server-side. | Low |
| 15 | Redirects | `@payloadcms/plugin-redirects` from day one, so slug changes never 404. | Low |
| 16 | Forms | Hand-built enquiry form (typed, matches your existing drawer UX) rather than `plugin-form-builder`. Form Builder is better when editors need to invent new forms; you have exactly two. | Medium |
| 17 | Email | **Resend** via `@payloadcms/email-resend` for enquiry notifications and admin password resets. | Low |
| 18 | Tests | `scripts/*.mjs` smoke tests are **retired and replaced** by Playwright E2E + Vitest unit tests (§18). | Low |
| 19 | Styling | **Untouched.** Your CSS files move across as-is. No Tailwind, no redesign. | Low |
| 20 | Analytics/payments | None wired. | Low |

---

## 2. Architecture decision: embedded vs separate

You chose embedded. Here is the reasoning written down, because you will be asked to justify it.

**What "embedded" means.** Payload 3 is distributed as Next.js App Router files. You drop a `(payload)` route group into your `app/` directory containing the admin panel (`/admin/[[...segments]]`), the REST API (`/api/[...slug]`), and GraphQL (`/api/graphql`). Your `payload.config.ts` sits next to `app/`. One `next build`, one deployment, one process. Your frontend and your CMS share a Node runtime.

**What that buys you — the Local API.** This is the main prize and the concept most people miss. When Payload runs in the same process as your frontend, your server components can call Payload's database layer **as a function call**, not an HTTP request:

```ts
const payload = await getPayload({ config })
const trips = await payload.find({ collection: 'trips', where: { featured: { equals: true } } })
```

No network hop, no serialization, no base URL, no API token, no CORS, no fetch-failure states. It runs access control and hooks exactly like the REST API does, so it is not a backdoor — it is the same engine with the transport removed. On a trip detail page that needs the trip, its 40 departures, its destination, its reviews, and three related posts, this is the difference between ~5 sequential HTTP round trips and ~5 local queries inside one database connection.

| | **Embedded (chosen)** | **Separate service** |
| --- | --- | --- |
| Data access | Local API — direct function calls | REST/GraphQL over HTTP |
| Latency per query | sub-millisecond | 20–200 ms, plus cold starts |
| Deploys | One | Two, version-coupled |
| Preview / live preview | Works out of the box | Needs CORS, cookie domain, and auth plumbing |
| Type safety | `payload-types.ts` imported directly | Generated client, drifts unless regenerated |
| Infra cost | One Vercel project | Two, plus egress |
| Frontend team can't break the CMS | ✗ shared codebase | ✓ hard boundary |
| Multiple frontends (web + native app) | Possible but awkward | Natural |
| Scale frontend and admin independently | ✗ | ✓ |

**When I would choose separate instead:** multiple consuming frontends (a React Native app plus the website), a hard organisational boundary between teams, or a CMS that must survive a frontend rewrite. None applies to a single marketing-and-booking site for one operator. **Embedded is correct here.**

**The one real cost of embedding on Vercel:** your marketing pages and your admin panel share a serverless function configuration. The admin panel is heavy; a cold start on `/admin` can take a few seconds. This does not affect your static trip pages (they are prerendered HTML served from the CDN). Mitigation in §16.

---

## 3. Target repository structure

```
Hike-Globally/
├── public/
│   ├── fonts/                      # @fontsource output stays local
│   └── images/                     # ONLY truly static art (logo, noise texture, favicons)
├── src/
│   ├── app/
│   │   ├── (frontend)/             # everything a visitor sees
│   │   │   ├── layout.tsx          # <html>, fonts, global CSS, providers
│   │   │   ├── page.tsx            # home  — reads the `home` page doc
│   │   │   ├── not-found.tsx
│   │   │   ├── destinations/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── trips/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── [...slug]/page.tsx  # catch-all: CMS pages (about, contact, legal…)
│   │   │   ├── api/
│   │   │   │   └── enquiries/route.ts
│   │   │   ├── next/
│   │   │   │   ├── preview/route.ts
│   │   │   │   └── exit-preview/route.ts
│   │   │   ├── sitemap.ts
│   │   │   └── robots.ts
│   │   └── (payload)/              # generated by Payload — never edit
│   │       ├── admin/[[...segments]]/{page.tsx,not-found.tsx}
│   │       ├── admin/importMap.js
│   │       ├── api/[...slug]/route.ts
│   │       ├── api/graphql/route.ts
│   │       ├── api/graphql-playground/route.ts
│   │       ├── custom.scss
│   │       └── layout.tsx
│   ├── access/                     # reusable access-control functions
│   ├── blocks/                     # page builder: config.ts + Component.tsx per block
│   ├── collections/                # Payload collection configs
│   ├── globals/                    # Header, Footer, SiteSettings
│   ├── fields/                     # reusable field factories (slug, seo, link, image)
│   ├── components/                 # your existing React components, converted
│   ├── hooks/                      # Payload hooks (revalidation, derived fields)
│   ├── lib/
│   │   ├── payload.ts              # getPayloadClient()
│   │   ├── queries/                # typed data-access functions
│   │   ├── seo/                    # generateMeta, JSON-LD builders
│   │   └── utils/
│   ├── styles/                     # your existing CSS, unchanged
│   ├── payload.config.ts
│   └── payload-types.ts            # GENERATED — commit it, never hand-edit
├── scripts/
│   └── seed/                       # one-time migration from src/data/*
├── .env.example
├── next.config.ts
├── tsconfig.json
├── vercel.json
└── package.json
```

Two rules that matter:

1. **`(payload)` is generated and must not be edited.** Those files exist only to import route handlers from `@payloadcms/next`. If you customise them, the next `payload generate:importmap` or version upgrade will fight you.
2. **`payload-types.ts` is generated and must be committed.** It is the contract between your CMS and your frontend. Regenerate with `pnpm generate:types` after *every* schema change; CI should fail if it is stale.

---

## 4. Migration strategy: Vite SPA → Next.js App Router

The site keeps working at every step. Five phases, each independently deployable.

### Phase A — Next.js shell, no CMS (≈1 day)

1. Add Next 16, keep Vite installed and working in parallel (`npm run dev:vite` still boots the old app) until phase D.
2. Create `src/app/(frontend)/layout.tsx`. Move `index.html`'s `<head>` into Next `metadata`, and the `@fontsource` imports into the root layout.
3. Import `src/styles.css` and `src/styles/*.css` in the root layout. **They work unchanged** — Next supports global CSS imports from the root layout.
4. Replace `src/lib/router.jsx` with file-system routing. Your `ROUTES` array and `DYNAMIC_ROUTES` regexes become directories. Delete the router. Replace `<Link>` from your router with `next/link`.

### Phase B — Component triage (≈2 days)

Every existing component falls into one of three buckets. The rule: **a component needs `'use client'` if it uses state, effects, browser APIs, or animation libraries.**

| Component | Verdict | Note |
| --- | --- | --- |
| `Hero.jsx`, `TreksSection.jsx`, `TripsSection.jsx`, `DestinationsSection.jsx`, `JournalSection.jsx`, `ReviewsSection.jsx` | Split | Outer **server** component fetches from Payload and renders markup; inner `'use client'` child owns the GSAP/framer-motion behaviour. |
| `BookingDrawer.jsx`, `StoryDrawer.jsx`, `Header.jsx` | `'use client'` | Stateful UI. Keep whole. |
| `Reveal.jsx`, `useReveal.js`, `Noise.jsx` | `'use client'` | IntersectionObserver / canvas. |
| `Logo.jsx`, `Footer.jsx` | Server | Pure markup. Footer reads the `footer` global. |
| `SummerFamilyTreksBlog.jsx`, `articleMarkdown.jsx` | **Delete after seeding** | Replaced by Lexical rich text rendered through `RichText`. |
| `src/data/*.js` | **Delete after seeding** | Replaced by `src/lib/queries/*`. |

**GSAP + ScrollTrigger specifically.** GSAP touches `document` at import time in some plugins. Register plugins inside an effect, inside a client component, and guard the whole thing:

```tsx
'use client'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function PinnedRail({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ trigger: '.rail', pin: true, scrub: true })
    }, scope)
    return () => ctx.revert()       // critical: RSC re-renders remount this
  }, [])

  return <div ref={scope}>{children}</div>
}
```

`gsap.context(...).revert()` in the cleanup is not optional. Without it, soft navigations (and live preview's `router.refresh()`) stack ScrollTriggers until scrolling locks up.

### Phase C — Payload installed, schemas live, admin usable (≈2 days)
Sections 5–8. Editors can start loading real content while the frontend still reads `src/data`.

### Phase D — Pages cut over to Payload, one route at a time (≈3–4 days)
Order: `/blog/[slug]` (simplest, proves the pipeline) → `/blog` → `/trips/[slug]` (hardest, most value) → `/trips` → `/destinations` → home → catch-all pages. Delete the matching `src/data` export as each route flips.

### Phase E — Vite removed, tests rewritten, deployed (≈1 day)
Delete `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, the Vite devDependencies, and `scripts/*.mjs`. Ship.

**Total: ~9–10 working days** for one experienced engineer, excluding content entry.

---

## 5. Installation and configuration — exact steps

### 5.1 Install

```bash
# switch to pnpm (optional but recommended — Payload's exact peer pins fight npm)
corepack enable
corepack prepare pnpm@11 --activate
rm -rf node_modules package-lock.json
pnpm import && rm -f package-lock.json   # convert the existing lockfile, then drop it

# Next.js 16 + React (exact pins — see §0.2)
pnpm add next@16.3.8 react@19.2.6 react-dom@19.2.6

# Payload core
pnpm add payload@3.90.2 @payloadcms/next@3.90.2 @payloadcms/ui@3.90.2 \
  @payloadcms/richtext-lexical@3.90.2 @payloadcms/db-postgres@3.90.2 \
  @payloadcms/storage-s3@3.90.2 @payloadcms/email-resend@3.90.2 \
  @payloadcms/live-preview-react@3.90.2 @payloadcms/admin-bar@3.90.2 \
  graphql@^16.8.1 sharp@0.35.4

# Plugins
pnpm add @payloadcms/plugin-seo@3.90.2 @payloadcms/plugin-redirects@3.90.2 \
  @payloadcms/plugin-search@3.90.2

# Dev
pnpm add -D typescript@5.7.3 @types/node@22 @types/react@19.2.14 @types/react-dom@19.2.3 \
  eslint-config-next@16.3.8 cross-env@^7 tsx@^4
```

> `sharp` is what resizes your images and makes focal points work. It is optional in Payload only if you never upload images. You upload a lot of images.

### 5.2 `package.json` scripts

```jsonc
{
  "type": "module",
  "scripts": {
    "dev": "cross-env NODE_OPTIONS=--no-deprecation next dev",
    "devsafe": "rm -rf .next && pnpm dev",
    "build": "cross-env NODE_OPTIONS=--no-deprecation next build",
    "start": "cross-env NODE_OPTIONS=--no-deprecation next start",
    "ci": "payload migrate && pnpm build",
    "payload": "cross-env NODE_OPTIONS=--no-deprecation payload",
    "generate:types": "cross-env NODE_OPTIONS=--no-deprecation payload generate:types",
    "generate:importmap": "cross-env NODE_OPTIONS=--no-deprecation payload generate:importmap",
    "migrate:create": "cross-env NODE_OPTIONS=--no-deprecation payload migrate:create",
    "migrate": "cross-env NODE_OPTIONS=--no-deprecation payload migrate",
    "seed": "cross-env NODE_OPTIONS=--no-deprecation tsx scripts/seed/index.ts",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "engines": { "node": ">=20.9.0" }
}
```

`NODE_OPTIONS=--no-deprecation` suppresses noisy punycode warnings from transitive deps; every Payload template does this.

### 5.3 `next.config.ts`

```ts
import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: path.resolve(dirname) },
  images: {
    // Payload serves uploads from /api/media/file/** when not using object storage.
    // Declaring it as a LOCAL pattern keeps Next from routing it through
    // remotePatterns, which blocks private IPs since Next 16.
    localPatterns: [{ pathname: '/api/media/file/**' }],
    qualities: [60, 75, 90],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: new URL(SERVER_URL).hostname },
      // your public media domain (R2 custom domain / CloudFront / S3 website endpoint)
      ...(process.env.NEXT_PUBLIC_MEDIA_URL
        ? [{ protocol: 'https' as const, hostname: new URL(process.env.NEXT_PUBLIC_MEDIA_URL).hostname }]
        : []),
    ],
  },
  // Payload's admin UI ships Sass partials; this keeps Turbopack resolving them.
  sassOptions: { loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'] },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
```

`withPayload` is mandatory — it externalises native/server-only dependencies (`sharp`, Drizzle, the Postgres driver) so the bundler doesn't try to ship them to the browser. `devBundleServerPackages: false` makes dev reloads noticeably faster.

### 5.4 `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "allowJs": true,              // flip to false at the end of the TS conversion
    "skipLibCheck": true,
    "noEmit": true,
    "incremental": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@payload-config": ["./src/payload.config.ts"],
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", "next-env.d.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

The `@payload-config` alias is **required** — the generated `(payload)` files import from it by name.

### 5.5 The `(payload)` directory

Copy these seven files verbatim from the official blank template (`github.com/payloadcms/payload/tree/3.x/templates/blank/src/app/(payload)`). They never change and you never edit them. The two you will see referenced most:

```ts
// src/app/(payload)/api/[...slug]/route.ts
import config from '@payload-config'
import '@payloadcms/next/css'
import { REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
```

```tsx
// src/app/(payload)/layout.tsx
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'
import { importMap } from './admin/importMap.js'
import './custom.scss'

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

const Layout = ({ children }: { children: React.ReactNode }) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
```

> **Why two route groups?** `(frontend)` and `(payload)` are Next route groups — parentheses mean "don't add a URL segment". They exist so the admin panel can have its own `<html>`/`<body>` and its own CSS without inheriting your fonts, your global stylesheet, or your GSAP providers. Your `(frontend)/layout.tsx` owns `<html>` for the public site; `(payload)/layout.tsx` owns it for `/admin`.

### 5.6 `src/payload.config.ts`

```ts
import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig, type PayloadRequest } from 'payload'
import sharp from 'sharp'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { resendAdapter } from '@payloadcms/email-resend'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { searchPlugin } from '@payloadcms/plugin-search'
import type { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'

import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from '@/lib/utils/getURL'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'

import { Users } from '@/collections/Users'
import { Media } from '@/collections/Media'
import { Categories } from '@/collections/Categories'
import { Authors } from '@/collections/Authors'
import { Destinations } from '@/collections/Destinations'
import { Trips } from '@/collections/Trips'
import { Departures } from '@/collections/Departures'
import { Posts } from '@/collections/Posts'
import { Pages } from '@/collections/Pages'
import { Reviews } from '@/collections/Reviews'
import { Enquiries } from '@/collections/Enquiries'

import { Header } from '@/globals/Header'
import { Footer } from '@/globals/Footer'
import { SiteSettings } from '@/globals/SiteSettings'

import type { Page, Post, Trip, Destination } from '@/payload-types'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** `payload migrate` sets argv[2]; used to pick the direct DB endpoint. */
const isMigrating = process.argv[2]?.startsWith('migrate') ?? false

type SEOable = Page | Post | Trip | Destination

const generateTitle: GenerateTitle<SEOable> = ({ doc }) =>
  doc?.title ? `${doc.title} | Hike Globally` : 'Hike Globally'

const generateURL: GenerateURL<SEOable> = ({ doc, collectionSlug }) => {
  const base = getServerSideURL()
  if (!doc?.slug) return base
  const prefix =
    collectionSlug === 'posts' ? '/blog'
    : collectionSlug === 'trips' ? '/trips'
    : collectionSlug === 'destinations' ? '/destinations'
    : ''
  return `${base}${prefix}/${doc.slug}`
}

export default buildConfig({
  serverURL: getServerSideURL(),
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · Hike Globally CMS',
    },
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 390, height: 844 },
        { label: 'Tablet', name: 'tablet', width: 834, height: 1112 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },

  editor: defaultLexical,

  db: postgresAdapter({
    pool: {
      // Migrations issue DDL, which is unreliable through PgBouncer's
      // transaction pooling — route them at Neon's direct endpoint.
      connectionString: isMigrating
        ? process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || ''
        : process.env.DATABASE_URL || '',
      // Neon's pooler already fronts the database. A large client-side pool on
      // top of it just multiplies idle connections across serverless instances.
      max: process.env.VERCEL ? 1 : 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    },
    // Dev convenience: auto-sync schema. MUST be false in production — see §6.
    push: process.env.NODE_ENV === 'development',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),

  collections: [
    Pages, Posts, Trips, Departures, Destinations,
    Reviews, Enquiries, Categories, Authors, Media, Users,
  ],
  globals: [Header, Footer, SiteSettings],

  cors: [getServerSideURL()].filter(Boolean),
  csrf: [getServerSideURL()].filter(Boolean),

  email: resendAdapter({
    defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@hikeglobally.com',
    defaultFromName: 'Hike Globally',
    apiKey: process.env.RESEND_API_KEY || '',
  }),

  plugins: [
    seoPlugin({ generateTitle, generateURL }),
    redirectsPlugin({
      collections: ['pages', 'posts', 'trips', 'destinations'],
      overrides: { hooks: { afterChange: [revalidateRedirects] } },
    }),
    searchPlugin({
      collections: ['trips', 'posts'],
      defaultPriorities: { trips: 20, posts: 10 },
    }),
    s3Storage({
      enabled: Boolean(process.env.S3_BUCKET),
      collections: { media: true },
      bucket: process.env.S3_BUCKET || '',
      // Vercel caps a serverless request body at 4.5 MB. Hero plates are bigger.
      clientUploads: true,
      config: {
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT,       // R2: https://<account>.r2.cloudflarestorage.com
        forcePathStyle: true,                    // required for R2 / MinIO
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],

  // Scheduled publishing needs a worker. On Vercel that is a cron hitting
  // /api/payload-jobs/run — see §14.4 and vercel.json in §16.
  jobs: {
    tasks: [],
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        if (req.user) return true
        const secret = process.env.CRON_SECRET
        if (!secret) return false
        return req.headers.get('authorization') === `Bearer ${secret}`
      },
    },
  },

  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  graphQL: { disablePlaygroundInProduction: true },
})
```

### 5.7 The default rich-text editor

Define it once so every `richText` field inherits the same feature set.

```ts
// src/fields/defaultLexical.ts
import {
  BlocksFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
  type LinkFields,
} from '@payloadcms/richtext-lexical'

export const defaultLexical = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    UnorderedListFeature(),
    OrderedListFeature(),
    HorizontalRuleFeature(),
    UploadFeature({
      collections: {
        media: {
          fields: [
            { name: 'caption', type: 'text' },
            { name: 'size', type: 'select', defaultValue: 'full',
              options: [
                { label: 'Full bleed', value: 'full' },
                { label: 'Inset', value: 'inset' },
                { label: 'Half width', value: 'half' },
              ] },
          ],
        },
      },
    }),
    // Do NOT pass `enabledCollections` here. Payload validates relationship
    // targets at boot and throws `InvalidFieldRelationship` for any collection
    // that is not registered yet, which makes /admin unbootable during an
    // incremental rollout. Instead each collection opts itself out with
    // `admin.enableRichTextLink: false` (see Media and Users in §8.1/§8.2) and
    // Payload derives the set from what is actually registered.
    LinkFeature({
      fields: ({ defaultFields }) => [
        ...defaultFields.filter((f) => !('name' in f) || f.name !== 'url'),
        {
          name: 'url',
          type: 'text',
          admin: {
            condition: (_data, siblingData) => siblingData?.linkType !== 'internal',
          },
          label: 'URL',
          required: true,
          validate: ((value: string | null | undefined, options: { siblingData: Partial<LinkFields> }) => {
            if (options?.siblingData?.linkType === 'internal') return true
            return value ? true : 'URL is required'
          }) as never,
        },
      ],
    }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})
```

> **Concept — Lexical.** Payload 3's rich text is Lexical (Meta's editor). It stores a **JSON tree**, not HTML or Markdown. That is deliberate: JSON is queryable, diffable for versions, and can embed *your own Payload blocks* inline (a CTA, a trip card, a map) that render as real React components. Rendering is covered in §9.4.

---

## 6. Database: Neon Postgres, migrations, and the `push` trap

**Choice: Neon Postgres via Vercel's Neon integration, using `@payloadcms/db-postgres`.**

> **Corrected during implementation (step 1).** The first draft of this plan specified `@payloadcms/db-vercel-postgres`. Installing it emitted:
> ```
> npm warn deprecated @vercel/postgres@0.10.0: @vercel/postgres is deprecated…
> it should have been migrated to Neon as a native Vercel integration
> ```
> `db-vercel-postgres` is built on `@vercel/postgres`, which Vercel has deprecated now that Vercel Postgres *is* Neon. Taking a new dependency on a deprecated driver for a project with a multi-year horizon is not defensible, so the adapter was swapped before any config was written. `npm ls @vercel/postgres` now returns empty.

`@payloadcms/db-postgres` uses `pg` (node-postgres), which is actively maintained and works identically on Vercel, Railway, or a VPS — so the "cost to change hosting later" drops to zero.

**The serverless-pooling concern is handled at the database, not the client.** Neon exposes two endpoints: a *pooled* one (hostname contains `-pooler`, fronted by PgBouncer) and a *direct* one. Point the running app at the pooled endpoint with a small client pool (`max: 1` on Vercel) and PgBouncer absorbs the connection churn. The old `too many connections` failure mode comes from stacking a large client-side pool on top of that, which the config in §5.6 avoids.

**Point migrations at the direct endpoint.** DDL through PgBouncer's transaction pooling is unreliable — this is the single most common Neon + Payload deployment failure. The `isMigrating` switch in §5.6 handles it automatically via `DATABASE_URL_UNPOOLED`.

### 6.1 Why Postgres and not Mongo for this project

Travel content is **relational**: a departure belongs to a trip, a trip belongs to a destination, a review belongs to both a trip and a departure, a post relates to many trips. You will write queries like "all departures in the next 90 days, with places remaining, for trips in the Annapurna region, sorted by date". Postgres does that with an index. Mongo does it with application-side joins. Postgres also gives you real constraints on price and date fields, which matters when the data drives what someone pays.

### 6.2 `push` vs migrations — the trap

Payload's Postgres adapter has a `push` mode that diffs your config against the live schema and applies changes automatically. It is wonderful in development and **catastrophic in production**: it will happily drop a column (and its data) when you rename a field.

**The rule:**

```
development  → push: true,  no migration files
production   → push: false, migrations committed to git and run in CI
```

The config in §5.6 already encodes this via `process.env.NODE_ENV`.

Workflow when you change a schema:

```bash
# 1. edit a collection
pnpm generate:types                 # refresh payload-types.ts
# 2. in dev, push applies it automatically; verify in /admin
# 3. freeze it into a migration
pnpm migrate:create add_departure_status
# 4. review the generated SQL in src/migrations/ — ALWAYS read it
git add src/migrations && git commit
```

Vercel then runs `payload migrate && next build` (the `ci` script) on deploy. Migrations run **before** the build so `generateStaticParams` queries a schema that exists.

### 6.3 Postgres-specific modelling warnings

Payload maps relational structures to real tables. Each `array` field becomes a table; each `blocks` field becomes one table *per block type* plus a parent table; `hasMany` relationships become join tables. A Trip with 20 itinerary days × 3 gallery images is ~4 tables and ~80 rows — fine. But a page-builder block nested three levels deep with arrays inside arrays will produce a table count that makes migrations slow and `depth`-based queries expensive.

**Practical limits I apply on travel sites:** blocks nest at most two levels; arrays never contain blocks; anything that would be a third level becomes its own collection with a relationship.

---

## 7. Media storage: R2 / S3 and the Vercel 4.5 MB ceiling

### 7.1 Why not local disk

Vercel's filesystem is ephemeral and read-only at runtime. An upload written to `public/media` during a request vanishes on the next cold start and never reaches other instances. **Object storage is mandatory on Vercel.** This is the single most common "my images disappeared" support ticket.

### 7.2 Recommended: Cloudflare R2 behind a custom domain

R2 is S3-compatible, has **zero egress fees**, and sits behind Cloudflare's CDN for free. For an image-heavy travel site serving 2–4 MB of photography per page view, egress is the cost that bites. Rough monthly comparison at 500 GB served: R2 ≈ $7 storage-only; S3 ≈ $45 in egress alone; Vercel Blob is simplest but priced per GB served.

Use `@payloadcms/storage-s3` pointed at R2 (the config in §5.6 does this). The `@payloadcms/storage-r2` package is for Cloudflare Workers only — not applicable on Vercel.

Setup:
1. Create an R2 bucket, e.g. `hikeglobally-media`.
2. Connect a custom domain (`media.hikeglobally.com`) in the R2 dashboard — this makes objects publicly readable over the CDN without presigned URLs.
3. Create an API token scoped to that bucket; put the credentials in the env vars from §16.
4. Add CORS on the bucket allowing `PUT` and the `If-None-Match` header from your site origin — required by `clientUploads`.

### 7.3 `clientUploads: true` is not optional on Vercel

A Vercel serverless function rejects request bodies over **4.5 MB**. Your `hero-himalaya.webp` and any RAW-derived JPEG an editor drags in will exceed that. With `clientUploads: true`, Payload's admin requests a presigned URL and the browser uploads **straight to R2**, bypassing the function entirely. Without it, editors get an opaque 413 and blame the CMS.

### 7.4 Alternative: Vercel Blob

If you want zero third-party setup, swap `s3Storage` for:

```ts
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

vercelBlobStorage({
  collections: { media: true },
  token: process.env.BLOB_READ_WRITE_TOKEN || '',
  clientUploads: true,
  cacheControlMaxAge: 365 * 24 * 60 * 60,
})
```

Trade-off: one less vendor, one less DNS record, and it is wired up by the Vercel integration automatically — but you pay Vercel's per-GB rate for every byte served, with no CDN of your own in front. For a brochure site, fine. For a photography-led travel site with a global audience, R2 pays for itself in the first month.

---

## 8. Collection schemas (full TypeScript)

> **Concept — collections, fields, hooks, access.** A *collection* is a content type (a database table + an admin UI + a REST/GraphQL/Local API). *Fields* define its shape and its admin controls. *Hooks* are functions Payload runs around operations (`beforeChange`, `afterChange`, `afterRead`…) — this is where derived values and cache invalidation live. *Access functions* return `true`, `false`, or a **query constraint** that Payload merges into every read — that last form is how "the public sees only published docs" works without you writing a `where` clause on every query.

### 8.0 Shared primitives

```ts
// src/access/index.ts
import type { Access, FieldAccess, PayloadRequest } from 'payload'
import type { User } from '@/payload-types'

export const anyone: Access = () => true

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

export const isAdmin: Access = ({ req: { user } }) =>
  Boolean((user as User | null)?.roles?.includes('admin'))

export const isAdminField: FieldAccess = ({ req: { user } }) =>
  Boolean((user as User | null)?.roles?.includes('admin'))

/**
 * "May this person open /admin at all." This slot is narrower than `Access`:
 * it must return a plain boolean, so passing `authenticated` here is a type
 * error. That is a feature — it is a different question from "may this person
 * read this document".
 */
export const canAccessAdminUI = ({ req: { user } }: { req: PayloadRequest }): boolean =>
  Boolean(user)

/**
 * Logged-in users see everything (including drafts).
 * The public gets a query constraint limiting them to published documents.
 */
export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
```

```ts
// src/fields/slug.ts
import type { FieldHook, TextField } from 'payload'

export const formatSlug = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')  // strip diacritics: "Pokharā" → "Pokhara"
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const slugHook =
  (sourceField: string): FieldHook =>
  ({ data, operation, value }) => {
    if (typeof value === 'string' && value.length > 0) return formatSlug(value)
    if (operation === 'create' || !data?.slug) {
      const source = data?.[sourceField]
      if (typeof source === 'string' && source.length > 0) return formatSlug(source)
    }
    return value
  }

/**
 * URL-safe, unique, indexed identifier. Auto-fills from `sourceField` on create,
 * then stops touching itself so a live URL never silently changes.
 */
// `Partial<TextField>` does not work here: TextField is a discriminated union
// on `hasMany`, so a partial widens `hasMany` to `true | undefined` and the
// object stops being assignable. Omit the keys that select the variant.
type SlugFieldOverrides = Partial<
  Omit<TextField, 'hasMany' | 'maxRows' | 'minRows' | 'name' | 'type' | 'validate'>
>

export const slugField = (sourceField = 'title', overrides: SlugFieldOverrides = {}): TextField => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  required: true,
  admin: {
    position: 'sidebar',
    description:
      'The URL segment for this document. Auto-filled from the title. Changing it after publishing breaks existing links — add a redirect if you do.',
  },
  hooks: { beforeValidate: [slugHook(sourceField)] },
  ...overrides,
})
```

> **Trade-off — core `slugField` vs this one.** Payload 3.90 exports a `slugField()` from `payload` itself with a nicer admin widget (a regenerate checkbox). Its source is annotated `@experimental — this field may change or be removed`. On a client project with a two-year horizon I use the 25-line version above: zero upgrade risk, identical behaviour, and you can read it. Swap to core's later if you want the widget.

```ts
// src/fields/seo.ts
import type { Tab } from 'payload'
import {
  MetaDescriptionField, MetaImageField, MetaTitleField, OverviewField, PreviewField,
} from '@payloadcms/plugin-seo/fields'

/** Drop-in SEO tab. Use the same one on every public collection. */
export const seoTab: Tab = {
  name: 'meta',
  label: 'SEO',
  fields: [
    OverviewField({ titlePath: 'meta.title', descriptionPath: 'meta.description', imagePath: 'meta.image' }),
    MetaTitleField({ hasGenerateFn: true }),
    MetaDescriptionField({ hasGenerateFn: true }),
    MetaImageField({ relationTo: 'media' }),
    PreviewField({ hasGenerateFn: true, titlePath: 'meta.title', descriptionPath: 'meta.description' }),
  ],
}
```

```ts
// src/fields/artDirectedImage.ts
import type { GroupField } from 'payload'

/**
 * Your hero already ships two crops (hero-himalaya.webp + hero-himalaya-mobile.webp).
 * Art direction = a DIFFERENT CROP, not a different size; next/image cannot do it
 * from one source. Model it explicitly so editors cannot forget the portrait plate.
 */
export const artDirectedImage = (name = 'image', label = 'Image'): GroupField => ({
  name,
  type: 'group',
  label,
  fields: [
    {
      name: 'desktop',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Landscape crop. Used from 768px up.' },
    },
    {
      name: 'mobile',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional portrait crop for phones. Falls back to the desktop image.' },
    },
    {
      name: 'objectPosition',
      type: 'text',
      defaultValue: 'center center',
      admin: {
        description:
          'CSS object-position, e.g. "center 42%". Only needed when the media focal point is not enough.',
      },
    },
  ],
})
```

```ts
// src/fields/link.ts
import type { CollectionSlug, Field } from 'payload'

// `relationTo` is a required parameter, not a hardcoded default: `CollectionSlug`
// is generated from the collections currently registered, so a baked-in
// ['pages','posts','trips','destinations'] stops compiling until all four exist.
// Call sites pass [...LINKABLE_COLLECTIONS] from src/collections/linkable.ts.
export const linkField = (options: {
  relationTo: CollectionSlug[]
  name?: string
  label?: string
}): Field => ({
  name: options.name ?? 'link',
  type: 'group',
  label: options.label ?? 'Link',
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'radio',
          defaultValue: 'reference',
          options: [
            { label: 'Internal page', value: 'reference' },
            { label: 'Custom URL', value: 'custom' },
          ],
          admin: { layout: 'horizontal', width: '50%' },
        },
        {
          name: 'newTab',
          type: 'checkbox',
          label: 'Open in new tab',
          admin: { width: '50%', style: { alignSelf: 'flex-end' } },
        },
      ],
    },
    {
      name: 'reference',
      type: 'relationship',
      relationTo: options.relationTo,
      required: true,
      admin: { condition: (_, sibling) => sibling?.type === 'reference' },
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: { condition: (_, sibling) => sibling?.type === 'custom' },
    },
    { name: 'label', type: 'text', required: true },
  ],
})
```

### 8.1 Media

```ts
// src/collections/Media.ts
import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { generateBlurDataURL } from '@/hooks/generateBlurDataURL'

export const Media: CollectionConfig<'media'> = {
  slug: 'media',
  folders: true, // Payload 3.90 media folders — essential once you pass ~200 assets
  admin: {
    group: 'Library',
    // Keeps media out of the rich-text internal-link picker — see §5.7.
    enableRichTextLink: false,
    defaultColumns: ['filename', 'alt', 'credit', 'updatedAt'],
    description: 'Every image and video on the site. Alt text is required — it is read aloud and it is SEO.',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  // Only these fields come back when media is referenced from another document.
  // Without this, every trip query drags the full media doc for every image.
  defaultPopulate: {
    url: true, alt: true, width: true, height: true, mimeType: true,
    focalX: true, focalY: true, sizes: true, blurDataUrl: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Describe what is in the photo for someone who cannot see it. "Prayer flags above Phoksundo lake" — not "image1".',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: { description: 'Optional visible caption, shown under the image where the layout supports it.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'credit', type: 'text', admin: { width: '50%', description: 'Photographer or source.' } },
        {
          name: 'licence',
          type: 'select',
          admin: { width: '50%' },
          defaultValue: 'owned',
          options: [
            { label: 'Owned / commissioned', value: 'owned' },
            { label: 'Licensed stock', value: 'stock' },
            { label: 'Creative Commons', value: 'cc' },
            { label: 'Guest submission (permission on file)', value: 'guest' },
          ],
        },
      ],
    },
    {
      name: 'location',
      type: 'text',
      admin: { description: 'Where it was taken. Used for photo credits and internal search.' },
    },
    {
      // `blurDataUrl`, not `blurDataURL`. Payload derives Postgres column names
      // by splitting camelCase, and each capital in a run becomes its own
      // underscore: `blurDataURL` lands as `blur_data_u_r_l`. `dbName` is not
      // available on scalar fields, so the field name is the only lever — and
      // renaming a column after the first production migration means writing
      // the ALTER by hand. Map it to next/image's `blurDataURL` prop in
      // CMSImage instead.
      name: 'blurDataUrl',
      type: 'text',
      admin: { hidden: true, readOnly: true },
    },
  ],
  hooks: {
    // Generates a 16px base64 blur placeholder on upload — see §12.4.
    beforeChange: [generateBlurDataURL],
  },
  upload: {
    adminThumbnail: 'thumbnail',
    focalPoint: true,  // editors drag a point; §12 turns it into object-position
    crop: true,
    mimeTypes: ['image/*', 'video/mp4', 'application/pdf'],
    // Converting every derivative to WebP halves bytes before next/image even runs.
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [
      { name: 'thumbnail', width: 400,  height: 300, position: 'centre' },
      { name: 'card',      width: 768 },
      { name: 'feature',   width: 1280 },
      { name: 'hero',      width: 1920 },
      { name: 'heroMobile', width: 900, height: 1200, position: 'centre' },
      { name: 'og',        width: 1200, height: 630, crop: 'center',
        formatOptions: { format: 'jpeg', options: { quality: 85 } } }, // OG scrapers dislike WebP
    ],
  },
}
```

**Why these sizes.** They match real breakpoints on your site, not round numbers: `card` 768 for the trips grid and journal cards, `feature` 1280 for itinerary-day photography, `hero` 1920 for the full-bleed plates, `heroMobile` as a 3:4 portrait crop, `og` as a hard 1200×630 JPEG because Facebook/LinkedIn scrapers still mishandle WebP. `thumbnail` exists for the admin list view.

### 8.2 Users

```ts
// src/collections/Users.ts
import type { CollectionConfig } from 'payload'
import { authenticated, canAccessAdminUI, isAdmin, isAdminField } from '@/access'

export const Users: CollectionConfig<'users'> = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles'],
    group: 'Settings',
    enableRichTextLink: false, // never a valid internal link target — see §5.7
  },
  auth: {
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    read: authenticated,
    create: isAdmin,
    update: ({ req: { user }, id }) =>
      Boolean(user?.roles?.includes('admin')) || user?.id === id,
    delete: isAdmin,
    admin: canAccessAdminUI, // who may open /admin at all
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      access: { create: isAdminField, update: isAdminField },
      options: [
        { label: 'Admin — full access including users and settings', value: 'admin' },
        { label: 'Editor — content, trips, media', value: 'editor' },
        { label: 'Operations — departures, enquiries only', value: 'operations' },
      ],
    },
  ],
}
```

> Note the `access.roles` field-level guard: without it, an editor could POST `roles: ['admin']` to their own profile and escalate. Collection-level access does not protect individual fields.

### 8.3 Categories and Authors

```ts
// src/collections/Categories.ts
import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { slugField } from '@/fields/slug'

export const Categories: CollectionConfig<'categories'> = {
  slug: 'categories',
  admin: { useAsTitle: 'title', group: 'Journal', defaultColumns: ['title', 'slug'] },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  defaultPopulate: { title: true, slug: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    slugField(),
  ],
}
```

```ts
// src/collections/Authors.ts
import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { slugField } from '@/fields/slug'

/** Your guides double as article authors and trip bylines (tripAuthors in the old data). */
export const Authors: CollectionConfig<'authors'> = {
  slug: 'authors',
  admin: { useAsTitle: 'name', group: 'People', defaultColumns: ['name', 'role', 'updatedAt'] },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  defaultPopulate: { name: true, slug: true, role: true, initials: true, photo: true },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'text',
      required: true,
      admin: { description: 'e.g. "Lead mountain guide · 19 Himalayan seasons"' },
    },
    {
      name: 'initials',
      type: 'text',
      maxLength: 3,
      admin: { description: 'Fallback avatar when no photo is set, e.g. "PS".' },
      hooks: {
        beforeChange: [
          ({ value, data }) =>
            value ||
            String(data?.name ?? '')
              .split(' ')
              .filter(Boolean)
              .map((part: string) => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase(),
        ],
      },
    },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'bio', type: 'richText' },
    { name: 'languages', type: 'text', hasMany: true },
    { name: 'yearsGuiding', type: 'number', min: 0 },
    slugField('name'),
  ],
}
```

### 8.4 Destinations (your five regions)

```ts
// src/collections/Destinations.ts
import type { CollectionConfig } from 'payload'
import { authenticated, publishedOrAuthenticated } from '@/access'
import { slugField } from '@/fields/slug'
import { seoTab } from '@/fields/seo'
import { artDirectedImage } from '@/fields/artDirectedImage'
import { generatePreviewPath } from '@/lib/utils/generatePreviewPath'
import { revalidateDestination, revalidateDestinationDelete } from '@/hooks/revalidate'

export const Destinations: CollectionConfig<'destinations'> = {
  slug: 'destinations',
  labels: { singular: 'Destination', plural: 'Destinations' },
  admin: {
    useAsTitle: 'title',
    group: 'Catalogue',
    defaultColumns: ['title', 'kicker', 'displayOrder', '_status', 'updatedAt'],
    livePreview: { url: ({ data, req }) => generatePreviewPath({ collection: 'destinations', slug: String(data?.slug ?? ''), req }) },
    preview: (data, { req }) => generatePreviewPath({ collection: 'destinations', slug: String(data?.slug ?? ''), req }),
  },
  // Drafts are ON for this collection, so read access MUST filter them out for
  // the public. `read: anyone` here would publish every unfinished draft.
  access: { read: publishedOrAuthenticated, create: authenticated, update: authenticated, delete: authenticated },
  defaultPopulate: { title: true, slug: true, kicker: true, cardImage: true },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'e.g. "Far West"' } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'kicker', type: 'text', required: true, admin: { width: '60%', description: 'Sub-line: "Kanjakali · Api Himal · Khaptad"' } },
                { name: 'displayOrder', type: 'number', required: true, defaultValue: 10, admin: { width: '20%', description: 'Lower sorts first.' } },
                {
                  name: 'tileSize', type: 'select', defaultValue: 'standard', admin: { width: '20%' },
                  options: [
                    { label: 'Feature (large tile)', value: 'feature' },
                    { label: 'Standard', value: 'standard' },
                  ],
                },
              ],
            },
            { name: 'summary', type: 'textarea', required: true, maxLength: 400, admin: { description: 'The paragraph shown on the bento tile and region explorer.' } },
            { name: 'body', type: 'richText', admin: { description: 'Long-form copy for the destination landing page.' } },
            artDirectedImage('heroImage', 'Hero image'),
            { name: 'cardImage', type: 'upload', relationTo: 'media', required: true, admin: { description: 'Square-ish crop for grid tiles and nav menus.' } },
            { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, maxRows: 12 },
          ],
        },
        {
          label: 'Facts',
          fields: [
            {
              name: 'stats', type: 'array', maxRows: 4, labels: { singular: 'Stat', plural: 'Stats' },
              fields: [
                { type: 'row', fields: [
                  { name: 'value', type: 'number', required: true, admin: { width: '25%' } },
                  { name: 'suffix', type: 'text', admin: { width: '25%', description: '"+", "%", "m"…' } },
                  { name: 'label', type: 'text', required: true, admin: { width: '50%' } },
                ]},
                { name: 'note', type: 'text' },
              ],
            },
            {
              name: 'bestSeasons', type: 'select', hasMany: true, required: true,
              options: ['Spring', 'Summer', 'Autumn', 'Winter'].map((s) => ({ label: s, value: s.toLowerCase() })),
            },
            {
              name: 'faqs', type: 'array',
              admin: { components: { RowLabel: '@/components/admin/QuestionRowLabel#QuestionRowLabel' } },
              fields: [
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'richText', required: true },
              ],
            },
          ],
        },
        seoTab,
      ],
    },
    slugField(),
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
  ],
  hooks: { afterChange: [revalidateDestination], afterDelete: [revalidateDestinationDelete] },
  versions: { drafts: { autosave: { interval: 375 }, schedulePublish: true }, maxPerDoc: 25 },
}
```

### 8.5 Trips / Packages — the core collection

This is where travel sites live or die. Every field below maps to something your current site already renders.

```ts
// src/collections/Trips/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated, publishedOrAuthenticated } from '@/access'
import { slugField } from '@/fields/slug'
import { seoTab } from '@/fields/seo'
import { artDirectedImage } from '@/fields/artDirectedImage'
import { generatePreviewPath } from '@/lib/utils/generatePreviewPath'
import { revalidateTrip, revalidateTripDelete } from '@/hooks/revalidate'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'

const SEASONS = [
  { label: 'Spring (Mar–May)', value: 'spring' },
  { label: 'Summer / monsoon (Jun–Aug)', value: 'summer' },
  { label: 'Autumn (Sep–Nov)', value: 'autumn' },
  { label: 'Winter (Dec–Feb)', value: 'winter' },
]

export const Trips: CollectionConfig<'trips'> = {
  slug: 'trips',
  labels: { singular: 'Trip', plural: 'Trips & packages' },
  admin: {
    useAsTitle: 'title',
    group: 'Catalogue',
    defaultColumns: ['title', 'destination', 'durationDays', 'basePrice', '_status', 'updatedAt'],
    listSearchableFields: ['title', 'summary', 'slug'],
    livePreview: { url: ({ data, req }) => generatePreviewPath({ collection: 'trips', slug: String(data?.slug ?? ''), req }) },
    preview: (data, { req }) => generatePreviewPath({ collection: 'trips', slug: String(data?.slug ?? ''), req }),
  },
  access: { read: publishedOrAuthenticated, create: authenticated, update: authenticated, delete: authenticated },
  // Shown wherever a trip is referenced (related trips, blog cross-links, nav).
  defaultPopulate: {
    title: true, slug: true, summary: true, durationDays: true, basePrice: true,
    currency: true, difficulty: true, cardImage: true, destination: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'e.g. "Everest Base Camp"' } },

    {
      type: 'tabs',
      tabs: [
        // ── 1. Overview ────────────────────────────────────────────────
        {
          label: 'Overview',
          fields: [
            {
              name: 'summary', type: 'textarea', required: true, maxLength: 320,
              admin: { description: 'One or two sentences. Used on cards, search results, and as the SEO description fallback.' },
            },
            {
              name: 'highlight', type: 'text', required: true,
              admin: { description: 'The single image everyone carries home: "First light on the icefall from the ridge above Gorak Shep".' },
            },
            { name: 'overview', type: 'richText', admin: { description: 'Long-form "about this trek" copy for the detail page.' } },
            {
              name: 'highlights', type: 'array', minRows: 3, maxRows: 10,
              labels: { singular: 'Highlight', plural: 'Highlights' },
              admin: { components: { RowLabel: '@/components/admin/TextRowLabel#TextRowLabel' } },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
            {
              type: 'row',
              fields: [
                { name: 'destination', type: 'relationship', relationTo: 'destinations', required: true, admin: { width: '50%' } },
                { name: 'location', type: 'text', required: true, admin: { width: '50%', description: 'Human-readable: "Khumbu, Nepal".' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'durationDays', type: 'number', required: true, min: 1, max: 120, admin: { width: '25%' } },
                {
                  name: 'difficulty', type: 'select', required: true, admin: { width: '25%' },
                  options: [
                    { label: 'Easy', value: 'easy' },
                    { label: 'Moderate', value: 'moderate' },
                    { label: 'Challenging', value: 'challenging' },
                    { label: 'Strenuous', value: 'strenuous' },
                  ],
                },
                {
                  name: 'tripType', type: 'select', required: true, defaultValue: 'trek', admin: { width: '25%' },
                  options: [
                    { label: 'Trek', value: 'trek' },
                    { label: 'Cultural tour', value: 'tour' },
                    { label: 'Expedition', value: 'expedition' },
                    { label: 'Peak climb', value: 'peak' },
                  ],
                },
                { name: 'maxAltitudeMetres', type: 'number', required: true, min: 0, max: 9000, admin: { width: '25%', description: 'Metres. Formatted for display in code.' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'seasons', type: 'select', hasMany: true, required: true, options: SEASONS, admin: { width: '50%' } },
                { name: 'primeSeason', type: 'select', required: true, options: SEASONS, admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'groupSizeMax', type: 'number', required: true, defaultValue: 8, min: 1, admin: { width: '33%' } },
                { name: 'guideRatio', type: 'text', defaultValue: '1:4', admin: { width: '33%', description: 'Guides to travellers.' } },
                { name: 'minimumAge', type: 'number', admin: { width: '33%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'featured', type: 'checkbox', label: 'Feature on the homepage', admin: { width: '33%' } },
                { name: 'showInTrekRail', type: 'checkbox', label: 'Show in the "Trails worth taking" rail', admin: { width: '33%' } },
                { name: 'railOrder', type: 'number', admin: { width: '33%', condition: (_, s) => Boolean(s?.showInTrekRail) } },
              ],
            },
          ],
        },

        // ── 2. Itinerary ──────────────────────────────────────────────
        {
          label: 'Itinerary',
          fields: [
            {
              name: 'itinerary', type: 'array', minRows: 1,
              labels: { singular: 'Day', plural: 'Days' },
              admin: {
                initCollapsed: true,
                components: { RowLabel: '@/components/admin/ItineraryRowLabel#ItineraryRowLabel' },
                description: 'One row per day. Day numbers are derived from the row order — just drag to reorder.',
              },
              fields: [
                { name: 'title', type: 'text', required: true, admin: { description: 'e.g. "Phakding to Namche Bazaar"' } },
                {
                  type: 'row',
                  fields: [
                    { name: 'altitudeMetres', type: 'number', admin: { width: '25%' } },
                    { name: 'walkingHours', type: 'text', admin: { width: '25%', description: '"6 hours", "3–4 hours", or "No walking".' } },
                    { name: 'distanceKm', type: 'number', admin: { width: '25%' } },
                    { name: 'ascentMetres', type: 'number', admin: { width: '25%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'accommodation', type: 'text', admin: { width: '50%', description: '"Panorama Lodge, Namche Bazaar"' } },
                    {
                      name: 'meals', type: 'select', hasMany: true, admin: { width: '50%' },
                      options: [
                        { label: 'Breakfast', value: 'breakfast' },
                        { label: 'Lunch', value: 'lunch' },
                        { label: 'Dinner', value: 'dinner' },
                      ],
                    },
                  ],
                },
                { name: 'body', type: 'richText', required: true },
                { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, maxRows: 4, admin: { description: 'Up to four photos for this day. They auto-slide in the accordion.' } },
                { name: 'isAcclimatisationDay', type: 'checkbox' },
              ],
            },
            {
              name: 'routeMap', type: 'group',
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media' },
                { name: 'caption', type: 'text' },
                {
                  name: 'legend', type: 'array', maxRows: 6,
                  fields: [
                    { type: 'row', fields: [
                      { name: 'label', type: 'text', required: true, admin: { width: '40%' } },
                      { name: 'value', type: 'text', required: true, admin: { width: '60%' } },
                    ]},
                  ],
                },
              ],
            },
          ],
        },

        // ── 3. Pricing & departures ───────────────────────────────────
        {
          label: 'Pricing & departures',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'basePrice', type: 'number', required: true, min: 0, admin: { width: '33%', description: 'Per person, twin share, in the currency below. Whole units — no decimals.' } },
                {
                  name: 'currency', type: 'select', required: true, defaultValue: 'USD', admin: { width: '33%' },
                  options: [
                    { label: 'USD $', value: 'USD' },
                    { label: 'EUR €', value: 'EUR' },
                    { label: 'GBP £', value: 'GBP' },
                    { label: 'AUD $', value: 'AUD' },
                  ],
                },
                { name: 'depositPercent', type: 'number', defaultValue: 20, min: 0, max: 100, admin: { width: '33%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'singleSupplement', type: 'number', min: 0, admin: { width: '50%' } },
                { name: 'privateSurchargePercent', type: 'number', min: 0, max: 100, defaultValue: 18, admin: { width: '50%' } },
              ],
            },
            {
              name: 'groupPricing', type: 'array', maxRows: 6,
              labels: { singular: 'Group tier', plural: 'Group tiers' },
              admin: { description: 'Optional per-head discounts by group size. Leave empty to use the base price for everyone.' },
              fields: [
                { type: 'row', fields: [
                  { name: 'minTravellers', type: 'number', required: true, min: 1, admin: { width: '33%' } },
                  { name: 'maxTravellers', type: 'number', min: 1, admin: { width: '33%' } },
                  { name: 'pricePerPerson', type: 'number', required: true, min: 0, admin: { width: '33%' } },
                ]},
              ],
            },
            // Read-only live view of the Departures collection, editable inline.
            {
              name: 'departures', type: 'join', collection: 'departures', on: 'trip',
              defaultSort: 'startDate', defaultLimit: 25,
              admin: { defaultColumns: ['startDate', 'status', 'spotsRemaining', 'price'], allowCreate: true },
            },
          ],
        },

        // ── 4. Inclusions ─────────────────────────────────────────────
        {
          label: 'Inclusions',
          fields: [
            {
              name: 'includes', type: 'array', minRows: 1,
              admin: { components: { RowLabel: '@/components/admin/TextRowLabel#TextRowLabel' } },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
            {
              name: 'excludes', type: 'array', minRows: 1,
              admin: { components: { RowLabel: '@/components/admin/TextRowLabel#TextRowLabel' } },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
            {
              name: 'packingList', type: 'array', maxRows: 8,
              labels: { singular: 'Packing group', plural: 'Packing groups' },
              fields: [
                { type: 'row', fields: [
                  { name: 'title', type: 'text', required: true, admin: { width: '50%' } },
                  { name: 'note', type: 'text', admin: { width: '50%' } },
                ]},
                { name: 'items', type: 'array', minRows: 1, fields: [{ name: 'text', type: 'text', required: true }] },
              ],
            },
          ],
        },

        // ── 5. Practical ──────────────────────────────────────────────
        {
          label: 'Practical',
          fields: [
            {
              name: 'essentialInfo', type: 'array',
              admin: { initCollapsed: true, components: { RowLabel: '@/components/admin/TitleRowLabel#TitleRowLabel' } },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'body', type: 'richText', required: true },
              ],
            },
            {
              name: 'faqs', type: 'array',
              admin: { initCollapsed: true, components: { RowLabel: '@/components/admin/QuestionRowLabel#QuestionRowLabel' } },
              fields: [
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'richText', required: true },
              ],
            },
            { name: 'permits', type: 'array', fields: [{ name: 'name', type: 'text', required: true }, { name: 'handledByUs', type: 'checkbox', defaultValue: true }] },
          ],
        },

        // ── 6. Media & relationships ──────────────────────────────────
        {
          label: 'Media',
          fields: [
            artDirectedImage('heroImage', 'Hero image'),
            { name: 'cardImage', type: 'upload', relationTo: 'media', required: true },
            { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, maxRows: 24 },
            { name: 'leadGuide', type: 'relationship', relationTo: 'authors' },
            { name: 'relatedTrips', type: 'relationship', relationTo: 'trips', hasMany: true, maxDepth: 1,
              filterOptions: ({ id }) => ({ id: { not_equals: id } }) },
            { name: 'relatedPosts', type: 'relationship', relationTo: 'posts', hasMany: true, maxDepth: 1 },
            { name: 'reviews', type: 'join', collection: 'reviews', on: 'trip', defaultLimit: 10 },
          ],
        },

        seoTab,
      ],
    },

    slugField(),
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
  ],

  hooks: {
    beforeChange: [populatePublishedAt],
    afterChange: [revalidateTrip],
    afterDelete: [revalidateTripDelete],
  },
  versions: {
    drafts: { autosave: { interval: 375 }, schedulePublish: true },
    maxPerDoc: 50,
  },
}
```

**Deliberate choices worth defending in a review:**

- **`durationDays` is a number, not `"15 days"`.** Your current data stores both (`duration: '15 days'` *and* `durationDays: 15`) and they can drift. Store the number; format in a `formatDuration()` helper. The same applies to `maxAltitudeMetres` (number) versus `'5,364 m'` (presentation).
- **`basePrice` is a whole-unit integer with an explicit `currency`.** Never a float, never a string with a symbol baked in. Floats and money are a bug waiting for a rounding error; a currency-less number is a bug waiting for a lawsuit.
- **Day numbers are derived from array order**, not stored. Editors insert an acclimatisation day at position 4 and everything renumbers for free. Storing `day: 'Day 04'` means hand-editing twelve rows.
- **`highlights`, `includes`, `excludes` are arrays of `{ text }`, not a single textarea.** Lists must be individually addressable for structured data and for the two-column includes/excludes layout you already have.
- **`relatedTrips` uses `filterOptions`** so a trip cannot relate to itself — a small guard that prevents an infinite render loop in the related-trips rail.

### 8.6 Departures — the booking inventory

```ts
// src/collections/Departures.ts
import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { revalidateDeparture, revalidateDepartureDelete } from '@/hooks/revalidate'

export const Departures: CollectionConfig<'departures'> = {
  slug: 'departures',
  labels: { singular: 'Departure', plural: 'Departures' },
  admin: {
    group: 'Operations',
    useAsTitle: 'startDate',
    defaultColumns: ['trip', 'startDate', 'status', 'spotsRemaining', 'price'],
    description: 'Every bookable date. Operations can edit these without touching trip content.',
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  defaultPopulate: { startDate: true, endDate: true, status: true, spotsRemaining: true, price: true, currency: true, guaranteed: true },
  indexes: [{ fields: ['trip', 'startDate'], unique: true }],
  fields: [
    { name: 'trip', type: 'relationship', relationTo: 'trips', required: true, index: true, maxDepth: 0 },
    {
      type: 'row',
      fields: [
        { name: 'startDate', type: 'date', required: true, index: true, admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } } },
        { name: 'endDate', type: 'date', admin: { width: '50%', readOnly: true, date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' }, description: 'Derived from the trip duration.' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'spotsTotal', type: 'number', required: true, min: 1, defaultValue: 8, admin: { width: '33%' } },
        { name: 'spotsRemaining', type: 'number', required: true, min: 0, defaultValue: 8, admin: { width: '33%' } },
        {
          name: 'status', type: 'select', required: true, defaultValue: 'available', admin: { width: '33%', readOnly: true, description: 'Derived from places remaining.' },
          options: [
            { label: 'Available', value: 'available' },
            { label: 'Limited places', value: 'limited' },
            { label: 'Sold out', value: 'sold-out' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'price', type: 'number', min: 0, admin: { width: '50%', description: 'Overrides the trip base price for this date. Leave empty to inherit.' } },
        { name: 'guaranteed', type: 'checkbox', label: 'Guaranteed departure', admin: { width: '50%' } },
      ],
    },
    { name: 'isPrivate', type: 'checkbox', label: 'Private departure (hidden from the public calendar)' },
    { name: 'note', type: 'text', admin: { description: 'Shown on the calendar, e.g. "Festival dates — book early".' } },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, originalDoc }) => {
        const tripId = data?.trip ?? originalDoc?.trip
        // Derive endDate from the trip's duration so operations only enter a start date.
        if (tripId && data?.startDate) {
          const trip = await req.payload.findByID({
            collection: 'trips',
            id: typeof tripId === 'object' ? tripId.id : tripId,
            depth: 0,
            select: { durationDays: true },
            req,
          })
          const start = new Date(data.startDate)
          const end = new Date(start)
          end.setUTCDate(end.getUTCDate() + Math.max(0, (trip?.durationDays ?? 1) - 1))
          data.endDate = end.toISOString()
        }
        // Derive status from inventory unless it has been cancelled outright.
        if (data?.status !== 'cancelled') {
          const remaining = Number(data?.spotsRemaining ?? originalDoc?.spotsRemaining ?? 0)
          data.status = remaining <= 0 ? 'sold-out' : remaining <= 3 ? 'limited' : 'available'
        }
        return data
      },
    ],
    afterChange: [revalidateDeparture],
    afterDelete: [revalidateDepartureDelete],
  },
}
```

> **Why a separate collection and not an array on the trip.** Four reasons, all of which you will hit. (1) **Write contention** — operations update availability daily; an array field means rewriting the whole trip document (and creating a new version) every time someone books. (2) **Cross-trip queries** — "all departures in the next 60 days with places left" is one indexed query here and a full table scan over JSON there. (3) **Access control** — your operations staff can own departures without edit rights on trip copy. (4) **Revalidation granularity** — selling the last place on one date should not invalidate your entire trips index. The `join` field gives editors the array-like UX inside the trip anyway, so nothing is lost.
>
> Your current code generates departures with a hash function at render time (`buildDepartures(trip, from = new Date())`). That is also a **hydration bug** — `new Date()` differs between the server render and the browser. Moving to real stored dates fixes correctness and hydration in one move.

### 8.7 Posts (Blog / Journal)

```ts
// src/collections/Posts/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated, publishedOrAuthenticated } from '@/access'
import { slugField } from '@/fields/slug'
import { seoTab } from '@/fields/seo'
import { generatePreviewPath } from '@/lib/utils/generatePreviewPath'
import { revalidatePost, revalidatePostDelete } from '@/hooks/revalidate'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { populateReadingTime } from '@/hooks/populateReadingTime'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { CalloutBlock } from '@/blocks/Callout/config'
import { TripCardBlock } from '@/blocks/TripCard/config'
import { GalleryBlock } from '@/blocks/Gallery/config'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  labels: { singular: 'Article', plural: 'Journal' },
  admin: {
    useAsTitle: 'title',
    group: 'Journal',
    defaultColumns: ['title', 'categories', 'publishedAt', '_status'],
    livePreview: { url: ({ data, req }) => generatePreviewPath({ collection: 'posts', slug: String(data?.slug ?? ''), req }) },
    preview: (data, { req }) => generatePreviewPath({ collection: 'posts', slug: String(data?.slug ?? ''), req }),
  },
  // Drafts must not leak. `publishedOrAuthenticated` returns a query constraint
  // for anonymous readers rather than a flat false, so published posts stay public.
  access: { read: publishedOrAuthenticated, create: authenticated, update: authenticated, delete: authenticated },
  defaultPopulate: { title: true, slug: true, excerpt: true, heroImage: true, publishedAt: true, readingTime: true, categories: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'excerpt', type: 'textarea', required: true, maxLength: 320, admin: { description: 'Teaser for cards, the journal index, and the SEO description fallback.' } },
            { name: 'heroImage', type: 'upload', relationTo: 'media', required: true },
            {
              name: 'content', type: 'richText', required: true,
              // Extend the global default editor with article-only inline blocks,
              // so a writer can drop a trip card or a callout mid-paragraph.
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures,
                  BlocksFeature({ blocks: [CalloutBlock, TripCardBlock, GalleryBlock] }),
                ],
              }),
              admin: { description: 'The article body. Use H2/H3 for structure — they become the on-page table of contents and your heading hierarchy for SEO.' },
            },
          ],
        },
        {
          label: 'Meta',
          fields: [
            { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true, required: true, maxDepth: 1 },
            { name: 'authors', type: 'relationship', relationTo: 'authors', hasMany: true, required: true, maxDepth: 1 },
            { name: 'relatedTrips', type: 'relationship', relationTo: 'trips', hasMany: true, maxDepth: 1,
              admin: { description: 'Shown as "Journeys mentioned in this article". This is the highest-converting module on a travel blog — always fill it in.' } },
            { name: 'relatedPosts', type: 'relationship', relationTo: 'posts', hasMany: true, maxDepth: 1,
              filterOptions: ({ id }) => ({ id: { not_equals: id } }) },
            {
              type: 'row',
              fields: [
                { name: 'featured', type: 'checkbox', admin: { width: '50%', description: 'Pins to the top of the journal index.' } },
                { name: 'readingTime', type: 'number', admin: { width: '50%', readOnly: true, description: 'Minutes. Calculated from the body on save.' } },
              ],
            },
          ],
        },
        seoTab,
      ],
    },
    slugField(),
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
  ],
  hooks: {
    beforeChange: [populatePublishedAt, populateReadingTime],
    afterChange: [revalidatePost],
    afterDelete: [revalidatePostDelete],
  },
  versions: { drafts: { autosave: { interval: 375 }, schedulePublish: true }, maxPerDoc: 50 },
}
```

Supporting hooks:

```ts
// src/hooks/populatePublishedAt.ts
import type { CollectionBeforeChangeHook } from 'payload'

/** Stamp publishedAt the first time a document is published. */
export const populatePublishedAt: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if ((operation === 'create' || operation === 'update') && !data.publishedAt && data._status === 'published') {
    return { ...data, publishedAt: new Date().toISOString() }
  }
  return data
}
```

```ts
// src/hooks/populateReadingTime.ts
import type { CollectionBeforeChangeHook } from 'payload'

type LexicalNode = { text?: string; children?: LexicalNode[] }

export const lexicalToPlainText = (node: unknown): string => {
  if (!node || typeof node !== 'object') return ''
  const typed = node as LexicalNode & { root?: LexicalNode }
  if (typed.root) return lexicalToPlainText(typed.root)
  const own = typeof typed.text === 'string' ? typed.text : ''
  const children = Array.isArray(typed.children) ? typed.children.map(lexicalToPlainText).join(' ') : ''
  return `${own} ${children}`.trim()
}

const WORDS_PER_MINUTE = 220

export const populateReadingTime: CollectionBeforeChangeHook = ({ data }) => {
  if (!data?.content) return data
  const words = lexicalToPlainText(data.content).split(/\s+/).filter(Boolean).length
  return { ...data, readingTime: Math.max(1, Math.round(words / WORDS_PER_MINUTE)) }
}
```

### 8.8 Pages and the block library

```ts
// src/collections/Pages/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated, publishedOrAuthenticated } from '@/access'
import { slugField } from '@/fields/slug'
import { seoTab } from '@/fields/seo'
import { generatePreviewPath } from '@/lib/utils/generatePreviewPath'
import { revalidatePage, revalidatePageDelete } from '@/hooks/revalidate'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'

import { HeroBlock } from '@/blocks/Hero/config'
import { RichTextBlock } from '@/blocks/RichText/config'
import { MarqueeBlock } from '@/blocks/Marquee/config'
import { StatsBlock } from '@/blocks/Stats/config'
import { DestinationBentoBlock } from '@/blocks/DestinationBento/config'
import { TripRailBlock } from '@/blocks/TripRail/config'
import { TripGridBlock } from '@/blocks/TripGrid/config'
import { ItineraryShowcaseBlock } from '@/blocks/ItineraryShowcase/config'
import { InclusionsBlock } from '@/blocks/Inclusions/config'
import { SeasonMatrixBlock } from '@/blocks/SeasonMatrix/config'
import { TestimonialsBlock } from '@/blocks/Testimonials/config'
import { PostFeedBlock } from '@/blocks/PostFeed/config'
import { FAQBlock } from '@/blocks/FAQ/config'
import { GalleryBlock } from '@/blocks/Gallery/config'
import { MediaBlock } from '@/blocks/Media/config'
import { CTABlock } from '@/blocks/CTA/config'
import { EnquiryFormBlock } from '@/blocks/EnquiryForm/config'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    group: 'Site',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    livePreview: { url: ({ data, req }) => generatePreviewPath({ collection: 'pages', slug: String(data?.slug ?? ''), req }) },
    preview: (data, { req }) => generatePreviewPath({ collection: 'pages', slug: String(data?.slug ?? ''), req }),
  },
  access: { read: publishedOrAuthenticated, create: authenticated, update: authenticated, delete: authenticated },
  defaultPopulate: { title: true, slug: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Layout',
          fields: [
            {
              name: 'layout', type: 'blocks', required: true, minRows: 1,
              admin: { initCollapsed: true },
              blocks: [
                HeroBlock, RichTextBlock, MediaBlock, MarqueeBlock, StatsBlock,
                DestinationBentoBlock, TripRailBlock, TripGridBlock,
                ItineraryShowcaseBlock, InclusionsBlock, SeasonMatrixBlock,
                TestimonialsBlock, PostFeedBlock, GalleryBlock, FAQBlock,
                CTABlock, EnquiryFormBlock,
              ],
            },
          ],
        },
        seoTab,
      ],
    },
    slugField(),
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
  hooks: {
    beforeChange: [populatePublishedAt],
    afterChange: [revalidatePage],
    afterDelete: [revalidatePageDelete],
  },
  versions: { drafts: { autosave: { interval: 375 }, schedulePublish: true }, maxPerDoc: 50 },
}
```

> **Concept — blocks.** A `blocks` field is a repeatable, ordered list where each row can be a *different* shape. That is how an editor builds a landing page: add a Hero, then a Stats band, then a Trip rail, reorder by dragging. Each block is `{ slug, fields }` on the CMS side and one React component on the frontend; `RenderBlocks` maps between them.

Three representative block configs — the remaining fourteen follow the identical pattern:

```ts
// src/blocks/Hero/config.ts
import type { Block } from 'payload'
import { artDirectedImage } from '@/fields/artDirectedImage'
import { linkField } from '@/fields/link'

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',          // names the generated TS interface
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    {
      name: 'variant', type: 'select', required: true, defaultValue: 'cinematic',
      options: [
        { label: 'Cinematic full-bleed (home)', value: 'cinematic' },
        { label: 'Parallax (trips / destinations)', value: 'parallax' },
        { label: 'Editorial (about, legal)', value: 'editorial' },
      ],
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea', maxLength: 280 },
    artDirectedImage('background', 'Background image'),
    { name: 'links', type: 'array', maxRows: 2, fields: [linkField()] },
    {
      name: 'overlayOpacity', type: 'number', min: 0, max: 100, defaultValue: 35,
      admin: { description: 'Percentage of dark overlay. Raise it when the headline is hard to read.' },
    },
  ],
}
```

```ts
// src/blocks/TripGrid/config.ts
import type { Block } from 'payload'

export const TripGridBlock: Block = {
  slug: 'tripGrid',
  interfaceName: 'TripGridBlock',
  labels: { singular: 'Trip grid', plural: 'Trip grids' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'intro', type: 'textarea' },
    {
      name: 'source', type: 'radio', defaultValue: 'auto', required: true,
      options: [
        { label: 'Automatic (by filter)', value: 'auto' },
        { label: 'Hand-picked', value: 'manual' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'filters', type: 'group',
      admin: { condition: (_, s) => s?.source === 'auto' },
      fields: [
        { name: 'destinations', type: 'relationship', relationTo: 'destinations', hasMany: true },
        { name: 'difficulty', type: 'select', hasMany: true, options: ['easy', 'moderate', 'challenging', 'strenuous'].map((v) => ({ label: v, value: v })) },
        { name: 'seasons', type: 'select', hasMany: true, options: ['spring', 'summer', 'autumn', 'winter'].map((v) => ({ label: v, value: v })) },
        { name: 'featuredOnly', type: 'checkbox' },
        { name: 'limit', type: 'number', defaultValue: 6, min: 1, max: 24 },
      ],
    },
    {
      name: 'trips', type: 'relationship', relationTo: 'trips', hasMany: true, maxDepth: 1,
      admin: { condition: (_, s) => s?.source === 'manual' },
    },
    { name: 'showFilters', type: 'checkbox', label: 'Show the interactive filter bar', defaultValue: false },
  ],
}
```

```ts
// src/blocks/FAQ/config.ts
import type { Block } from 'payload'

export const FAQBlock: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Questions, answered' },
    {
      name: 'items', type: 'array', minRows: 1,
      admin: { components: { RowLabel: '@/components/admin/QuestionRowLabel#QuestionRowLabel' } },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'richText', required: true },
      ],
    },
    {
      name: 'emitStructuredData', type: 'checkbox', defaultValue: true,
      admin: { description: 'Adds FAQPage JSON-LD. Only enable on ONE FAQ block per page — Google penalises duplicates.' },
    },
  ],
}
```

**The full block library** (configs follow the same shape; I'll generate them on request):

| Block | Replaces | Key fields |
| --- | --- | --- |
| `hero` | `Hero.jsx`, trips/destinations heroes | variant, heading, art-directed background, links |
| `richText` | prose sections | content |
| `media` | inline figures | image, caption, size |
| `marquee` | `destinationMarquee`, `tripsMarquee` | items[], speed, theme |
| `stats` | `destinationStats`, `tripStats` | items[{value, suffix, label, note}], animate |
| `destinationBento` | `DestinationsSection.jsx` | auto/manual, destinations[] |
| `tripRail` | `TreksSection.jsx` horizontal rail | source, trips[], heading |
| `tripGrid` | `TripsSection.jsx`, `/trips` | filters, showFilters |
| `itineraryShowcase` | `signatureItinerary` | trip relationship **or** manual days[] |
| `inclusions` | `tripInclusions` | items[{title, body, icon}] |
| `seasonMatrix` | `seasonGuide` | rows[{month, rating, note}] |
| `testimonials` | `ReviewsSection.jsx`, `destinationVoices` | auto (by rating/trip) or manual reviews[] |
| `postFeed` | `JournalSection.jsx` | category filter, limit, layout |
| `gallery` | trip galleries | images[], layout |
| `faq` | `tripsFaqs`, `destinationFaqs` | items[], emitStructuredData |
| `cta` | closing CTA bands | heading, body, background, links |
| `enquiryForm` | `BookingDrawer` inline variant | heading, trip prefill, consent text |

### 8.9 Reviews

```ts
// src/collections/Reviews.ts
import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/access'

export const Reviews: CollectionConfig<'reviews'> = {
  slug: 'reviews',
  admin: {
    group: 'People',
    useAsTitle: 'name',
    defaultColumns: ['name', 'trip', 'rating', 'travelledOn', 'featured'],
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  defaultPopulate: { name: true, location: true, quote: true, rating: true, travelledOn: true, initials: true },
  fields: [
    { type: 'row', fields: [
      { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
      { name: 'location', type: 'text', required: true, admin: { width: '50%', description: '"London, UK"' } },
    ]},
    { name: 'initials', type: 'text', maxLength: 3, admin: { description: 'Avatar fallback.' } },
    { name: 'quote', type: 'textarea', required: true, maxLength: 600 },
    { type: 'row', fields: [
      { name: 'rating', type: 'number', required: true, min: 1, max: 5, defaultValue: 5, admin: { width: '33%' } },
      { name: 'travelledOn', type: 'date', required: true, admin: { width: '33%', date: { pickerAppearance: 'monthOnly', displayFormat: 'MMMM yyyy' } } },
      { name: 'featured', type: 'checkbox', admin: { width: '33%' } },
    ]},
    { name: 'trip', type: 'relationship', relationTo: 'trips', index: true, maxDepth: 0 },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'verified', type: 'checkbox', defaultValue: true, admin: { description: 'Only verified reviews are used in aggregateRating structured data. Do not tick this for anything you cannot evidence.' } },
  ],
}
```

### 8.10 Enquiries (booking leads)

```ts
// src/collections/Enquiries.ts
import type { CollectionConfig } from 'payload'
import { authenticated, isAdmin, isAdminField } from '@/access'

export const Enquiries: CollectionConfig<'enquiries'> = {
  slug: 'enquiries',
  labels: { singular: 'Enquiry', plural: 'Enquiries' },
  admin: {
    group: 'Operations',
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'trip', 'preferredDate', 'status', 'createdAt'],
    description: 'Every booking enquiry submitted from the site.',
  },
  access: {
    // The public route handler creates these with overrideAccess:false, so this
    // must allow anonymous create — and ONLY create.
    create: () => true,
    read: authenticated,
    update: authenticated,
    delete: isAdmin,
  },
  fields: [
    { type: 'row', fields: [
      { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
      { name: 'email', type: 'email', required: true, index: true, admin: { width: '50%' } },
    ]},
    { type: 'row', fields: [
      { name: 'phone', type: 'text', admin: { width: '50%' } },
      { name: 'country', type: 'text', admin: { width: '50%' } },
    ]},
    { type: 'row', fields: [
      { name: 'trip', type: 'relationship', relationTo: 'trips', maxDepth: 1, admin: { width: '50%' } },
      { name: 'departure', type: 'relationship', relationTo: 'departures', maxDepth: 1, admin: { width: '50%' } },
    ]},
    { type: 'row', fields: [
      { name: 'travellers', type: 'number', min: 1, max: 40, defaultValue: 2, admin: { width: '33%' } },
      { name: 'preferredDate', type: 'date', admin: { width: '33%', date: { pickerAppearance: 'dayOnly' } } },
      {
        name: 'status', type: 'select', defaultValue: 'new', admin: { width: '33%' },
        options: [
          { label: 'New', value: 'new' },
          { label: 'Contacted', value: 'contacted' },
          { label: 'Quoted', value: 'quoted' },
          { label: 'Booked', value: 'booked' },
          { label: 'Lost', value: 'lost' },
        ],
      },
    ]},
    { name: 'message', type: 'textarea', maxLength: 4000 },
    { name: 'consent', type: 'checkbox', required: true, admin: { description: 'Explicit consent to be contacted. Required for GDPR.' } },
    { name: 'source', type: 'text', admin: { readOnly: true, description: 'Page the enquiry came from.' } },
    {
      name: 'internalNotes', type: 'textarea',
      access: { read: isAdminField, update: isAdminField },
      admin: { description: 'Never shown to the customer.' },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc
        const to = process.env.ENQUIRY_NOTIFICATION_EMAIL
        if (!to) return doc
        try {
          await req.payload.sendEmail({
            to,
            subject: `New enquiry — ${doc.name}${doc.trip ? ` · ${typeof doc.trip === 'object' ? doc.trip.title : doc.trip}` : ''}`,
            text: [
              `Name: ${doc.name}`,
              `Email: ${doc.email}`,
              `Phone: ${doc.phone ?? '—'}`,
              `Country: ${doc.country ?? '—'}`,
              `Travellers: ${doc.travellers ?? '—'}`,
              `Preferred date: ${doc.preferredDate ?? '—'}`,
              `Source: ${doc.source ?? '—'}`,
              '',
              doc.message ?? '',
            ].join('\n'),
          })
        } catch (error) {
          req.payload.logger.error({ err: error }, 'Failed to send enquiry notification')
        }
        return doc
      },
    ],
  },
  timestamps: true,
}
```

### 8.11 Globals

> **Concept — globals.** A global is a singleton document: exactly one Header, one Footer, one Settings. Same fields, hooks, versions, and access as a collection, but no list view and no `id` to look up.

```ts
// src/globals/Header.ts
import type { GlobalConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { linkField } from '@/fields/link'
import { revalidateGlobal } from '@/hooks/revalidate'

export const Header: GlobalConfig = {
  slug: 'header',
  admin: { group: 'Site' },
  access: { read: anyone, update: authenticated },
  fields: [
    {
      name: 'navItems', type: 'array', maxRows: 8,
      admin: { components: { RowLabel: '@/components/admin/LinkRowLabel#LinkRowLabel' } },
      fields: [
        linkField(),
        {
          name: 'children', type: 'array', maxRows: 8,
          admin: { description: 'Optional dropdown.' },
          fields: [linkField()],
        },
      ],
    },
    { name: 'ctaLabel', type: 'text', defaultValue: 'Plan your journey' },
  ],
  hooks: { afterChange: [revalidateGlobal('header')] },
  versions: { drafts: false, max: 20 },
}
```

```ts
// src/globals/SiteSettings.ts
import type { GlobalConfig } from 'payload'
import { anyone, authenticated } from '@/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: { group: 'Site' },
  access: { read: anyone, update: authenticated },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Brand',
          fields: [
            { name: 'siteName', type: 'text', required: true, defaultValue: 'Hike Globally' },
            { name: 'tagline', type: 'text' },
            { name: 'logo', type: 'upload', relationTo: 'media' },
            { name: 'defaultOgImage', type: 'upload', relationTo: 'media', admin: { description: '1200×630. Used when a page has no SEO image of its own.' } },
          ],
        },
        {
          label: 'Organisation',
          fields: [
            { name: 'legalName', type: 'text', required: true, admin: { description: 'Used in Organization structured data.' } },
            { name: 'email', type: 'email', required: true },
            { name: 'phone', type: 'text' },
            {
              name: 'address', type: 'group',
              fields: [
                { name: 'street', type: 'text' }, { name: 'city', type: 'text', defaultValue: 'Kathmandu' },
                { name: 'region', type: 'text', defaultValue: 'Bagmati' }, { name: 'postalCode', type: 'text' },
                { name: 'country', type: 'text', defaultValue: 'NP' },
              ],
            },
            { name: 'socials', type: 'array', fields: [
              { name: 'platform', type: 'select', options: ['instagram', 'facebook', 'youtube', 'tripadvisor', 'linkedin'].map((v) => ({ label: v, value: v })) },
              { name: 'url', type: 'text', required: true },
            ]},
          ],
        },
        {
          label: 'Defaults',
          fields: [
            { name: 'defaultCurrency', type: 'select', defaultValue: 'USD', options: ['USD', 'EUR', 'GBP', 'AUD'].map((v) => ({ label: v, value: v })) },
            { name: 'enquiryEmail', type: 'email', admin: { description: 'Where booking enquiries are sent.' } },
            { name: 'metaTitleSuffix', type: 'text', defaultValue: ' | Hike Globally' },
            { name: 'metaDescriptionFallback', type: 'textarea', maxLength: 200 },
          ],
        },
      ],
    },
  ],
}
```

`Footer` follows the same shape (columns of links, newsletter copy, legal line, certifications) — I'll generate it on request.

---

## 9. Data layer: Local API vs REST vs GraphQL

### 9.1 The decision

**Use the Local API everywhere on the server. Use REST only for browser-initiated writes.**

| | Local API | REST | GraphQL |
| --- | --- | --- | --- |
| Where it runs | Server only (RSC, route handlers, hooks) | Anywhere | Anywhere |
| Transport | Direct function call | HTTP | HTTP |
| Access control | Enforced (`overrideAccess` defaults to **`true`** here — see warning) | Enforced | Enforced |
| Types | `payload-types.ts`, exact | Needs a generated client | Codegen |
| Over-fetching | Controlled by `select`/`depth` | Same | Query-shaped |
| Use it for | Every page render | Client-side mutations, webhooks | External consumers |

> **The one footgun you must internalise:** in the Local API, `overrideAccess` defaults to **`true`** — access control is *skipped* unless you opt in. That is correct for trusted server code, but it means a careless `payload.find({ collection: 'posts' })` on a public page **will return unpublished drafts**. Always pass `overrideAccess: false` (and a `user` if relevant) when the result is going to an anonymous visitor. Every query helper below does this.

### 9.2 The client

```ts
// src/lib/payload.ts
import 'server-only'
import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

/**
 * getPayload() memoises the initialised instance per process, so this is cheap
 * to call on every render. `import 'server-only'` makes it a build error if a
 * client component ever imports this file.
 */
export const getPayloadClient = async (): Promise<Payload> => getPayload({ config: configPromise })
```

### 9.3 Typed query helpers

```ts
// src/lib/queries/trips.ts
import { cache } from 'react'
import { draftMode } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { getPayloadClient } from '@/lib/payload'
import type { Trip, Departure } from '@/payload-types'

/** React `cache()` dedupes identical calls within ONE request (page + generateMetadata). */
export const getTripBySlug = cache(async (slug: string): Promise<Trip | null> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'trips',
    where: { slug: { equals: slug } },
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,   // only bypass access control when previewing
    depth: 2,                // trip → destination/media → media fields
  })

  return result.docs[0] ?? null
})

/** Upcoming, public departures for one trip. Separate query = separate cache tag. */
export const getTripDepartures = cache(async (tripId: string | number): Promise<Departure[]> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'departures',
    where: {
      and: [
        { trip: { equals: tripId } },
        { isPrivate: { not_equals: true } },
        { status: { not_equals: 'cancelled' } },
        { startDate: { greater_than_equal: new Date().toISOString() } },
      ],
    },
    sort: 'startDate',
    limit: 60,
    depth: 0,
    overrideAccess: false,
  })
  return result.docs
})

export type TripListFilters = {
  destination?: string
  difficulty?: string[]
  seasons?: string[]
  search?: string
  page?: number
  limit?: number
  sort?: 'price' | '-price' | 'durationDays' | '-durationDays' | '-publishedAt'
}

/**
 * The /trips index. Cached by Next with a tag so a trip edit invalidates every
 * filter permutation at once, without listing them.
 */
export const getTrips = async (filters: TripListFilters = {}) => {
  const { destination, difficulty, seasons, search, page = 1, limit = 12, sort = '-publishedAt' } = filters

  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const and: Record<string, unknown>[] = [{ _status: { equals: 'published' } }]
      if (destination) and.push({ 'destination.slug': { equals: destination } })
      if (difficulty?.length) and.push({ difficulty: { in: difficulty } })
      if (seasons?.length) and.push({ seasons: { in: seasons } })
      if (search) and.push({ or: [{ title: { like: search } }, { summary: { like: search } }] })

      return payload.find({
        collection: 'trips',
        where: { and },
        sort,
        page,
        limit,
        depth: 1,
        overrideAccess: false,
        // Fetch ONLY what a card renders. This is the single biggest perf lever
        // on a list page — without it you ship every itinerary day to render a grid.
        select: {
          title: true, slug: true, summary: true, highlight: true, durationDays: true,
          basePrice: true, currency: true, difficulty: true, seasons: true,
          maxAltitudeMetres: true, cardImage: true, destination: true, featured: true,
        },
      })
    },
    ['trips-index', JSON.stringify(filters)],
    { tags: ['trips'], revalidate: 3600 },
  )()
}

export const getAllTripSlugs = async (): Promise<string[]> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'trips',
    where: { _status: { equals: 'published' } },
    limit: 1000,
    pagination: false,
    depth: 0,
    overrideAccess: false,
    select: { slug: true },
  })
  return result.docs.map((d) => d.slug).filter(Boolean) as string[]
}
```

**Three performance rules encoded above, which you should apply to every query you write:**

1. **`select` on list queries.** Default behaviour returns every field, including 20 itinerary days with rich text. On a 12-card grid that is megabytes of JSON for data you never render.
2. **`depth` deliberately.** `depth` controls how many relationship levels Payload resolves. `depth: 0` returns raw IDs; `depth: 2` resolves trip → destination → destination's hero image. Each level is more queries. Detail pages want 2; list pages want 1; lookups want 0.
3. **`defaultPopulate` on the collection** (§8) caps what comes back when a document is pulled in as a relationship — the complement to `select`.

### 9.4 Rendering Lexical rich text

```tsx
// src/components/RichText/index.tsx
import type { DefaultTypedEditorState, SerializedBlockNode, SerializedLinkNode, DefaultNodeTypes } from '@payloadcms/richtext-lexical'
import { JSXConvertersFunction, LinkJSXConverter, RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'
import { CalloutBlockComponent } from '@/blocks/Callout/Component'
import { TripCardBlockComponent } from '@/blocks/TripCard/Component'
import { GalleryBlockComponent } from '@/blocks/Gallery/Component'
import type { CalloutBlock, TripCardBlock, GalleryBlock } from '@/payload-types'

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<CalloutBlock | TripCardBlock | GalleryBlock>

const PREFIX: Record<string, string> = { posts: '/blog', trips: '/trips', destinations: '/destinations', pages: '' }

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }): string => {
  const doc = linkNode.fields.doc
  if (!doc || typeof doc.value !== 'object' || doc.value === null) return '/'
  const slug = 'slug' in doc.value ? String(doc.value.slug) : ''
  return `${PREFIX[doc.relationTo] ?? ''}/${slug}`
}

const converters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  blocks: {
    callout: ({ node }) => <CalloutBlockComponent {...node.fields} />,
    tripCard: ({ node }) => <TripCardBlockComponent {...node.fields} />,
    gallery: ({ node }) => <GalleryBlockComponent {...node.fields} />,
  },
})

export function RichText({ data, className }: { data: DefaultTypedEditorState; className?: string }) {
  return <PayloadRichText converters={converters} data={data} className={className} />
}
```

This replaces `src/lib/articleMarkdown.jsx` entirely. Internal links stay live: if an editor links to a trip and the trip's slug later changes, the href is resolved from the relationship at render time rather than frozen into the text.

---

## 10. Dynamic routing strategy

### 10.1 Route map

| URL | File | Rendering |
| --- | --- | --- |
| `/` | `(frontend)/page.tsx` | Static, ISR — reads the `home` page doc |
| `/trips` | `(frontend)/trips/page.tsx` | Static shell + dynamic `searchParams` for filters |
| `/trips/[slug]` | `(frontend)/trips/[slug]/page.tsx` | Static per slug, ISR |
| `/destinations` | `(frontend)/destinations/page.tsx` | Static, ISR |
| `/destinations/[slug]` | `(frontend)/destinations/[slug]/page.tsx` | Static per slug, ISR |
| `/blog` | `(frontend)/blog/page.tsx` | Static, ISR |
| `/blog/[slug]` | `(frontend)/blog/[slug]/page.tsx` | Static per slug, ISR |
| `/about`, `/contact`, `/privacy`, anything else | `(frontend)/[...slug]/page.tsx` | Static per page doc, ISR |
| `/admin/*` | `(payload)/admin/[[...segments]]` | Dynamic |

The catch-all sits **last** in specificity order, so `/trips/everest-base-camp` resolves to the trip route, not the page route. Next resolves static segments before dynamic ones automatically — you do not need to configure precedence, but you do need to make sure no CMS page is ever given the slug `trips`, `blog`, or `destinations`. Guard it:

```ts
// inside Pages, on the slug field
validate: (value: string | null | undefined) => {
  const reserved = ['trips', 'blog', 'destinations', 'admin', 'api', 'next']
  if (value && reserved.includes(value)) return `"${value}" is a reserved URL segment.`
  return true
}
```

### 10.2 Trip detail page — the full implementation

```tsx
// src/app/(frontend)/trips/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'

import { getTripBySlug, getTripDepartures, getAllTripSlugs } from '@/lib/queries/trips'
import { generateMeta } from '@/lib/seo/generateMeta'
import { tripJsonLd, breadcrumbJsonLd, faqJsonLd } from '@/lib/seo/jsonLd'
import { lexicalToPlainText } from '@/hooks/populateReadingTime'
import { JsonLd } from '@/components/JsonLd'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { TripHero } from '@/components/trip/TripHero'
import { TripItinerary } from '@/components/trip/TripItinerary'
import { TripDepartureCalendar } from '@/components/trip/TripDepartureCalendar'
import { TripInclusions } from '@/components/trip/TripInclusions'
import { TripPriceRail } from '@/components/trip/TripPriceRail'
import { TripFAQ } from '@/components/trip/TripFAQ'

type Params = { params: Promise<{ slug: string }> }

/** Prerender every published trip at build time. */
export async function generateStaticParams() {
  const slugs = await getAllTripSlugs()
  return slugs.map((slug) => ({ slug }))
}

/** A trip published after the last build still renders — on first hit, then cached. */
export const dynamicParams = true

/** Safety net: even with no on-demand revalidation, nothing is older than an hour. */
export const revalidate = 3600

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const trip = await getTripBySlug(slug)      // deduped with the page render
  if (!trip) return {}
  return generateMeta({ doc: trip, pathname: `/trips/${trip.slug}` })
}

export default async function TripPage({ params }: Params) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()

  const trip = await getTripBySlug(slug)
  if (!trip) notFound()

  const departures = await getTripDepartures(trip.id)

  return (
    <>
      <JsonLd data={[
        tripJsonLd(trip, departures),
        breadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Trips', url: '/trips' },
          { name: trip.title, url: `/trips/${trip.slug}` },
        ]),
        ...(trip.faqs?.length
          ? [faqJsonLd(trip.faqs.map((f) => ({ question: f.question, answerPlain: lexicalToPlainText(f.answer) })))]
          : []),
      ]} />

      {isDraft && <LivePreviewListener />}

      <article className="trip-single">
        <TripHero trip={trip} />
        <TripPriceRail trip={trip} departures={departures} />
        <TripItinerary days={trip.itinerary ?? []} />
        <TripDepartureCalendar tripId={String(trip.id)} departures={departures} currency={trip.currency} />
        <TripInclusions includes={trip.includes ?? []} excludes={trip.excludes ?? []} />
        <TripFAQ items={trip.faqs ?? []} />
      </article>
    </>
  )
}
```

Notes that matter:

- **`params` is a Promise in Next 15+/16.** Always `await params`. This is the single most common migration error.
- **`getTripBySlug` is wrapped in React `cache()`**, so calling it in both `generateMetadata` and the component costs one query, not two.
- **`dynamicParams = true`** means a trip created after the build is rendered on first request and then cached — editors don't wait for a deploy.
- **`revalidate = 3600`** is the floor, not the mechanism. On-demand revalidation (§11) is what makes edits appear in seconds; this just guarantees nothing is ever a day stale if a webhook is missed.

### 10.3 Catch-all CMS pages

```tsx
// src/app/(frontend)/[...slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { getPageBySlug, getAllPageSlugs } from '@/lib/queries/pages'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { generateMeta } from '@/lib/seo/generateMeta'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { PayloadRedirects } from '@/components/PayloadRedirects'

type Params = { params: Promise<{ slug?: string[] }> }

export async function generateStaticParams() {
  const slugs = await getAllPageSlugs()
  return slugs.filter((s) => s !== 'home').map((slug) => ({ slug: [slug] }))
}

export const dynamicParams = true
export const revalidate = 3600

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug = [] } = await params
  const page = await getPageBySlug(slug.join('/'))
  return page ? generateMeta({ doc: page, pathname: `/${slug.join('/')}` }) : {}
}

export default async function CatchAllPage({ params }: Params) {
  const { slug = [] } = await params
  const path = slug.join('/')
  const { isEnabled: isDraft } = await draftMode()

  const page = await getPageBySlug(path)

  // Before 404ing, check the redirects collection — a renamed slug should 301,
  // not die. PayloadRedirects looks up /<path> and calls redirect() or notFound().
  if (!page) return <PayloadRedirects url={`/${path}`} />

  return (
    <>
      {isDraft && <LivePreviewListener />}
      <PayloadRedirects disableNotFound url={`/${path}`} />
      <RenderBlocks blocks={page.layout} />
    </>
  )
}
```

### 10.4 Block renderer

```tsx
// src/blocks/RenderBlocks.tsx
import React, { Fragment } from 'react'
import type { Page } from '@/payload-types'

import { HeroBlockComponent } from '@/blocks/Hero/Component'
import { RichTextBlockComponent } from '@/blocks/RichText/Component'
import { TripGridBlockComponent } from '@/blocks/TripGrid/Component'
import { FAQBlockComponent } from '@/blocks/FAQ/Component'
// …one import per block

type LayoutBlock = NonNullable<Page['layout']>[number]

const components: Record<string, React.ComponentType<never>> = {
  hero: HeroBlockComponent,
  richText: RichTextBlockComponent,
  tripGrid: TripGridBlockComponent,
  faq: FAQBlockComponent,
  // …
}

export const RenderBlocks: React.FC<{ blocks: LayoutBlock[] | null | undefined }> = ({ blocks }) => {
  if (!blocks?.length) return null

  return (
    <Fragment>
      {blocks.map((block, index) => {
        const Component = components[block.blockType]
        if (!Component) {
          // Fail loudly in dev, silently in prod — a missing block must never
          // white-screen a live page.
          if (process.env.NODE_ENV === 'development') {
            throw new Error(`No component registered for block "${block.blockType}"`)
          }
          return null
        }
        return <Component key={block.id ?? index} {...(block as never)} />
      })}
    </Fragment>
  )
}
```

Blocks that need their own data (e.g. `tripGrid` in automatic mode) are **async server components** and fetch inside themselves — no prop drilling from the page.

---

## 11. Revalidation: ISR + on-demand

### 11.1 The two mechanisms and when each wins

**ISR (Incremental Static Regeneration)** — `export const revalidate = 3600`. Next serves cached HTML; after an hour, the next visitor triggers a background regeneration. *Pro:* zero wiring, self-healing. *Con:* edits can take up to an hour to appear; a low-traffic page can serve stale content for far longer because regeneration is request-triggered.

**On-demand revalidation** — Payload's `afterChange` hook calls `revalidatePath()` / `revalidateTag()` the instant a document is saved. *Pro:* changes appear in seconds. *Con:* you have to enumerate what a change affects, and a missed path stays stale forever.

**Use both.** On-demand is the mechanism; ISR is the safety net. That is what the code below implements, and it is what every production Payload site I have shipped does.

### 11.2 Revalidation hooks

```ts
// src/hooks/revalidate.ts
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  Payload,
  RequestContext,
} from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { Trip, Post, Page, Destination, Departure } from '@/payload-types'

/**
 * Next 16 takes a second argument.
 *  'max'          → serve stale while revalidating (fast, slightly stale)
 *  { expire: 0 }  → expire immediately, next request blocks (correct, slower)
 * Editorial content uses 'max'. Anything price- or availability-related uses
 * { expire: 0 }, because showing a sold-out date as available costs real money.
 */
const EDITORIAL = 'max' as const
const CRITICAL = { expire: 0 } as const

export const revalidateTrip: CollectionAfterChangeHook<Trip> = ({ doc, previousDoc, req: { payload, context } }) => {
  if (context.disableRevalidate) return doc

  if (doc._status === 'published') {
    revalidatePath(`/trips/${doc.slug}`)
    payload.logger.info(`Revalidated /trips/${doc.slug}`)
  }
  // Slug changed, or unpublished: clear the old URL too.
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) revalidatePath(`/trips/${previousDoc.slug}`)
  if (previousDoc?._status === 'published' && doc._status !== 'published') revalidatePath(`/trips/${previousDoc.slug}`)

  revalidateTag('trips', EDITORIAL)          // index, rails, grids, related modules
  revalidateTag('sitemap', EDITORIAL)
  return doc
}

export const revalidateTripDelete: CollectionAfterDeleteHook<Trip> = ({ doc, req: { context } }) => {
  if (context.disableRevalidate) return doc
  revalidatePath(`/trips/${doc?.slug}`)
  revalidateTag('trips', CRITICAL)
  revalidateTag('sitemap', EDITORIAL)
  return doc
}

/**
 * Availability is money: expire immediately, and only for the affected trip.
 * `doc.trip` may be an ID (depth 0) or a populated object, so look the slug up
 * when it is missing rather than silently skipping revalidation.
 */
const revalidateDepartureDoc = async (
  doc: Departure,
  payload: Payload,
  context: RequestContext,
): Promise<Departure> => {
  if (context.disableRevalidate) return doc

  let tripSlug: string | null = null
  if (doc.trip && typeof doc.trip === 'object' && 'slug' in doc.trip) {
    tripSlug = String(doc.trip.slug)
  } else if (doc.trip) {
    const trip = await payload.findByID({
      collection: 'trips',
      id: doc.trip as string | number,
      depth: 0,
      select: { slug: true },
    })
    tripSlug = trip?.slug ?? null
  }

  if (tripSlug) {
    revalidatePath(`/trips/${tripSlug}`)
    payload.logger.info(`Revalidated departures for /trips/${tripSlug}`)
  }
  revalidateTag('departures', CRITICAL)
  return doc
}

export const revalidateDeparture: CollectionAfterChangeHook<Departure> = ({ doc, req: { payload, context } }) =>
  revalidateDepartureDoc(doc, payload, context)

export const revalidateDepartureDelete: CollectionAfterDeleteHook<Departure> = ({ doc, req: { payload, context } }) =>
  revalidateDepartureDoc(doc, payload, context)

export const revalidatePost: CollectionAfterChangeHook<Post> = ({ doc, previousDoc, req: { context } }) => {
  if (context.disableRevalidate) return doc
  if (doc._status === 'published') revalidatePath(`/blog/${doc.slug}`)
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) revalidatePath(`/blog/${previousDoc.slug}`)
  revalidateTag('posts', EDITORIAL)
  revalidateTag('sitemap', EDITORIAL)
  return doc
}

export const revalidatePostDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { context } }) => {
  if (context.disableRevalidate) return doc
  revalidatePath(`/blog/${doc?.slug}`)
  revalidateTag('posts', CRITICAL)
  return doc
}

export const revalidatePage: CollectionAfterChangeHook<Page> = ({ doc, previousDoc, req: { context } }) => {
  if (context.disableRevalidate) return doc
  const path = doc.slug === 'home' ? '/' : `/${doc.slug}`
  if (doc._status === 'published') revalidatePath(path)
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
    revalidatePath(previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`)
  }
  revalidateTag('pages', EDITORIAL)
  revalidateTag('sitemap', EDITORIAL)
  return doc
}

export const revalidatePageDelete: CollectionAfterDeleteHook<Page> = ({ doc, req: { context } }) => {
  if (context.disableRevalidate) return doc
  revalidatePath(doc?.slug === 'home' ? '/' : `/${doc?.slug}`)
  revalidateTag('pages', CRITICAL)
  return doc
}

export const revalidateDestination: CollectionAfterChangeHook<Destination> = ({ doc, previousDoc, req: { context } }) => {
  if (context.disableRevalidate) return doc
  if (doc._status === 'published') revalidatePath(`/destinations/${doc.slug}`)
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) revalidatePath(`/destinations/${previousDoc.slug}`)
  revalidatePath('/destinations')
  revalidateTag('destinations', EDITORIAL)
  revalidateTag('trips', EDITORIAL)   // trip cards show the destination name
  return doc
}

export const revalidateDestinationDelete: CollectionAfterDeleteHook<Destination> = ({ doc, req: { context } }) => {
  if (context.disableRevalidate) return doc
  revalidatePath(`/destinations/${doc?.slug}`)
  revalidatePath('/destinations')
  revalidateTag('destinations', CRITICAL)
  return doc
}

/** Header/Footer/Settings touch every page — nuke the layout cache. */
export const revalidateGlobal =
  (tag: string): GlobalAfterChangeHook =>
  ({ doc, req: { context } }) => {
    if (context.disableRevalidate) return doc
    revalidateTag(tag, EDITORIAL)
    revalidatePath('/', 'layout')
    return doc
  }

export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req: { context } }) => {
  if (context.disableRevalidate) return doc
  revalidateTag('redirects', CRITICAL)
  return doc
}
```

### 11.3 Three things that will bite you

1. **`context.disableRevalidate`.** Every hook checks it. Without this guard, your seed script's 400 `create` calls each fire `revalidatePath`, which is both pointless and (on Vercel) slow enough to time out the import. Pass `context: { disableRevalidate: true }` in bulk operations:
   ```ts
   await payload.create({ collection: 'trips', data, context: { disableRevalidate: true } })
   ```
2. **Autosave fires `afterChange` constantly.** With `autosave.interval: 375`, an editor typing a paragraph generates dozens of saves. Autosaved *drafts* have `_status: 'draft'`, so the `doc._status === 'published'` guard means no revalidation storm. Keep that guard.
3. **`revalidateTag` without the second argument is deprecated in Next 16** and behaves like `{ expire: 0 }`. It currently still works if you suppress the TS error. Don't — be explicit.

### 11.4 The migration path to Cache Components

When Payload declares `cacheComponents` compatible, the change is mechanical and worth doing:

```ts
// before (today)
export const getTrips = unstable_cache(fn, keys, { tags: ['trips'], revalidate: 3600 })

// after
async function getTrips(filters: TripListFilters) {
  'use cache'
  cacheTag('trips')
  cacheLife('hours')
  // …same body
}
```

Write your query helpers as standalone functions now (as above) and this is a ten-line diff per file.

---

## 12. Media rendering: next/image, focal point, art direction

### 12.1 The CMS image component

```tsx
// src/components/CMSImage/index.tsx
import NextImage from 'next/image'
import type { Media } from '@/payload-types'

type Props = {
  resource: Media | string | number | null | undefined
  sizes: string
  priority?: boolean
  className?: string
  fill?: boolean
  quality?: 60 | 75 | 90
}

/** Payload focalX/focalY are 0–100 percentages; CSS object-position wants the same. */
const focalPosition = (media: Media): string =>
  `${typeof media.focalX === 'number' ? media.focalX : 50}% ${typeof media.focalY === 'number' ? media.focalY : 50}%`

export function CMSImage({ resource, sizes, priority = false, className, fill = true, quality = 75 }: Props) {
  // depth:0 queries return an ID. Render nothing rather than crash.
  if (!resource || typeof resource !== 'object') return null

  const src = resource.url
  if (!src) return null

  return (
    <NextImage
      src={src}
      alt={resource.alt ?? ''}
      {...(fill
        ? { fill: true }
        : { width: resource.width ?? 1600, height: resource.height ?? 900 })}
      sizes={sizes}
      priority={priority}
      quality={quality}
      className={className}
      style={fill ? { objectFit: 'cover', objectPosition: focalPosition(resource) } : undefined}
      placeholder={resource.blurDataURL ? 'blur' : 'empty'}
      blurDataURL={resource.blurDataURL ?? undefined}
    />
  )
}
```

### 12.2 Art direction (two different crops)

`next/image` can serve a different *size*; it cannot serve a different *crop*. Your hero needs a landscape plate on desktop and a portrait one on phones. Use `<picture>`:

```tsx
// src/components/CMSImage/ArtDirected.tsx
import type { Media } from '@/payload-types'

type ArtDirected = { desktop: Media | string | number; mobile?: Media | string | number | null; objectPosition?: string | null }

const isMedia = (v: unknown): v is Media => typeof v === 'object' && v !== null && 'url' in v

export function ArtDirectedImage({ image, priority = false, className }: { image: ArtDirected; priority?: boolean; className?: string }) {
  const desktop = isMedia(image.desktop) ? image.desktop : null
  const mobile = isMedia(image.mobile) ? image.mobile : null
  if (!desktop?.url) return null

  return (
    <picture className={className}>
      {mobile?.url && <source media="(max-width: 767px)" srcSet={mobile.url} />}
      <img
        src={desktop.url}
        alt={desktop.alt ?? ''}
        width={desktop.width ?? 1920}
        height={desktop.height ?? 1080}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        style={{ objectFit: 'cover', objectPosition: image.objectPosition ?? 'center center' }}
      />
    </picture>
  )
}
```

> **Trade-off:** this bypasses Next's optimizer, so it serves whatever Payload stored. That is *fine and often better* here, because Payload already produced a WebP at exactly the right dimensions (§8.1 `imageSizes`) and R2 serves it from the CDN with no per-transformation cost. Use `CMSImage` (optimized) for cards and in-body images where the source size varies; use `ArtDirectedImage` for the handful of hero plates where crop control matters.

### 12.3 `sizes` is not optional

Every `fill` image needs an accurate `sizes` or Next downloads a 1920px file for a 320px card. Match your real layout:

```tsx
<CMSImage resource={trip.cardImage} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
<CMSImage resource={trip.heroImage.desktop} sizes="100vw" priority />
<CMSImage resource={day.gallery?.[0]} sizes="(max-width: 768px) 100vw, 640px" />
```

### 12.4 Blur placeholders

Generate once on upload rather than per request:

```ts
// src/hooks/generateBlurDataURL.ts
import type { CollectionBeforeChangeHook } from 'payload'
import sharp from 'sharp'

export const generateBlurDataURL: CollectionBeforeChangeHook = async ({ data, req }) => {
  const file = req.file
  if (!file?.data || !file.mimetype?.startsWith('image/')) return data
  try {
    const buffer = await sharp(file.data).resize(16, 16, { fit: 'inside' }).webp({ quality: 40 }).toBuffer()
    return { ...data, blurDataUrl: `data:image/webp;base64,${buffer.toString('base64')}` }
  } catch {
    return data
  }
}
```

Add it to `Media.hooks.beforeChange`. On a photography-led site this is the difference between a grey box and a recognisable mountain while the image loads — a measurable LCP/CLS win.

### 12.5 Cost control on Vercel

Vercel bills image optimization per *source image transformed*. A trips index with 12 cards × 4 breakpoints × 2 formats is 96 transformations per unique set. Three mitigations, in order of impact:

1. Serve R2 URLs directly for fixed-size images Payload already resized (as in `ArtDirectedImage`).
2. Keep `images.qualities` to a short list; every distinct quality value is a distinct transformation.
3. Set `images.minimumCacheTTL` high (31 days) — the default re-transforms more often than you want.

---

## 13. SEO, Open Graph, and structured data for travel

### 13.1 Metadata

```ts
// src/lib/seo/generateMeta.ts
import type { Metadata } from 'next'
import type { Media, Page, Post, Trip, Destination } from '@/payload-types'
import { getServerSideURL } from '@/lib/utils/getURL'

type SEOable = Partial<Page | Post | Trip | Destination> & {
  meta?: { title?: string | null; description?: string | null; image?: Media | string | number | null } | null
  title?: string | null
  summary?: string | null
  excerpt?: string | null
}

type ImageRef = Media | string | number | null | undefined

const ogImageURL = (image: ImageRef): string => {
  const base = getServerSideURL()
  if (image && typeof image === 'object' && 'url' in image) {
    // Prefer the hard 1200x630 JPEG derivative; scrapers handle it most reliably.
    const sized = image.sizes?.og?.url ?? image.url
    if (sized) return sized.startsWith('http') ? sized : `${base}${sized}`
  }
  return `${base}/og-default.jpg`
}

export const generateMeta = ({ doc, pathname }: { doc: SEOable | null; pathname: string }): Metadata => {
  const base = getServerSideURL()
  const title = doc?.meta?.title || (doc?.title ? `${doc.title} | Hike Globally` : 'Hike Globally')
  const description =
    doc?.meta?.description || doc?.summary || doc?.excerpt ||
    'Locally led Himalayan journeys — small groups, two leaders, every permit handled.'
  const image = ogImageURL(doc?.meta?.image)
  const url = `${base}${pathname}`

  return {
    title,
    description,
    metadataBase: new URL(base),
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: 'Hike Globally',
      title, description, url,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      locale: 'en_GB',
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  }
}
```

`alternates.canonical` is not decoration. Your `/trips` page will have filter query strings (`?difficulty=moderate&season=autumn`), and without a canonical pointing at the clean URL, Google indexes dozens of near-duplicate filter permutations and splits your authority across all of them. This is the most common SEO failure on trip-listing sites.

### 13.2 Structured data for travel content

```ts
// src/lib/seo/jsonLd.ts
import type { Trip, Departure, Post, Media } from '@/payload-types'
import { getServerSideURL } from '@/lib/utils/getURL'

const abs = (path: string): string => `${getServerSideURL()}${path}`
const imageURL = (m: Media | string | number | null | undefined): string | undefined =>
  m && typeof m === 'object' && 'url' in m && m.url ? (m.url.startsWith('http') ? m.url : abs(m.url)) : undefined

/**
 * TouristTrip is the correct type for a packaged journey. Adding `offers` with
 * real prices and real availability is what produces price-enriched results.
 * Only emit offers you will actually honour.
 */
export const tripJsonLd = (trip: Trip, departures: Departure[]) => {
  const bookable = departures.filter((d) => d.status !== 'sold-out' && d.status !== 'cancelled')

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    '@id': abs(`/trips/${trip.slug}#trip`),
    name: trip.title,
    description: trip.summary,
    url: abs(`/trips/${trip.slug}`),
    image: [imageURL(trip.cardImage)].filter(Boolean),
    touristType: trip.difficulty,
    provider: {
      '@type': 'TravelAgency',
      name: 'Hike Globally',
      url: getServerSideURL(),
      address: { '@type': 'PostalAddress', addressLocality: 'Kathmandu', addressCountry: 'NP' },
    },
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: trip.itinerary?.length ?? 0,
      itemListElement: (trip.itinerary ?? []).map((day, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: { '@type': 'TouristAttraction', name: day.title },
      })),
    },
    offers: bookable.slice(0, 20).map((d) => ({
      '@type': 'Offer',
      price: d.price ?? trip.basePrice,
      priceCurrency: trip.currency,
      availability: d.status === 'limited' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
      url: abs(`/trips/${trip.slug}?departure=${d.id}`),
      availabilityStarts: typeof d.startDate === 'string' ? d.startDate : undefined,
    })),
  }
}

export const breadcrumbJsonLd = (crumbs: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.url) })),
})

export const faqJsonLd = (items: { question: string; answerPlain: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answerPlain },
  })),
})

export const postJsonLd = (post: Post) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.excerpt,
  image: [imageURL(post.heroImage)].filter(Boolean),
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  url: abs(`/blog/${post.slug}`),
  author: (post.authors ?? []).map((a) => ({
    '@type': 'Person',
    name: typeof a === 'object' && a !== null && 'name' in a ? a.name : 'Hike Globally',
  })),
  publisher: { '@type': 'Organization', name: 'Hike Globally', url: getServerSideURL() },
})
```

```tsx
// src/components/JsonLd/index.tsx
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const payload = Array.isArray(data) ? data : [data]
  return (
    <>
      {payload.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Escaping < prevents a </script> inside content from breaking out.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  )
}
```

**FAQ answers must be plain text in JSON-LD**, not Lexical JSON — use `lexicalToPlainText` from §8.7 before passing them in.

### 13.3 Sitemap and robots

```ts
// src/app/(frontend)/sitemap.ts
import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { getServerSideURL } from '@/lib/utils/getURL'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getServerSideURL()
  const payload = await getPayloadClient()

  const fetchAll = async (collection: 'pages' | 'posts' | 'trips' | 'destinations') =>
    (await payload.find({
      collection,
      where: { _status: { equals: 'published' } },
      limit: 2000, pagination: false, depth: 0, overrideAccess: false,
      select: { slug: true, updatedAt: true },
    })).docs

  const [pages, posts, trips, destinations] = await Promise.all([
    fetchAll('pages'), fetchAll('posts'), fetchAll('trips'), fetchAll('destinations'),
  ])

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    ...trips.map((d) => ({ url: `${base}/trips/${d.slug}`, lastModified: new Date(d.updatedAt), changeFrequency: 'weekly' as const, priority: 0.9 })),
    ...destinations.map((d) => ({ url: `${base}/destinations/${d.slug}`, lastModified: new Date(d.updatedAt), changeFrequency: 'monthly' as const, priority: 0.8 })),
    ...posts.map((d) => ({ url: `${base}/blog/${d.slug}`, lastModified: new Date(d.updatedAt), changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...pages.filter((d) => d.slug !== 'home').map((d) => ({ url: `${base}/${d.slug}`, lastModified: new Date(d.updatedAt), changeFrequency: 'monthly' as const, priority: 0.5 })),
  ]
}
```

```ts
// src/app/(frontend)/robots.ts
import type { MetadataRoute } from 'next'
import { getServerSideURL } from '@/lib/utils/getURL'

export default function robots(): MetadataRoute.Robots {
  const base = getServerSideURL()
  const isProduction = process.env.VERCEL_ENV === 'production'
  return {
    rules: isProduction
      ? [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/next'] }]
      : [{ userAgent: '*', disallow: '/' }],   // never index preview deployments
    sitemap: `${base}/sitemap.xml`,
  }
}
```

That `VERCEL_ENV` check has saved more than one client from having their staging site outrank their production site.

---

## 14. Drafts, preview, and live preview

This was your top priority, so here is the whole chain.

### 14.1 The three concepts, separated

| | What it is | Who uses it |
| --- | --- | --- |
| **Drafts / versions** | Payload stores every save as a version; `_status` is `draft` or `published`. The public read access function filters to `published`. | Everyone |
| **Draft preview** | A signed link that puts the *browser* into Next's draft mode, so server components fetch `draft: true` and render unpublished content on the real site. | Editors, clients reviewing before publish |
| **Live preview** | The admin panel renders your site in an iframe beside the editor and refreshes it as you type. | Editors |

### 14.2 Preview path generator and route

```ts
// src/lib/utils/generatePreviewPath.ts
import type { CollectionSlug, PayloadRequest } from 'payload'

const PREFIX: Partial<Record<CollectionSlug, string>> = {
  pages: '',
  posts: '/blog',
  trips: '/trips',
  destinations: '/destinations',
}

export const generatePreviewPath = ({
  collection, slug, req,
}: { collection: CollectionSlug; slug: string; req: PayloadRequest }): string | null => {
  if (!slug) return null
  const prefix = PREFIX[collection] ?? ''
  const path = collection === 'pages' && slug === 'home' ? '/' : `${prefix}/${encodeURIComponent(slug)}`

  const params = new URLSearchParams({ path, previewSecret: process.env.PREVIEW_SECRET || '' })
  // Relative URL: Payload resolves it against the browser origin, so this works
  // unchanged on localhost, Vercel preview deployments, and production.
  return `/next/preview?${params.toString()}`
}
```

```ts
// src/app/(frontend)/next/preview/route.ts
import type { PayloadRequest } from 'payload'
import { getPayload } from 'payload'
import { getSafeRedirect } from 'payload/shared'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import configPromise from '@payload-config'

export async function GET(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  const previewSecret = searchParams.get('previewSecret')

  if (!process.env.PREVIEW_SECRET || previewSecret !== process.env.PREVIEW_SECRET) {
    return new Response('You are not allowed to preview this page', { status: 403 })
  }
  if (!path) return new Response('Missing path', { status: 404 })

  // Blocks open-redirect attacks via ?path=https://evil.com
  const safePath = getSafeRedirect({ fallbackTo: '/', redirectTo: path })
  if (!safePath) return new Response('Relative paths only', { status: 400 })

  const draft = await draftMode()

  // Secret alone is not enough — require a real logged-in Payload user.
  try {
    const { user } = await payload.auth({ req: req as unknown as PayloadRequest, headers: req.headers })
    if (!user) {
      draft.disable()
      return new Response('You are not allowed to preview this page', { status: 403 })
    }
  } catch (error) {
    payload.logger.error({ err: error }, 'Preview auth failed')
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  draft.enable()
  redirect(safePath)
}
```

```ts
// src/app/(frontend)/next/exit-preview/route.ts
import { draftMode } from 'next/headers'

export async function GET(): Promise<Response> {
  ;(await draftMode()).disable()
  return new Response('Draft mode disabled')
}
```

**Both checks are required.** The secret stops random visitors constructing preview URLs; the `payload.auth` check stops the secret leaking (in a Slack message, a shared screenshot, a referrer header) from exposing every unpublished document you own. I have seen an operator's entire unreleased season leak through a preview link pasted into a public Trello card.

### 14.3 Live preview listener

```tsx
// src/components/LivePreviewListener/index.tsx
'use client'
import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'

/**
 * Server-side live preview: the admin posts a message on every change, this
 * calls router.refresh(), and the server re-renders with draft data.
 * Chosen over client-side live preview because our pages are server components
 * and we want the preview to exercise the REAL render path, blocks included.
 */
export const LivePreviewListener: React.FC = () => {
  const router = useRouter()
  return <RefreshRouteOnSave refresh={router.refresh} serverURL={process.env.NEXT_PUBLIC_SERVER_URL || ''} />
}
```

Render it only when `draftMode().isEnabled` (as the page code in §10.2 does) so it never ships to real visitors.

> **Trade-off — server-side vs client-side live preview.** Client-side (`useLivePreview` hook) updates instantly without a server round trip, but requires your page to be a client component receiving data as props — which defeats the server-component architecture and means preview renders a *different* code path from production. Server-side costs ~200–400 ms per keystroke batch, which is why `autosave.interval` is set to `375` rather than Payload's documented `100`: it is the sweet spot where typing feels live but the server is not re-rendering four times a second. Raise it to 800 if your trip pages get heavy.

### 14.4 Scheduled publishing

`versions.drafts.schedulePublish: true` adds a "Publish on…" date to the editor. The scheduled job still needs something to run it. On Vercel:

```jsonc
// vercel.json
{
  "crons": [{ "path": "/api/payload-jobs/run", "schedule": "*/10 * * * *" }]
}
```

The `jobs.access.run` function in `payload.config.ts` (§5.6) authorises this by checking `Authorization: Bearer ${CRON_SECRET}`, which Vercel sets automatically from your `CRON_SECRET` env var. Note Vercel's Hobby plan limits crons to once per day — scheduled publishing needs Pro.

---

## 15. Localization — deferred, but decide these now

You chose English-only. Good — localization roughly doubles editorial workload and adds a routing layer. But travel operators add German, French, and Spanish more often than any other vertical, so here is what to do **now** so that adding a locale later is a configuration change rather than a rewrite.

**Do these three things today (cost: about an hour):**

1. **Keep slugs out of the URL-locale decision.** Plan for `/de/trips/<slug>` (locale prefix, shared slug) rather than `/reisen/<slug>` (translated path). Translated path segments require a route-level mapping table and break every hardcoded link. Prefix routing is a `[locale]` directory and a middleware.
2. **Never concatenate user-visible strings in code.** Your current data does this a lot — `` `${trip.duration} on the trail, topping out at ${trip.elevation}` ``. Each one becomes an untranslatable fragment. Put sentences in fields, or in a single `src/lib/i18n/en.ts` dictionary.
3. **Store facts as data, not prose.** `durationDays: 15` translates for free. `"15 days"` needs a translator. This is already the rule in §8.5, and it pays off twice.

**When you do switch it on**, the change is:

```ts
// payload.config.ts
localization: {
  locales: [
    { label: 'English', code: 'en' },
    { label: 'Deutsch', code: 'de' },
  ],
  defaultLocale: 'en',
  fallback: true,   // show English where German is missing, rather than an empty page
},
```

…then add `localized: true` to the fields that need translating (`title`, `summary`, `overview`, `itinerary`, `includes`, `excludes`, `faqs`, `meta`), move your routes under `src/app/(frontend)/[locale]/`, and pass `locale` to every `payload.find()`. Fields *without* `localized: true` (prices, dates, altitudes, relationships, media) stay shared across locales, which is exactly what you want — one source of truth for the number, many translations of the words.

Two warnings for later: `fallback: true` means a half-translated page looks finished, so give editors a translation-status view; and `unique: true` on a localized slug is enforced **per locale**, so `/de/trips/everest` and `/en/trips/everest` can coexist.

---

## 16. Environment variables and deployment

### 16.1 `.env.example`

```bash
# ─── Core ────────────────────────────────────────────────────────────
# Long random string. Encrypts JWTs and field-level encrypted data.
# Changing it in production invalidates every session AND breaks decryption.
PAYLOAD_SECRET=

# No trailing slash. Used for CORS, canonical URLs, OG images, email links.
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# ─── Database (Neon) ─────────────────────────────────────────────────
# Pooled endpoint (`-pooler` in the hostname) — used by the running app.
DATABASE_URL=postgres://user:password@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require
# Direct endpoint — used by `npm run migrate`, because DDL through PgBouncer
# transaction pooling is unreliable.
DATABASE_URL_UNPOOLED=postgres://user:password@ep-xxx.region.aws.neon.tech/db?sslmode=require

# ─── Media storage (Cloudflare R2 via the S3 API) ────────────────────
S3_BUCKET=hikeglobally-media
S3_REGION=auto
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
# Public CDN domain for the bucket. Must be in next.config images.remotePatterns.
NEXT_PUBLIC_MEDIA_URL=https://media.hikeglobally.com

# ─── Preview & jobs ──────────────────────────────────────────────────
PREVIEW_SECRET=
CRON_SECRET=

# ─── Email ───────────────────────────────────────────────────────────
RESEND_API_KEY=
EMAIL_FROM_ADDRESS=no-reply@hikeglobally.com
ENQUIRY_NOTIFICATION_EMAIL=bookings@hikeglobally.com
```

Generate secrets with `openssl rand -base64 32`. `PAYLOAD_SECRET` and `PREVIEW_SECRET` must be **different** values.

> Anything prefixed `NEXT_PUBLIC_` is inlined into the browser bundle. Never prefix a credential.

### 16.2 Vercel configuration

```jsonc
// vercel.json
{
  "crons": [{ "path": "/api/payload-jobs/run", "schedule": "*/10 * * * *" }],
  "functions": {
    "src/app/(payload)/admin/[[...segments]]/page.tsx": { "maxDuration": 60 },
    "src/app/(payload)/api/[...slug]/route.ts": { "maxDuration": 60 }
  }
}
```

Project settings:

- **Build command:** `pnpm run ci` (`payload migrate && next build`). Migrations must run before the build, because `generateStaticParams` queries the database.
- **Install command:** default (`pnpm install`).
- **Node version:** 22.x.
- **Region:** the same region as your Neon database. A Frankfurt function talking to a US-East database adds ~100 ms to *every* query, and a trip page makes several.
- **Environment variables:** set for Production, Preview, and Development separately. Preview deployments should point at a **separate Neon branch**, never production data — a careless editor clicking Publish in a preview admin otherwise writes to live.

### 16.3 Deployment checklist

- [ ] `PAYLOAD_SECRET` set and unique per environment
- [ ] `push: false` in production (verified by `NODE_ENV`)
- [ ] Migrations committed and reviewed
- [ ] `payload-types.ts` regenerated and committed
- [ ] `pnpm generate:importmap` run after adding any custom admin component
- [ ] First admin user created via `/admin` on first boot, then `create` access tightened to `isAdmin`
- [ ] R2 bucket CORS allows `PUT` + `If-None-Match` from your domain
- [ ] `robots.ts` blocks preview deployments
- [ ] A test enquiry arrives at `ENQUIRY_NOTIFICATION_EMAIL`
- [ ] Live preview loads inside `/admin` (if it does not, check `NEXT_PUBLIC_SERVER_URL` and that the browser is not blocking third-party cookies on a different preview domain)

---

## 17. Content migration and seeding

### 17.1 Approach

One idempotent TypeScript script, run once against each environment, re-runnable without creating duplicates. It uses the Local API directly — no HTTP, no admin clicking.

```ts
// scripts/seed/index.ts
import 'dotenv/config'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../../src/payload.config'

import { destinations as legacyDestinations, trips as legacyTrips, articles as legacyArticles, reviews as legacyReviews } from '../../src/data/content.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const IMAGES_DIR = path.resolve(dirname, '../../public/images')

/** Shared context: suppress revalidation so 400 writes don't hammer the cache API. */
const ctx = { context: { disableRevalidate: true } }

async function upsertMedia(payload: Awaited<ReturnType<typeof getPayload>>, filename: string, alt: string) {
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, depth: 0 })
  if (existing.docs[0]) return existing.docs[0]

  const filePath = path.join(IMAGES_DIR, filename)
  const data = await fs.readFile(filePath)
  return payload.create({
    collection: 'media',
    data: { alt },
    file: { data, name: filename, mimetype: filename.endsWith('.jpg') ? 'image/jpeg' : 'image/webp', size: data.byteLength },
    ...ctx,
  })
}

async function upsert<T extends 'trips' | 'posts' | 'destinations' | 'reviews'>(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: T,
  slug: string,
  data: Record<string, unknown>,
) {
  const found = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  if (found.docs[0]) {
    return payload.update({ collection, id: found.docs[0].id, data: data as never, ...ctx })
  }
  return payload.create({ collection, data: { ...data, slug } as never, ...ctx })
}

async function main() {
  const payload = await getPayload({ config })
  payload.logger.info('Seeding Hike Globally content…')

  // 1. Media first — everything else references it.
  const files = await fs.readdir(IMAGES_DIR)
  const mediaBySource = new Map<string, number | string>()
  for (const file of files.filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f))) {
    const doc = await upsertMedia(payload, file, file.replace(/[-_]/g, ' ').replace(/\.\w+$/, ''))
    mediaBySource.set(`/images/${file}`, doc.id)
  }
  payload.logger.info(`Media: ${mediaBySource.size} assets`)

  // 2. Destinations, 3. Authors, 4. Trips, 5. Departures, 6. Posts, 7. Reviews, 8. Pages, 9. Globals
  // … (full bodies generated on request — each is a straight field mapping)

  payload.logger.info('Seed complete.')
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

Run with `pnpm seed`.

### 17.2 Field mapping reference

| Current (`src/data`) | Payload destination | Transform |
| --- | --- | --- |
| `destinations[].{id,title,kicker,description,image,alt,imagePosition,size}` | `destinations` | `id`→`slug`, `description`→`summary`, `image`→media upload + `cardImage`, `imagePosition`→`heroImage.objectPosition`, `size`→`tileSize` |
| `destinationRegions[]` | `destinations` (merge) | Same 5 records, richer copy — merge by name |
| `destinationStats`, `destinationMarquee`, `craftSteps`, `seasonGuide`, `destinationVoices`, `destinationFaqs` | `pages` doc `destinations` | Become blocks: `stats`, `marquee`, `inclusions`, `seasonMatrix`, `testimonials`, `faq` |
| `trips[]` + `tripDetails.js` | `trips` | `id`→`slug`, `duration`→drop (derive from `durationDays`), `elevation: '5,364 m'`→`maxAltitudeMetres: 5364`, `price`→`basePrice`, `seasons`→lowercase enum, `highlight`→`highlight`, `description`→`summary`, `availability`→derive from departures |
| `treks[]` | `trips` | Merge into the matching trip via `trekSlugById`; set `showInTrekRail`, `railOrder` from `number` |
| `tripPageContent.js` `overrides`/`buildDefault` | `trips` | `stages[]`→`itinerary[]` (`day`→array order, `altitude`→`altitudeMetres`, `trekDuration`→`walkingHours`, `body[]`→Lexical), `highlights`, `overview`, `essentialInfo`, `includes`, `excludes`, `packing`→`packingList`, `faqs`, `map`→`routeMap` |
| `buildDepartures()` | `departures` | **Generate real rows once** for the next 24 months from each trip's `departures` month string, then hand to operations. Stop generating at runtime. |
| `tripAuthors` | `authors` | Direct |
| `articles[]` + the root `.md` file | `posts` | `body[]` (string array) and Markdown → Lexical, `category`→`categories` relationship, `date`→`publishedAt` (ISO), `readTime`→recomputed |
| `reviews[]` | `reviews` | `trip: 'Everest Base Camp · October 2025'` splits into a trip relationship + `travelledOn` date |
| `navigation`, footer copy | `header`, `footer` globals | Direct |
| `signatureItinerary`, `tripInclusions`, `tripsFaqs`, `tripStats`, `tripsMarquee` | `pages` doc `trips` | Blocks |
| `COUNTRIES` | stays in code | A static list, not content |

### 17.3 Markdown → Lexical

```ts
// scripts/seed/markdownToLexical.ts
import { createHeadlessEditor } from '@lexical/headless'
import { $convertFromMarkdownString } from '@lexical/markdown'
import { $getRoot } from 'lexical'
import { editorConfigFactory, getEnabledNodes, type SerializedEditorState } from '@payloadcms/richtext-lexical'
import config from '../../src/payload.config'
import { defaultLexical } from '../../src/fields/defaultLexical'

export async function markdownToLexical(markdown: string): Promise<SerializedEditorState> {
  const editorConfig = await editorConfigFactory.fromField({ field: { type: 'richText', name: 'tmp', editor: defaultLexical }, config: await config })
  const editor = createHeadlessEditor({ nodes: getEnabledNodes({ editorConfig }) })

  editor.update(() => { $convertFromMarkdownString(markdown, editorConfig.features.markdownTransformers, $getRoot()) }, { discrete: true })

  return editor.getEditorState().toJSON() as SerializedEditorState
}
```

Run it once over `Best Summer Treks For Family in Nepal For Beginners.md`, eyeball the result in the admin, then delete the `.md` file and `src/lib/articleMarkdown.jsx`.

### 17.4 Order matters

Media → Categories → Authors → Destinations → Trips → Departures → Reviews → Posts → Pages → Globals. Anything that is referenced must exist first, and `required: true` relationships will reject the write otherwise.

---

## 18. What happens to your test suite

Your eleven `scripts/*.mjs` checks (`check-no-red`, `check-rail-width`, `check-blog-paragraph-gap`, the four `smoke-*` bundles) work by esbuild-bundling a component with its *hardcoded data import* and asserting on jsdom output. Once data comes from Postgres, there is nothing to bundle — they cannot survive the migration.

Replace them with two layers:

**Vitest** for pure functions — `formatSlug`, `lexicalToPlainText`, `populateReadingTime`, price formatting, the departure `beforeChange` derivations. Fast, no database.

**Playwright** for everything the old checks actually cared about — rendered layout and visual rules:

```ts
// tests/e2e/trip-page.spec.ts
import { test, expect } from '@playwright/test'

test('trip page renders itinerary, price rail, and no red anywhere', async ({ page }) => {
  await page.goto('/trips/everest-base-camp')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Everest Base Camp')
  await expect(page.locator('[data-testid="itinerary-day"]')).not.toHaveCount(0)
  await expect(page.locator('[data-testid="price-rail"]')).toBeVisible()

  // Port of check-no-red.mjs: the palette rule, now enforced on the real render.
  const reds = await page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .map((el) => getComputedStyle(el).color)
      .filter((c) => {
        const m = c.match(/rgba?\((\d+), (\d+), (\d+)/)
        if (!m) return false
        const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])]
        return r > 150 && g < 80 && b < 80
      }),
  )
  expect(reds).toHaveLength(0)
})
```

Seed a dedicated test database in CI (`pnpm migrate && pnpm seed`) so Playwright runs against known content.

---

## 19. Travel-website pitfalls and how to avoid them

These are the ones that have actually cost me or a client money. Several already exist in your codebase.

**1. Generating departures at render time.** `buildDepartures(trip, from = new Date())` produces different output on the server and in the browser → React hydration mismatch, and availability that silently changes at midnight. *Fix:* real `departures` rows (§8.6). Never call `new Date()` during render; pass dates in as props resolved on the server.

**2. Prices as floats, or without a currency.** `price: 1490` with the `$` hardcoded in JSX is a landmine the moment you sell in EUR, and float arithmetic on deposits produces `298.00000000000006`. *Fix:* integers plus an explicit `currency` field (§8.5); format with `Intl.NumberFormat` at the edge.

**3. Showing a sold-out departure as bookable.** The worst customer experience in this industry. Caused by caching availability with the same TTL as marketing copy. *Fix:* the split in §11.2 — `'max'` for editorial, `{ expire: 0 }` for departures.

**4. Stale `aggregateRating` and `Offer` structured data.** Emitting an `InStock` offer for a date you cannot sell can get your rich results suppressed, and in some jurisdictions is an advertising violation. *Fix:* build offers from live departures (§13.2) and never emit `aggregateRating` from unverified reviews.

**5. Trip slugs that change.** An editor renames "Annapurna Sanctuary" to "Annapurna Base Camp Trek" for SEO and kills every inbound link and ad. *Fix:* `redirectsPlugin` installed from day one, plus the slug-field warning text in §8.0, plus the old-path `revalidatePath` in the hook.

**6. Duplicate content between "treks" and "trips".** Your current data has Everest Base Camp in both `trips` and `treks`. Two URLs for one product splits ranking and confuses buyers. *Fix:* one `trips` collection, a `showInTrekRail` flag (§8.5).

**7. Hero images that destroy LCP.** A 2 MB full-bleed plate with no `priority`, no `sizes`, and no blur placeholder. On a 3G connection in the market you are actually selling to, that is a 6-second LCP. *Fix:* §12 — `priority` on the hero only, accurate `sizes`, Payload-generated WebP derivatives, blur placeholders.

**8. Itinerary galleries loading eagerly inside closed accordions.** Your trip page has up to 4 photos × 17 days = 68 images, most of them hidden. *Fix:* lazy-load everything that is not the hero; render accordion panel images only when the panel opens.

**9. Timezones on departure dates.** Store `startDate` as a date, display it with a fixed formatter, and never apply the *viewer's* timezone. A trek leaving "15 October" must say 15 October in Melbourne and in Denver. *Fix:* `pickerAppearance: 'dayOnly'`, and format with an explicit `timeZone: 'UTC'` in `Intl.DateTimeFormat`.

**10. Seasonal content going stale.** "New November departure" and "4 places in October" were hardcoded strings in `trips[].availability`. By next November they are lies. *Fix:* derive availability copy from departure data; never let editors type a date into a free-text field that has a real field available.

**11. Permits and restricted-area rules buried in prose.** Upper Mustang's permit cap is a *constraint*, not a paragraph. *Fix:* the `permits` array and `groupSizeMax` on the trip, so you can validate and display them consistently.

**12. The N+1 relationship explosion.** A `/trips` page at `depth: 2` with 12 trips, each resolving a destination, which resolves its hero image, which resolves… *Fix:* `select` + `depth: 1` on lists, `defaultPopulate` on every collection (§9.3).

**13. Draft prices leaking.** An editor drafts next season's 12% price rise; a misconfigured query with `overrideAccess: true` renders it publicly. *Fix:* `overrideAccess: false` everywhere except preview (§9.1), and `publishedOrAuthenticated` read access.

**14. Enquiry spam.** A public `create` endpoint is a spam magnet within days. *Fix:* a honeypot field, a minimum time-to-submit check, Vercel's WAF or an Upstash rate limit in the route handler, and `required` consent. Do not rely on the collection's access control alone.

**15. Media orphans.** Deleting a trip leaves 24 gallery images in R2 forever. *Fix:* a periodic job that lists media with no incoming relationships and flags them for review — delete only after a human looks.

**16. GSAP ScrollTrigger surviving navigation.** Covered in §4 — always `gsap.context().revert()` in cleanup, or live preview's repeated `router.refresh()` will lock the page.

**17. Booking forms that lose data on error.** If the enquiry POST fails, the traveller who just typed a 400-word message loses it. *Fix:* optimistic local state, keep values on failure, and show a mailto fallback.

**18. One giant "Trips" edit screen.** A 60-field flat form makes editors avoid the CMS. *Fix:* tabs, `initCollapsed` arrays, `RowLabel` components, field descriptions in plain language. The schemas in §8 do all four.

**19. `src/pages/` collides with the Next.js Pages Router.** Your Vite app keeps its view components in `src/pages/`. The moment Next.js is installed with `src/` as the base directory, Next reads that folder as the **Pages Router** and turns every file in it into a route — so `src/pages/BlogArticlePage.jsx` starts serving at `/BlogArticlePage`, gets compiled into the production bundle, and drags its Vite-only `import '...md?raw'` into Turbopack, which fails the build with a bare `Unknown module type`. The error names the `.md` file and never mentions routing, so it is genuinely hard to diagnose. *Fix:* rename the directory — `src/views/` — before installing Next. Already done in step 2 of the rollout.

**20. `push: true` can hang your dev server on a silent interactive prompt.** When a field rename produces a column rename, Drizzle cannot tell a rename from a drop-plus-add, so it asks. In a Next.js dev server that prompt is written to a log you are probably not watching, and the request that triggered it simply never returns — the admin hangs with no error. *Fix:* when you rename a field in dev, watch the dev-server output, or stop the server and let the next boot apply it. In CI this never happens because `push` is off and migrations are explicit.

**21. Payload mangles camelCase column names.** `blurDataURL` becomes the Postgres column `blur_data_u_r_l`, because each capital in a run gets its own underscore. `dbName` is not available on scalar fields, so the field name is your only lever. *Fix:* avoid runs of capitals in field names — `blurDataUrl`, `ogImageUrl`, `gpxFileUrl`. Catch it before the first migration; afterwards it is a hand-written `ALTER`.

---

## 20. Delivery roadmap

| Phase | Work | Output | Days |
| --- | --- | --- | --- |
| **0** | Confirm the §1 assumptions; provision Neon + R2 + Resend | Infra ready | 0.5 |
| **1** | Next 16 shell, root layout, CSS and fonts ported, router deleted | Site runs on Next, same look | 1.5 |
| **2** | Component triage, `'use client'` boundaries, GSAP cleanup | All sections render as RSC + client islands | 2 |
| **3** | Payload installed, `(payload)` files, config, DB connected, admin live | `/admin` works, first user created | 1 |
| **4** | Media, Users, Categories, Authors, Destinations, Reviews | Simple collections usable | 1 |
| **5** | Trips + Departures + hooks | The core model, with live preview | 2 |
| **6** | Posts, Pages, the 17 blocks | Full page builder | 2 |
| **7** | Seed script, content migrated, images imported | Real content in the CMS | 1.5 |
| **8** | Routes cut over: blog → trips → destinations → home → catch-all | Frontend reads Payload | 2.5 |
| **9** | Revalidation, SEO, sitemap, JSON-LD, redirects | Production SEO behaviour | 1 |
| **10** | Enquiries end-to-end, email, spam protection | Booking leads captured | 1 |
| **11** | Playwright + Vitest, CI, Vercel production deploy | Shipped | 1.5 |
| | | **Total** | **~17.5 days** |

Phases 4–6 can overlap with 7 if a second person handles content.

---

## Next steps

Tell me which file to generate first and I will write it complete and copy-paste ready, in dependency order. My recommended sequence:

1. `package.json`, `next.config.ts`, `tsconfig.json`, `.env.example`, and the seven `(payload)` files — the scaffold.
2. `src/access/index.ts`, `src/fields/{slug,seo,link,artDirectedImage,defaultLexical}.ts` — the shared primitives everything else imports.
3. `src/collections/Media.ts` + `src/collections/Users.ts` + `src/payload.config.ts` — enough to boot `/admin`.
4. `src/collections/Trips/index.ts` + `src/collections/Departures.ts` + `src/hooks/revalidate.ts` — the core model.
5. `src/lib/payload.ts` + `src/lib/queries/trips.ts` + `src/app/(frontend)/trips/[slug]/page.tsx` — the first live route, end to end.
6. Everything else, in roadmap order.
