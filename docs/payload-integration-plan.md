# Payload 3 + Next.js 15 Integration Plan — Travel Operator Website

**Target setup:** Next.js 15 · App Router · TypeScript · Embedded Payload 3 · Vercel · Postgres (Neon) · Vercel Blob storage

This is a complete, production-ready plan. Every code block is copy-paste ready. Follow the sections in order; the final section gives a suggested build order.

---

## 1. Architecture decision & trade-offs

### Embedded vs. separate service (first-time explanation)

Payload 3 is not a standalone server anymore — it is a **library that installs into your Next.js app**. The admin panel becomes a route group in your `app/` directory, and the CMS logic runs inside the same Node process as your frontend.

| | Embedded (chosen) | Separate service |
|---|---|---|
| Deployments | One (Vercel) | Two apps + CORS + auth tokens |
| Data access | **Local API** — direct function calls to the DB, no HTTP | REST/GraphQL over the network |
| Type safety | Generated types shared automatically | Must sync/publish types |
| Preview & live preview | Trivial (same origin, same `draftMode()`) | Complex (cross-origin cookies) |
| When separate wins | — | Multiple frontends (mobile app + several sites) consuming one CMS |

You have one frontend → embedded is strictly better. Your existing `/api` routes are unaffected: Payload mounts under `/api/[...slug]` inside its own route group, and your custom routes keep working as long as their paths don't collide (if you have a route literally at `app/api/...`, keep it — Payload's catch-all lives in `app/(payload)/api/` and Next.js merges them; only identical concrete paths collide).

### Local API vs. REST/GraphQL (first-time explanation)

The **Local API** (`payload.find(...)`, `payload.create(...)`) is a direct, typed function call into Payload's ORM layer — no HTTP round-trip, no serialization overhead, runs inside your Server Components. REST/GraphQL still exist (Payload auto-exposes them) but in an embedded app you only use them for client-side interactivity (e.g. a "load more trips" button) or external consumers. **Rule: Server Components → Local API. Client Components → REST.**

### ISR vs. on-demand revalidation (first-time explanation)

- **ISR (time-based)**: pages regenerate after N seconds. Simple, but content changes take up to N seconds to appear and you pay regeneration cost even when nothing changed.
- **On-demand revalidation**: Payload hooks call `revalidatePath()` / `revalidateTag()` the moment an editor hits Publish. Changes appear in ~1–2 seconds.

**We use both**: on-demand as the primary mechanism (because Payload runs in the same app, hooks can call `next/cache` functions directly — no webhook needed), plus a long ISR fallback (`revalidate = 86400`) as a safety net for indirect changes.

---

## 2. Installation

```bash
pnpm add payload @payloadcms/next @payloadcms/richtext-lexical \
  @payloadcms/db-vercel-postgres @payloadcms/storage-vercel-blob \
  @payloadcms/plugin-seo @payloadcms/live-preview-react sharp graphql
pnpm add -D tsx
```

(Use the same major version for all `@payloadcms/*` packages and `payload`.)

### 2.1 `next.config.ts`

```ts
import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Vercel Blob public CDN URLs
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
}

export default withPayload(nextConfig)
```

### 2.2 `tsconfig.json` — add the config alias

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@payload-config": ["./src/payload.config.ts"]
    }
  }
}
```

### 2.3 `package.json` scripts

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "payload migrate && next build",
    "payload": "payload",
    "generate:types": "payload generate:types",
    "generate:importmap": "payload generate:importmap",
    "seed": "payload run src/scripts/seed.ts"
  }
}
```

### 2.4 `.env.local`

```bash
POSTGRES_URL=postgres://...            # from Neon / Vercel Postgres
PAYLOAD_SECRET=use-openssl-rand-hex-32 # openssl rand -hex 32
BLOB_READ_WRITE_TOKEN=vercel_blob_...  # from Vercel Blob store
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
PREVIEW_SECRET=another-long-random-string
```

### 2.5 Restructure `app/` into route groups

Move your **entire existing frontend** into a `(frontend)` route group — route groups don't change URLs, they just isolate layouts. Payload gets its own `(payload)` group with its own root layout (it must not inherit your site's `<html>`/fonts/nav).

```
src/
├── app/
│   ├── (frontend)/
│   │   ├── layout.tsx            ← your current root layout moves here
│   │   ├── page.tsx              ← home
│   │   ├── [slug]/page.tsx       ← CMS pages (about, contact, …)
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── trips/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   └── next/
│   │       ├── preview/route.ts
│   │       └── exit-preview/route.ts
│   └── (payload)/
│       ├── layout.tsx
│       ├── custom.scss
│       ├── admin/
│       │   ├── importMap.js        ← generated, commit it
│       │   └── [[...segments]]/
│       │       ├── page.tsx
│       │       └── not-found.tsx
│       └── api/
│           ├── [...slug]/route.ts
│           ├── graphql/route.ts
│           └── graphql-playground/route.ts
├── collections/
├── blocks/
├── fields/
├── hooks/
├── lib/
├── scripts/
├── payload.config.ts
└── payload-types.ts                ← generated, commit it
```

> **Important:** there must be exactly one root layout per group. Your old `app/layout.tsx` moves to `app/(frontend)/layout.tsx` unchanged.

### 2.6 The `(payload)` route group files

`src/app/(payload)/layout.tsx`:

```tsx
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'
import { importMap } from './admin/importMap.js'
import './custom.scss'

type Args = { children: React.ReactNode }

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
```

`src/app/(payload)/admin/[[...segments]]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import config from '@payload-config'
import { generatePageMetadata, RootPage } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, params, searchParams, importMap })

export default Page
```

`src/app/(payload)/admin/[[...segments]]/not-found.tsx`:

```tsx
import type { Metadata } from 'next'
import config from '@payload-config'
import { generatePageMetadata, NotFoundPage } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const NotFound = ({ params, searchParams }: Args) =>
  NotFoundPage({ config, params, searchParams, importMap })

export default NotFound
```

`src/app/(payload)/api/[...slug]/route.ts`:

```ts
import config from '@payload-config'
import {
  REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_POST, REST_PUT,
} from '@payloadcms/next/routes'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
```

`src/app/(payload)/api/graphql/route.ts`:

```ts
import config from '@payload-config'
import { GRAPHQL_POST, REST_OPTIONS } from '@payloadcms/next/routes'

export const POST = GRAPHQL_POST(config)
export const OPTIONS = REST_OPTIONS(config)
```

`src/app/(payload)/api/graphql-playground/route.ts`:

```ts
import config from '@payload-config'
import { GRAPHQL_PLAYGROUND_GET } from '@payloadcms/next/routes'

export const GET = GRAPHQL_PLAYGROUND_GET(config)
```

`src/app/(payload)/custom.scss` — can be empty; it exists for admin theme overrides.

After the config exists (next section), generate the import map and types:

```bash
pnpm generate:importmap
pnpm generate:types
```

> **Concepts:** the **import map** tells Payload's server-rendered admin where any custom React components live (generated file, commit it). **Generated types** (`payload-types.ts`) are TypeScript interfaces derived from your collection schemas — your entire frontend imports `Trip`, `Post`, `Page`, `Media` from this one file. Regenerate after every schema change.

---

## 3. `src/payload.config.ts`

```ts
import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import sharp from 'sharp'

import { Users } from '@/collections/Users'
import { Media } from '@/collections/Media'
import { Categories } from '@/collections/Categories'
import { Destinations } from '@/collections/Destinations'
import { Posts } from '@/collections/Posts'
import { Trips } from '@/collections/Trips'
import { Pages } from '@/collections/Pages'
import { Testimonials } from '@/collections/Testimonials'
import { Header } from '@/globals/Header'
import { Footer } from '@/globals/Footer'
import { generatePreviewPath } from '@/lib/generatePreviewPath'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,
  secret: process.env.PAYLOAD_SECRET || '',
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    livePreview: {
      url: ({ data, collectionConfig }) =>
        generatePreviewPath({
          slug: typeof data?.slug === 'string' ? data.slug : '',
          collection: (collectionConfig?.slug ?? 'pages') as 'pages' | 'posts' | 'trips',
        }),
      collections: ['pages', 'posts', 'trips'],
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  editor: lexicalEditor(),
  collections: [Users, Media, Categories, Destinations, Posts, Trips, Pages, Testimonials],
  globals: [Header, Footer],
  db: vercelPostgresAdapter({
    pool: { connectionString: process.env.POSTGRES_URL || '' },
  }),
  plugins: [
    vercelBlobStorage({
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
    seoPlugin({
      collections: ['pages', 'posts', 'trips'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => (doc?.title ? `${doc.title} | Himalaya Travel` : 'Himalaya Travel'),
      generateURL: ({ doc, collectionSlug }) => {
        const base = process.env.NEXT_PUBLIC_SERVER_URL || ''
        const prefix = collectionSlug === 'posts' ? '/blog' : collectionSlug === 'trips' ? '/trips' : ''
        return `${base}${prefix}/${doc?.slug ?? ''}`
      },
    }),
  ],
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
```

> **Concepts:** `buildConfig` is Payload's single source of truth — collections, DB adapter, plugins, admin UI all live here. **`sharp`** powers server-side image resizing. The **SEO plugin** injects a `meta` group (title, description, image + preview snippet UI) into the listed collections as an "SEO" tab. (Swap `vercelPostgresAdapter` for `postgresAdapter` from `@payloadcms/db-postgres` if you ever leave Vercel — schemas are identical.)

---

## 4. Shared utilities (fields, access, hooks)

### 4.1 `src/fields/slug.ts`

```ts
import type { Field, FieldHook } from 'payload'

export const formatSlug = (val: string): string =>
  val
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')

const formatSlugHook =
  (fallbackField: string): FieldHook =>
  ({ data, operation, value }) => {
    if (typeof value === 'string' && value.length > 0) return formatSlug(value)
    if (operation === 'create' || !data?.slug) {
      const fallback = data?.[fallbackField]
      if (typeof fallback === 'string' && fallback.length > 0) return formatSlug(fallback)
    }
    return value
  }

export const slugField = (fallbackField = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  required: true,
  admin: {
    position: 'sidebar',
    description: 'URL identifier. Auto-generated from the title; edit with care after publishing.',
  },
  hooks: { beforeValidate: [formatSlugHook(fallbackField)] },
})
```

### 4.2 `src/lib/access.ts`

```ts
import type { Access, AccessArgs } from 'payload'
import type { User } from '@/payload-types'

export const authenticated = ({ req: { user } }: AccessArgs<User>): boolean => Boolean(user)

export const anyone: Access = () => true

export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
```

> **Concept:** Access control functions run on every operation. `authenticatedOrPublished` is the key one for a public site: logged-in editors see everything; anonymous visitors only see docs whose draft status (`_status`) is `published`. This is what prevents drafts leaking onto the live site.

### 4.3 Revalidation hooks — `src/hooks/revalidate.ts`

Because Payload runs inside Next.js, an `afterChange` hook can call `revalidatePath` directly — no webhooks, no HTTP, no secrets. This is the embedded architecture's superpower.

```ts
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

type RevalidateArgs = {
  pathPrefix: string // '' for pages, '/blog' for posts, '/trips' for trips
  tag: string        // collection-level cache tag, e.g. 'trips'
}

export const buildRevalidateHook =
  ({ pathPrefix, tag }: RevalidateArgs): CollectionAfterChangeHook =>
  ({ doc, previousDoc, req: { payload, context } }) => {
    if (context.disableRevalidate) return doc

    if (doc._status === 'published') {
      const path = `${pathPrefix}/${doc.slug}`
      payload.logger.info(`Revalidating ${path}`)
      revalidatePath(path)
      revalidateTag(tag)
      revalidateTag('sitemap')
    }
    // If a doc was unpublished or its slug changed, purge the old path too
    if (previousDoc?._status === 'published') {
      if (doc._status !== 'published' || previousDoc.slug !== doc.slug) {
        revalidatePath(`${pathPrefix}/${previousDoc.slug}`)
        revalidateTag(tag)
        revalidateTag('sitemap')
      }
    }
    return doc
  }

export const buildRevalidateDeleteHook =
  ({ pathPrefix, tag }: RevalidateArgs): CollectionAfterDeleteHook =>
  ({ doc, req: { context } }) => {
    if (context.disableRevalidate) return doc
    revalidatePath(`${pathPrefix}/${doc?.slug}`)
    revalidateTag(tag)
    revalidateTag('sitemap')
    return doc
  }

export const revalidateGlobal =
  (tag: string): GlobalAfterChangeHook =>
  ({ doc, req: { context } }) => {
    if (context.disableRevalidate) return doc
    revalidateTag(tag)
    return doc
  }
```

> `context.disableRevalidate` lets the seed script create hundreds of docs without triggering hundreds of revalidations.

### 4.4 `src/lib/generatePreviewPath.ts`

```ts
const collectionPrefixMap = {
  pages: '',
  posts: '/blog',
  trips: '/trips',
} as const

type Args = { collection: keyof typeof collectionPrefixMap; slug: string }

export const generatePreviewPath = ({ collection, slug }: Args): string => {
  const params = new URLSearchParams({
    slug,
    collection,
    path: `${collectionPrefixMap[collection]}/${slug}`,
    previewSecret: process.env.PREVIEW_SECRET || '',
  })
  return `/next/preview?${params.toString()}`
}
```

---

## 5. Collections

### 5.1 `src/collections/Users.ts`

```ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email', group: 'Admin' },
  access: {
    admin: authenticated,
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
    },
  ],
}
```

### 5.2 `src/collections/Media.ts`

```ts
import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/lib/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
    focalPoint: true, // editors mark the subject; crops keep it in frame
    imageSizes: [
      { name: 'thumbnail', width: 480, height: 320, position: 'centre' },
      { name: 'card', width: 768, height: 512, position: 'centre' },
      { name: 'tablet', width: 1024 },
      { name: 'hero', width: 1920 },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    formatOptions: { format: 'webp', options: { quality: 82 } },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe the image for accessibility and SEO.' },
    },
    { name: 'caption', type: 'text' },
    { name: 'credit', type: 'text', admin: { description: 'Photographer / source attribution.' } },
  ],
}
```

> **Concept:** an **upload collection** stores file metadata in Postgres and the binary in Vercel Blob (via the storage plugin). Each `imageSizes` entry is generated by sharp at upload time, so the frontend never serves a 6 MB DSLR original. `focalPoint` matters enormously for travel: a mountain summit or a face stays centered when a 3:2 photo is cropped to a 1:1 card.

### 5.3 `src/collections/Categories.ts`

```ts
import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/lib/access'
import { slugField } from '@/fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { useAsTitle: 'title', group: 'Content' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [{ name: 'title', type: 'text', required: true }, slugField()],
}
```

### 5.4 `src/collections/Destinations.ts`

A dedicated Destinations collection (rather than a free-text field on Trips) gives you destination landing pages (`/destinations/everest-region`), consistent filtering, and a single place to update hero imagery.

```ts
import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/lib/access'
import { slugField } from '@/fields/slug'

export const Destinations: CollectionConfig = {
  slug: 'destinations',
  admin: { useAsTitle: 'title', group: 'Travel' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField(),
    { name: 'country', type: 'text', required: true, defaultValue: 'Nepal' },
    { name: 'region', type: 'text', admin: { description: 'e.g. Everest Region, Annapurna' } },
    { name: 'summary', type: 'textarea', maxLength: 300 },
    { name: 'description', type: 'richText' },
    { name: 'heroImage', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'coordinates',
      type: 'group',
      fields: [
        { name: 'lat', type: 'number', min: -90, max: 90 },
        { name: 'lng', type: 'number', min: -180, max: 180 },
      ],
    },
  ],
}
```

### 5.5 `src/collections/Posts.ts` (Blog)

```ts
import type { CollectionConfig } from 'payload'
import { anyone, authenticated, authenticatedOrPublished } from '@/lib/access'
import { slugField } from '@/fields/slug'
import { buildRevalidateHook, buildRevalidateDeleteHook } from '@/hooks/revalidate'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'categories', '_status', 'publishedAt'],
  },
  access: {
    read: authenticatedOrPublished,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    drafts: { autosave: { interval: 300 }, schedulePublish: true },
    maxPerDoc: 50,
  },
  hooks: {
    afterChange: [buildRevalidateHook({ pathPrefix: '/blog', tag: 'posts' })],
    afterDelete: [buildRevalidateDeleteHook({ pathPrefix: '/blog', tag: 'posts' })],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField(),
    { name: 'heroImage', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'excerpt',
      type: 'textarea',
      maxLength: 300,
      admin: { description: 'Shown on listing cards and used as meta-description fallback.' },
    },
    { name: 'content', type: 'richText', required: true },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'relatedTrips',
      type: 'relationship',
      relationTo: 'trips',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Trips to cross-sell at the end of this article.',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) return new Date()
            return value
          },
        ],
      },
    },
  ],
}
```

> **Concepts:** `versions.drafts` enables the Draft/Publish workflow — every save creates a version, `_status` tracks publish state, `schedulePublish` lets editors queue a post for a future date, and `autosave` powers live preview (the panel saves a draft every 300 ms while editing so the preview iframe can refresh). `richText` stores Lexical editor state as JSON — you render it with Payload's `<RichText />` React component, never `dangerouslySetInnerHTML`.

### 5.6 `src/collections/Trips.ts` — the heart of the site

```ts
import type { CollectionConfig } from 'payload'
import { anyone, authenticated, authenticatedOrPublished } from '@/lib/access'
import { slugField } from '@/fields/slug'
import { buildRevalidateHook, buildRevalidateDeleteHook } from '@/hooks/revalidate'

export const Trips: CollectionConfig = {
  slug: 'trips',
  admin: {
    useAsTitle: 'title',
    group: 'Travel',
    defaultColumns: ['title', 'destination', 'durationDays', 'basePrice', '_status'],
  },
  access: {
    read: authenticatedOrPublished,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    drafts: { autosave: { interval: 300 }, schedulePublish: true },
    maxPerDoc: 50,
  },
  hooks: {
    afterChange: [buildRevalidateHook({ pathPrefix: '/trips', tag: 'trips' })],
    afterDelete: [buildRevalidateDeleteHook({ pathPrefix: '/trips', tag: 'trips' })],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'summary', type: 'textarea', required: true, maxLength: 300 },
            { name: 'heroImage', type: 'upload', relationTo: 'media', required: true },
            { name: 'description', type: 'richText', required: true },
            {
              type: 'row',
              fields: [
                { name: 'durationDays', type: 'number', required: true, min: 1 },
                { name: 'durationNights', type: 'number', min: 0 },
                {
                  name: 'difficulty',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Easy', value: 'easy' },
                    { label: 'Moderate', value: 'moderate' },
                    { label: 'Challenging', value: 'challenging' },
                    { label: 'Strenuous', value: 'strenuous' },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'maxGroupSize', type: 'number', min: 1 },
                { name: 'minAge', type: 'number', min: 0 },
                { name: 'maxAltitude', type: 'number', admin: { description: 'Metres' } },
              ],
            },
            {
              name: 'highlights',
              type: 'array',
              labels: { singular: 'Highlight', plural: 'Highlights' },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
          ],
        },
        {
          label: 'Itinerary',
          fields: [
            {
              name: 'itinerary',
              type: 'array',
              labels: { singular: 'Day', plural: 'Days' },
              admin: {
                components: {
                  RowLabel: undefined, // keep default "Day 01/02…" numbering from array index
                },
              },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'richText', required: true },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'meals',
                      type: 'select',
                      hasMany: true,
                      options: [
                        { label: 'Breakfast', value: 'breakfast' },
                        { label: 'Lunch', value: 'lunch' },
                        { label: 'Dinner', value: 'dinner' },
                      ],
                    },
                    { name: 'accommodation', type: 'text' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'altitude', type: 'number', admin: { description: 'Metres' } },
                    { name: 'walkingHours', type: 'text', admin: { description: 'e.g. 5–6 hrs' } },
                    { name: 'distanceKm', type: 'number' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Pricing & Departures',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'basePrice', type: 'number', required: true, min: 0 },
                {
                  name: 'currency',
                  type: 'select',
                  required: true,
                  defaultValue: 'USD',
                  options: ['USD', 'EUR', 'GBP', 'AUD', 'NPR'],
                },
                { name: 'priceSuffix', type: 'text', defaultValue: 'per person' },
              ],
            },
            {
              name: 'groupPricing',
              type: 'array',
              admin: { description: 'Optional tiered pricing by group size.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'minPax', type: 'number', required: true, min: 1 },
                    { name: 'maxPax', type: 'number', required: true, min: 1 },
                    { name: 'pricePerPerson', type: 'number', required: true, min: 0 },
                  ],
                },
              ],
            },
            {
              name: 'departures',
              type: 'array',
              labels: { singular: 'Departure', plural: 'Departures' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'startDate', type: 'date', required: true },
                    { name: 'endDate', type: 'date', required: true },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'price', type: 'number', admin: { description: 'Overrides base price if set.' } },
                    { name: 'seatsTotal', type: 'number', min: 1 },
                    { name: 'seatsBooked', type: 'number', min: 0, defaultValue: 0 },
                    {
                      name: 'status',
                      type: 'select',
                      defaultValue: 'available',
                      options: [
                        { label: 'Available', value: 'available' },
                        { label: 'Guaranteed', value: 'guaranteed' },
                        { label: 'Limited', value: 'limited' },
                        { label: 'Sold out', value: 'soldOut' },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'inclusions',
              type: 'array',
              fields: [{ name: 'text', type: 'text', required: true }],
            },
            {
              name: 'exclusions',
              type: 'array',
              fields: [{ name: 'text', type: 'text', required: true }],
            },
          ],
        },
        {
          label: 'Gallery & FAQ',
          fields: [
            {
              name: 'gallery',
              type: 'array',
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'caption', type: 'text' },
              ],
            },
            {
              name: 'faqs',
              type: 'array',
              labels: { singular: 'FAQ', plural: 'FAQs' },
              fields: [
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'richText', required: true },
              ],
            },
          ],
        },
      ],
    },
    // Sidebar fields (outside tabs)
    slugField(),
    {
      name: 'destination',
      type: 'relationship',
      relationTo: 'destinations',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show in featured sections on the homepage.' },
    },
  ],
}
```

> **Why an `array` for itinerary days instead of `blocks`?** Blocks shine when editors mix *different* component types. An itinerary is a homogeneous ordered list of days — an array is simpler for editors, renders predictably, and day numbers come free from array order (so reordering days never breaks numbering).

### 5.7 `src/collections/Pages.ts` + blocks

`src/blocks/index.ts`:

```ts
import type { Block } from 'payload'

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
  ],
}

export const ContentBlock: Block = {
  slug: 'content',
  fields: [
    { name: 'content', type: 'richText', required: true },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'narrow',
      options: [
        { label: 'Narrow (prose)', value: 'narrow' },
        { label: 'Full width', value: 'full' },
      ],
    },
  ],
}

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  labels: { singular: 'Media', plural: 'Media blocks' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
  ],
}

export const FeaturedTripsBlock: Block = {
  slug: 'featuredTrips',
  labels: { singular: 'Featured trips', plural: 'Featured trips' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Popular trips' },
    {
      name: 'trips',
      type: 'relationship',
      relationTo: 'trips',
      hasMany: true,
      maxRows: 6,
      required: true,
    },
  ],
}

export const TestimonialsBlock: Block = {
  slug: 'testimonialsBlock',
  labels: { singular: 'Testimonials', plural: 'Testimonials' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'What travellers say' },
    {
      name: 'testimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      maxRows: 9,
    },
  ],
}

export const CtaBlock: Block = {
  slug: 'cta',
  labels: { singular: 'Call to action', plural: 'CTAs' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    { name: 'buttonLabel', type: 'text', required: true },
    { name: 'buttonHref', type: 'text', required: true },
  ],
}

export const FaqBlock: Block = {
  slug: 'faqBlock',
  labels: { singular: 'FAQ section', plural: 'FAQ sections' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Frequently asked questions' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'richText', required: true },
      ],
    },
  ],
}
```

`src/collections/Pages.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { authenticated, authenticatedOrPublished } from '@/lib/access'
import { slugField } from '@/fields/slug'
import { buildRevalidateHook, buildRevalidateDeleteHook } from '@/hooks/revalidate'
import {
  HeroBlock, ContentBlock, MediaBlock, FeaturedTripsBlock,
  TestimonialsBlock, CtaBlock, FaqBlock,
} from '@/blocks'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title', group: 'Content', defaultColumns: ['title', 'slug', '_status'] },
  access: {
    read: authenticatedOrPublished,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    drafts: { autosave: { interval: 300 }, schedulePublish: true },
    maxPerDoc: 50,
  },
  hooks: {
    afterChange: [buildRevalidateHook({ pathPrefix: '', tag: 'pages' })],
    afterDelete: [buildRevalidateDeleteHook({ pathPrefix: '', tag: 'pages' })],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField(),
    {
      name: 'layout',
      type: 'blocks',
      required: true,
      blocks: [HeroBlock, ContentBlock, MediaBlock, FeaturedTripsBlock, TestimonialsBlock, CtaBlock, FaqBlock],
    },
  ],
}
```

> **Concept:** a **blocks field** is Payload's page-builder primitive: editors compose a page from an ordered list of typed sections, and the frontend maps each block's `blockType` to a React component. This is how "About", "Contact", landing pages, and even the homepage (slug `home`) stay fully editable without developer involvement.

### 5.8 `src/collections/Testimonials.ts`

```ts
import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/lib/access'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: { useAsTitle: 'authorName', group: 'Content' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    { name: 'authorName', type: 'text', required: true },
    { name: 'authorLocation', type: 'text', admin: { description: 'e.g. Sydney, Australia' } },
    { name: 'rating', type: 'number', min: 1, max: 5, defaultValue: 5 },
    { name: 'trip', type: 'relationship', relationTo: 'trips' },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
  ],
}
```

### 5.9 Globals: `src/globals/Header.ts` & `src/globals/Footer.ts`

> **Concept:** a **global** is a single-document schema — perfect for the nav, footer, and site-wide settings.

```ts
// src/globals/Header.ts
import type { GlobalConfig } from 'payload'
import { anyone, authenticated } from '@/lib/access'
import { revalidateGlobal } from '@/hooks/revalidate'

export const Header: GlobalConfig = {
  slug: 'header',
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [revalidateGlobal('global-header')] },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      maxRows: 8,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
  ],
}
```

```ts
// src/globals/Footer.ts
import type { GlobalConfig } from 'payload'
import { anyone, authenticated } from '@/lib/access'
import { revalidateGlobal } from '@/hooks/revalidate'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [revalidateGlobal('global-footer')] },
  fields: [
    { name: 'aboutText', type: 'textarea' },
    {
      name: 'columns',
      type: 'array',
      maxRows: 4,
      fields: [
        { name: 'heading', type: 'text', required: true },
        {
          name: 'links',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'social',
      type: 'group',
      fields: [
        { name: 'facebook', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'youtube', type: 'text' },
        { name: 'tripadvisor', type: 'text' },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'phone', type: 'text' },
        { name: 'whatsapp', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'address', type: 'textarea' },
      ],
    },
  ],
}
```

---

## 6. Frontend data fetching — `src/lib/queries.ts`

All Server Components use the Local API. `getPayload({ config })` is memoized by Payload (one instance per process), and React's `cache()` dedupes identical queries within one render pass (e.g. `generateMetadata` + the page both calling `getTripBySlug`).

```ts
import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import type { Header, Footer, Page, Post, Trip } from '@/payload-types'

export const getPayloadClient = () => getPayload({ config })

// ---------- Single docs by slug (draft-aware, deduped per request) ----------

export const getPageBySlug = cache(async (slug: string): Promise<Page | null> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    draft,
    overrideAccess: draft, // drafts bypass access only inside preview mode
    limit: 1,
    pagination: false,
    where: { slug: { equals: slug } },
  })
  return result.docs[0] ?? null
})

export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'posts',
    draft,
    overrideAccess: draft,
    limit: 1,
    pagination: false,
    depth: 2, // resolve heroImage, categories, relatedTrips (and their media)
    where: { slug: { equals: slug } },
  })
  return result.docs[0] ?? null
})

export const getTripBySlug = cache(async (slug: string): Promise<Trip | null> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'trips',
    draft,
    overrideAccess: draft,
    limit: 1,
    pagination: false,
    depth: 2,
    where: { slug: { equals: slug } },
  })
  return result.docs[0] ?? null
})

// ---------- Lists (tagged + cached across requests) ----------

export const getPublishedTrips = unstable_cache(
  async (): Promise<Trip[]> => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'trips',
      where: { _status: { equals: 'published' } },
      sort: '-createdAt',
      depth: 1,
      limit: 100,
      pagination: false,
    })
    return result.docs
  },
  ['trips-list'],
  { tags: ['trips'] },
)

export const getPublishedPosts = unstable_cache(
  async (): Promise<Post[]> => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 1,
      limit: 100,
      pagination: false,
    })
    return result.docs
  },
  ['posts-list'],
  { tags: ['posts'] },
)

// ---------- Globals ----------

export const getHeader = unstable_cache(
  async (): Promise<Header> => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'header' })
  },
  ['global-header'],
  { tags: ['global-header'] },
)

export const getFooter = unstable_cache(
  async (): Promise<Footer> => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'footer' })
  },
  ['global-footer'],
  { tags: ['global-footer'] },
)
```

> **Concepts:** `depth` controls how many relationship levels Payload resolves (`depth: 2` turns `heroImage: 3` into the full Media doc). Keep it ≤ 2 — deep population is the #1 query-performance mistake. `overrideAccess: draft` means: in normal rendering, access control applies (drafts invisible); in preview mode, drafts are readable. The `unstable_cache` tags line up with the `revalidateTag()` calls in the hooks — publish a trip and every tagged list purges instantly.

---

## 7. Dynamic routes

### 7.1 `/trips/[slug]` — `src/app/(frontend)/trips/[slug]/page.tsx`

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { getPayloadClient, getTripBySlug } from '@/lib/queries'
import { generateMeta } from '@/lib/generateMeta'
import { tripJsonLd } from '@/lib/structuredData'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { TripDetail } from '@/components/trips/TripDetail'

type Args = { params: Promise<{ slug: string }> }

export const revalidate = 86400 // safety-net ISR; on-demand revalidation is primary
export const dynamicParams = true

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const trips = await payload.find({
    collection: 'trips',
    where: { _status: { equals: 'published' } },
    select: { slug: true },
    limit: 1000,
    pagination: false,
  })
  return trips.docs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const trip = await getTripBySlug(slug)
  return generateMeta({ doc: trip, pathPrefix: '/trips' })
}

export default async function TripPage({ params }: Args) {
  const { slug } = await params
  const { isEnabled: draft } = await draftMode()
  const trip = await getTripBySlug(slug)

  if (!trip) notFound()

  return (
    <>
      {draft && <LivePreviewListener />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tripJsonLd(trip)) }}
      />
      <TripDetail trip={trip} />
    </>
  )
}
```

### 7.2 `/blog/[slug]` — `src/app/(frontend)/blog/[slug]/page.tsx`

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayloadClient, getPostBySlug } from '@/lib/queries'
import { generateMeta } from '@/lib/generateMeta'
import { postJsonLd } from '@/lib/structuredData'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { PostHero } from '@/components/blog/PostHero'
import { RelatedTrips } from '@/components/trips/RelatedTrips'
import type { Trip } from '@/payload-types'

type Args = { params: Promise<{ slug: string }> }

export const revalidate = 86400
export const dynamicParams = true

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const posts = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    select: { slug: true },
    limit: 1000,
    pagination: false,
  })
  return posts.docs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  return generateMeta({ doc: post, pathPrefix: '/blog' })
}

export default async function PostPage({ params }: Args) {
  const { slug } = await params
  const { isEnabled: draft } = await draftMode()
  const post = await getPostBySlug(slug)

  if (!post) notFound()

  const relatedTrips = (post.relatedTrips ?? []).filter(
    (t): t is Trip => typeof t === 'object' && t !== null,
  )

  return (
    <article>
      {draft && <LivePreviewListener />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd(post)) }}
      />
      <PostHero post={post} />
      <div className="prose mx-auto">
        <RichText data={post.content} />
      </div>
      {relatedTrips.length > 0 && <RelatedTrips trips={relatedTrips} />}
    </article>
  )
}
```

### 7.3 CMS pages — `src/app/(frontend)/[slug]/page.tsx`

The homepage uses the same machinery with slug `home` (`app/(frontend)/page.tsx` simply calls `getPageBySlug('home')` and renders `<RenderBlocks />`).

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { getPayloadClient, getPageBySlug } from '@/lib/queries'
import { generateMeta } from '@/lib/generateMeta'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { RenderBlocks } from '@/components/RenderBlocks'

type Args = { params: Promise<{ slug: string }> }

export const revalidate = 86400
export const dynamicParams = true

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const pages = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
    select: { slug: true },
    limit: 1000,
    pagination: false,
  })
  return pages.docs
    .filter(({ slug }) => slug !== 'home') // home is served by app/(frontend)/page.tsx
    .map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  return generateMeta({ doc: page, pathPrefix: '' })
}

export default async function CmsPage({ params }: Args) {
  const { slug } = await params
  const { isEnabled: draft } = await draftMode()
  const page = await getPageBySlug(slug)

  if (!page) notFound()

  return (
    <>
      {draft && <LivePreviewListener />}
      <RenderBlocks blocks={page.layout} />
    </>
  )
}
```

`src/components/RenderBlocks.tsx`:

```tsx
import React, { Fragment } from 'react'
import type { Page } from '@/payload-types'
import { Hero } from '@/components/blocks/Hero'
import { Content } from '@/components/blocks/Content'
import { MediaSection } from '@/components/blocks/MediaSection'
import { FeaturedTrips } from '@/components/blocks/FeaturedTrips'
import { Testimonials } from '@/components/blocks/Testimonials'
import { Cta } from '@/components/blocks/Cta'
import { Faq } from '@/components/blocks/Faq'

type LayoutBlock = Page['layout'][number]

const blockComponents: {
  [K in LayoutBlock['blockType']]: React.ComponentType<Extract<LayoutBlock, { blockType: K }>>
} = {
  hero: Hero,
  content: Content,
  mediaBlock: MediaSection,
  featuredTrips: FeaturedTrips,
  testimonialsBlock: Testimonials,
  cta: Cta,
  faqBlock: Faq,
}

export const RenderBlocks: React.FC<{ blocks: Page['layout'] }> = ({ blocks }) => (
  <Fragment>
    {blocks.map((block, i) => {
      const BlockComponent = blockComponents[block.blockType] as React.ComponentType<LayoutBlock>
      return <BlockComponent key={block.id ?? i} {...block} />
    })}
  </Fragment>
)
```

> **Routing note:** because `[slug]` is a top-level dynamic segment, make sure page slugs can never collide with real routes (`blog`, `trips`, `admin`, `api`, `next`). Add a `beforeValidate` guard if editors manage slugs freely, or keep a reserved-slug validation on the field:
>
> ```ts
> validate: (val: string | null | undefined) =>
>   ['blog', 'trips', 'admin', 'api', 'next'].includes(val ?? '')
>     ? 'This slug is reserved.' : true,
> ```

---

## 8. Draft preview & live preview

> **Concepts:** **Draft preview** = an editor clicks "Preview" and sees the draft on the real site via Next.js `draftMode()` (a cookie makes your queries pass `draft: true`). **Live preview** = the admin panel embeds the site in an iframe and refreshes it on every autosave, giving editors a real-time WYSIWYG view. Both are already wired in the config above (`admin.livePreview` + `generatePreviewPath`); these are the two route handlers and one component that complete the loop.

`src/app/(frontend)/next/preview/route.ts`:

```ts
import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(req: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  const previewSecret = searchParams.get('previewSecret')

  if (previewSecret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid preview secret', { status: 403 })
  }
  if (!path || !path.startsWith('/')) {
    return new Response('Invalid path', { status: 400 })
  }

  // Only authenticated Payload users may enter preview mode
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return new Response('You must be logged in to preview', { status: 403 })
  }

  const draft = await draftMode()
  draft.enable()
  redirect(path)
}
```

`src/app/(frontend)/next/exit-preview/route.ts`:

```ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(req: Request): Promise<Response> {
  const draft = await draftMode()
  draft.disable()
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path') ?? '/'
  redirect(path.startsWith('/') ? path : '/')
}
```

`src/components/LivePreviewListener.tsx`:

```tsx
'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import React from 'react'

export const LivePreviewListener: React.FC = () => {
  const router = useRouter()
  return (
    <RefreshRouteOnSave
      refresh={router.refresh}
      serverURL={process.env.NEXT_PUBLIC_SERVER_URL ?? ''}
    />
  )
}
```

Optionally add a per-document "Preview" button target by setting `admin.preview` on Pages/Posts/Trips to the same `generatePreviewPath` output.

---

## 9. SEO, Open Graph & structured data

### 9.1 `src/lib/generateMeta.ts`

```ts
import type { Metadata } from 'next'
import type { Media, Page, Post, Trip } from '@/payload-types'

type SeoDoc = Page | Post | Trip

const getImageURL = (image?: Media | number | null): string | undefined => {
  if (image && typeof image === 'object') {
    return image.sizes?.og?.url ?? image.url ?? undefined
  }
  return undefined
}

export const generateMeta = ({
  doc,
  pathPrefix,
}: {
  doc: SeoDoc | null
  pathPrefix: string
}): Metadata => {
  if (!doc) return {}

  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const url = `${serverURL}${pathPrefix}/${doc.slug}`
  const title = doc.meta?.title || doc.title
  const description =
    doc.meta?.description ||
    ('excerpt' in doc && doc.excerpt) ||
    ('summary' in doc && doc.summary) ||
    undefined
  const ogImage =
    getImageURL(doc.meta?.image as Media | null) ||
    getImageURL(('heroImage' in doc ? doc.heroImage : undefined) as Media | null)

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Himalaya Travel',
      type: 'website',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}
```

### 9.2 `src/lib/structuredData.ts` — travel-specific JSON-LD

```ts
import type { Post, Trip, Media, Destination } from '@/payload-types'

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL ?? ''

const mediaURL = (m?: Media | number | null): string | undefined =>
  m && typeof m === 'object' ? (m.url ?? undefined) : undefined

export const tripJsonLd = (trip: Trip): Record<string, unknown> => {
  const destination = trip.destination as Destination | number

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: trip.title,
    description: trip.summary,
    url: `${serverURL}/trips/${trip.slug}`,
    image: mediaURL(trip.heroImage),
    touristType: trip.difficulty,
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: trip.itinerary?.length ?? 0,
      itemListElement: (trip.itinerary ?? []).map((day, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `Day ${i + 1}: ${day.title}`,
      })),
    },
    ...(typeof destination === 'object' && {
      touristDestination: {
        '@type': 'TouristDestination',
        name: destination.title,
        address: { '@type': 'PostalAddress', addressCountry: destination.country },
      },
    }),
    offers: {
      '@type': 'Offer',
      price: trip.basePrice,
      priceCurrency: trip.currency,
      availability: 'https://schema.org/InStock',
      url: `${serverURL}/trips/${trip.slug}`,
    },
  }
}

export const postJsonLd = (post: Post): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.excerpt ?? undefined,
  image: mediaURL(post.heroImage),
  datePublished: post.publishedAt ?? post.createdAt,
  dateModified: post.updatedAt,
  url: `${serverURL}/blog/${post.slug}`,
  author:
    post.author && typeof post.author === 'object'
      ? { '@type': 'Person', name: post.author.name }
      : undefined,
})
```

### 9.3 Sitemap — `src/app/sitemap.ts`

```ts
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL ?? ''

  const [pages, posts, trips] = await Promise.all([
    payload.find({ collection: 'pages', where: { _status: { equals: 'published' } }, select: { slug: true, updatedAt: true }, limit: 1000, pagination: false }),
    payload.find({ collection: 'posts', where: { _status: { equals: 'published' } }, select: { slug: true, updatedAt: true }, limit: 1000, pagination: false }),
    payload.find({ collection: 'trips', where: { _status: { equals: 'published' } }, select: { slug: true, updatedAt: true }, limit: 1000, pagination: false }),
  ])

  return [
    { url: serverURL, lastModified: new Date() },
    ...pages.docs.map((d) => ({ url: `${serverURL}/${d.slug === 'home' ? '' : d.slug}`, lastModified: new Date(d.updatedAt) })),
    ...posts.docs.map((d) => ({ url: `${serverURL}/blog/${d.slug}`, lastModified: new Date(d.updatedAt) })),
    ...trips.docs.map((d) => ({ url: `${serverURL}/trips/${d.slug}`, lastModified: new Date(d.updatedAt) })),
  ]
}
```

---

## 10. Media handling best practices

1. **Always render through `next/image`** with the pre-generated Payload size closest to the layout slot — never the original:

```tsx
import Image from 'next/image'
import type { Media } from '@/payload-types'

type Props = { media: Media | number; sizeName?: keyof NonNullable<Media['sizes']>; className?: string; priority?: boolean; sizes?: string }

export const PayloadImage: React.FC<Props> = ({ media, sizeName = 'card', className, priority, sizes }) => {
  if (typeof media !== 'object' || !media?.url) return null
  const size = media.sizes?.[sizeName]
  const src = size?.url ?? media.url
  const width = size?.width ?? media.width ?? 1200
  const height = size?.height ?? media.height ?? 800

  return (
    <Image
      src={src}
      alt={media.alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
    />
  )
}
```

2. **Vercel Blob = origin, Vercel Image Optimization = CDN layer.** `next/image` fetches from Blob, optimizes (AVIF/WebP, device-sized), and caches at the edge. The `remotePatterns` entry in `next.config.ts` authorizes this.
3. **`formatOptions: webp` at upload time** keeps even the stored renditions small — travel photos from guides' phones are routinely 8–12 MB.
4. **`priority` only on the hero image** (LCP); everything below the fold lazy-loads by default.
5. Require `alt` (done in the schema) — travel sites live and die by Google Images traffic.

---

## 11. Localization (when you need it)

You don't have i18n today, so ship without it — but Payload makes retrofitting cheap **if the schema is ready**. Field-level localization is enabled per field, and Payload stores one value per locale:

```ts
// payload.config.ts
localization: {
  locales: [
    { label: 'English', code: 'en' },
    { label: 'Deutsch', code: 'de' },
  ],
  defaultLocale: 'en',
  fallback: true,
},
```

Then mark content fields `localized: true` (`title`, `summary`, `description`, `content`, itinerary text — **not** slugs/prices/dates unless you want per-locale URLs), query with `payload.find({ locale: 'de', fallbackLocale: 'en', ... })`, and pair with `next-intl` + an `app/(frontend)/[locale]/` segment for routed locales. Decision to make *now*: nothing — just know that enabling localization later migrates existing values into the default locale automatically.

---

## 12. Database & deployment (Vercel + Neon)

### Setup

1. In Vercel: **Storage → Create → Neon Postgres** (sets `POSTGRES_URL` automatically) and **Create → Blob store** (sets `BLOB_READ_WRITE_TOKEN`).
2. Add `PAYLOAD_SECRET`, `PREVIEW_SECRET`, `NEXT_PUBLIC_SERVER_URL` (your production domain) to Vercel env vars.
3. Pull envs locally: `vercel env pull .env.local`.

### Migrations (important — read once)

> **Concept:** in development, the Postgres adapter runs in **push mode** — it syncs schema changes to the dev DB automatically. In **production you must use migrations**: generated SQL files that run before build. Never let push mode touch prod.

Workflow for every schema change:

```bash
# after editing collections locally (dev DB already pushed automatically):
pnpm payload migrate:create   # generates src/migrations/xxxx.ts — commit it
git push                      # Vercel build runs: payload migrate && next build
```

The `build` script we defined (`payload migrate && next build`) applies pending migrations against the production DB during deploy. Use a **separate Neon branch/database for local dev** so push mode never conflicts with prod migration state.

### First deploy checklist

- `pnpm generate:importmap && pnpm generate:types` committed
- Initial migration created against an empty schema: `pnpm payload migrate:create initial`
- Visit `/admin` on the deployed site → create the first admin user
- Run the seed script (next section) locally against prod envs, or temporarily via a protected route

---

## 13. Migrating your mock data — `src/scripts/seed.ts`

Run with `pnpm seed` (`payload run` boots the config, envs, and DB connection for you). Adapt the `mockTrips` import to your actual mock-data module — the pattern stays the same: upload media first, then create docs referencing the media IDs, with `context.disableRevalidate` so hooks stay quiet.

```ts
import { getPayload } from 'payload'
import config from '@payload-config'
import path from 'path'
import { fileURLToPath } from 'url'

// Your existing mock data — adjust the import path to wherever it lives today
import { mockTrips, mockPosts, mockPages } from '@/data/mock'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const seed = async (): Promise<void> => {
  const payload = await getPayload({ config })
  const context = { disableRevalidate: true }

  payload.logger.info('Seeding destinations…')
  const destinationCache = new Map<string, number>()

  for (const trip of mockTrips) {
    if (!destinationCache.has(trip.destination)) {
      // 1. Upload the hero image from your existing /public folder
      const media = await payload.create({
        collection: 'media',
        filePath: path.resolve(dirname, `../../public${trip.heroImagePath}`),
        data: { alt: trip.heroImageAlt ?? trip.title },
        context,
      })

      const destination = await payload.create({
        collection: 'destinations',
        data: {
          title: trip.destination,
          slug: trip.destination.toLowerCase().replace(/\s+/g, '-'),
          country: 'Nepal',
          heroImage: media.id,
        },
        context,
      })
      destinationCache.set(trip.destination, destination.id)
    }
  }

  payload.logger.info('Seeding trips…')
  for (const trip of mockTrips) {
    const hero = await payload.create({
      collection: 'media',
      filePath: path.resolve(dirname, `../../public${trip.heroImagePath}`),
      data: { alt: trip.heroImageAlt ?? trip.title },
      context,
    })

    await payload.create({
      collection: 'trips',
      draft: false,
      data: {
        _status: 'published',
        title: trip.title,
        slug: trip.slug,
        summary: trip.summary,
        heroImage: hero.id,
        description: trip.descriptionLexical, // see note below on rich text
        destination: destinationCache.get(trip.destination)!,
        durationDays: trip.days,
        difficulty: trip.difficulty,
        basePrice: trip.price,
        currency: 'USD',
        itinerary: trip.itinerary.map((d) => ({
          title: d.title,
          description: d.descriptionLexical,
        })),
        highlights: trip.highlights.map((text) => ({ text })),
      },
      context,
    })
  }

  payload.logger.info(`Seed complete: ${mockTrips.length} trips, ${mockPosts.length} posts.`)
  process.exit(0)
}

void seed()
```

> **Rich text note:** Lexical content is JSON, not HTML/Markdown. If your mock descriptions are plain strings, convert them with a tiny helper:

```ts
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

export const textToLexical = (text: string): SerializedEditorState =>
  ({
    root: {
      type: 'root', format: '', indent: 0, version: 1, direction: 'ltr',
      children: text.split('\n\n').map((paragraph) => ({
        type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
        children: [{ type: 'text', text: paragraph, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
      })),
    },
  }) as unknown as SerializedEditorState
```

If your mock data is HTML or Markdown, use `@payloadcms/richtext-lexical`'s HTML/Markdown converters instead — tell me the format and I'll give you the exact converter code.

---

## 14. Common pitfalls on travel sites (and the built-in fixes)

| Pitfall | Why it bites travel sites | Fix (already in this plan) |
|---|---|---|
| Giant images killing LCP | Guides upload 10 MB photos from treks | `imageSizes` + WebP at upload, `next/image`, `priority` only on hero |
| Drafts leaking to production | Operators prep next-season trips months early | `authenticatedOrPublished` access + `draft: false` default in queries |
| Stale prices after an update | Price changes are legally sensitive | On-demand revalidation in `afterChange` — live in ~1 s, plus list-tag purges |
| Departure dates & timezones | A "15 Mar" departure renders as 14 Mar for US visitors | Payload stores ISO dates; render with a fixed TZ: `Intl.DateTimeFormat('en', { timeZone: 'Asia/Kathmandu', dateStyle: 'medium' })` — never `new Date().toLocaleDateString()` bare |
| Deep `depth` population | Trip → destination → heroImage → … balloons queries | `depth ≤ 2` everywhere; use `select` for lists |
| Slug collisions with real routes | Editor creates a page called "Trips" | Reserved-slug validation on `slugField` |
| Reordering itinerary days breaks numbering | Ops teams reshuffle itineraries constantly | Day numbers derive from array index, never stored |
| Seat counts drifting from reality | CMS is not a booking engine | Keep `seatsBooked` editorial/informational; real inventory belongs in a booking system when you add one — then sync it into Payload via a scheduled job, don't hand-edit |
| "Load more" lists hammering the DB | Trip listing pages with filters | Client-side filtering hits Payload REST (`/api/trips?where=...&limit=12&page=2`) which is already paginated |
| Prod schema drift | Push mode against production | Migrations-only in prod; separate dev DB branch |
| Related-content staleness | Homepage shows a trip you just unpublished | `revalidateTag('trips')` purges every tagged list, not just the detail page |

---

## 15. Suggested build order (incremental)

1. **Scaffold**: route groups, `(payload)` files, `payload.config.ts` with only `Users` + `Media` → `/admin` works locally
2. **Media + Destinations + Trips** → seed trips → build `/trips` + `/trips/[slug]`
3. **Posts + Categories** → `/blog` + `/blog/[slug]`
4. **Pages + blocks + globals** → homepage and `[slug]` pages from CMS, nav/footer from globals
5. **Preview + live preview** routes and listener
6. **SEO plugin fields, JSON-LD, sitemap**
7. **Migrations + first Vercel deploy**
8. Delete the mock-data files 🎉
