import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfig, type PayloadRequest } from 'payload'
import sharp from 'sharp'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { searchPlugin } from '@payloadcms/plugin-search'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { s3Storage } from '@payloadcms/storage-s3'
import type { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'

import { defaultLexical } from '@/fields/defaultLexical'
import { revalidateRedirects } from '@/hooks/revalidate'
import { documentHref } from '@/lib/utils/documentHref'
import { getServerSideURL } from '@/lib/utils/getURL'

import { Authors } from '@/collections/Authors'
import { Categories } from '@/collections/Categories'
import { Departures } from '@/collections/Departures'
import { Destinations } from '@/collections/Destinations'
import { Enquiries } from '@/collections/Enquiries'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Posts } from '@/collections/Posts'
import { Reviews } from '@/collections/Reviews'
import { Trips } from '@/collections/Trips'
import { Users } from '@/collections/Users'

import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { SiteSettings } from '@/globals/SiteSettings'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * `payload migrate` puts the subcommand in argv[2]. Migrations issue DDL,
 * which is unreliable through PgBouncer's transaction pooling, so they get
 * Neon's direct (unpooled) endpoint while the running app uses the pooled one.
 * This single line prevents the most common Neon + Payload deployment failure.
 */
const isMigrating = process.argv[2]?.startsWith('migrate') ?? false

/**
 * Anything with a title and a slug. Replaced with the real union
 * (`Page | Post | Trip | Destination`) from `@/payload-types` once those
 * collections land in step 6 — a structural type is used here so the file
 * stays honest about what actually exists today rather than importing
 * types that are not generated yet.
 */
type SEOable = { title?: string | null; slug?: string | null }

const generateTitle: GenerateTitle<SEOable> = ({ doc }) =>
  doc?.title ? `${doc.title} | Hike Globally` : 'Hike Globally'

const generateURL: GenerateURL<SEOable> = ({ doc, collectionSlug }) => {
  const base = getServerSideURL()
  if (!doc?.slug || !collectionSlug) return base
  return `${base}${documentHref(collectionSlug, doc.slug)}`
}

export default buildConfig({
  serverURL: getServerSideURL(),

  admin: {
    user: Users.slug,
    // Payload compiles a map of every custom React component referenced in the
    // config so the admin bundle can import them. `npm run generate:importmap`
    // regenerates `src/app/(payload)/admin/importMap.js` — rerun it whenever
    // you add a custom field component or RowLabel.
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
      connectionString: isMigrating
        ? process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || ''
        : process.env.DATABASE_URL || '',
      // Neon's pooler already fronts the database. A large client-side pool on
      // top of it just multiplies idle connections across serverless instances.
      max: process.env.VERCEL ? 1 : 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    },
    // Dev convenience: auto-sync the schema on boot. MUST be false in
    // production — see §6 of the plan for why this is a data-loss footgun.
    push: process.env.NODE_ENV === 'development',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),

  /**
   * Order here drives the admin sidebar within each `admin.group`, so it is
   * roughly "what an editor opens most often" rather than alphabetical.
   *
   * Registration order does NOT matter for relationships — Payload resolves
   * every `relationTo` against the finished config, so Trips may point at
   * Destinations regardless of which is listed first. What matters is that
   * each referenced slug is present SOMEWHERE in this array; a missing one
   * throws `InvalidFieldRelationship` at boot, which is what broke the admin
   * during step 3.
   *
   * The redirects and search plugins register their own collections
   * (`redirects`, `search`) on top of these eleven.
   */
  collections: [
    // Catalogue
    Trips,
    Destinations,
    Departures,
    // Journal
    Posts,
    Categories,
    // Site
    Pages,
    // People and operations
    Authors,
    Reviews,
    Enquiries,
    // Library and settings
    Media,
    Users,
  ],

  globals: [Header, Footer, SiteSettings],

  cors: [getServerSideURL()].filter(Boolean),
  csrf: [getServerSideURL()].filter(Boolean),

  // No key locally → Payload falls back to its built-in dev transport and logs
  // the message instead of silently dropping it.
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@hikeglobally.com',
        defaultFromName: 'Hike Globally',
        apiKey: process.env.RESEND_API_KEY,
      })
    : undefined,

  plugins: [
    // Passed without a `collections` list on purpose: the SEO fields are
    // composed by hand in `src/fields/seo.ts` so we control tab placement.
    // The plugin is still needed to supply the "generate" buttons' behaviour.
    seoPlugin({ generateTitle, generateURL }),

    /**
     * Redirects. Pitfall 5: the first time an editor renames a published
     * slug, every inbound link and every ranking for the old URL dies. This
     * has to be installed BEFORE that happens, not after someone notices.
     *
     * `overrides` adds the revalidation hook so a new redirect takes effect
     * on the next request rather than up to an hour later.
     */
    redirectsPlugin({
      collections: ['pages', 'posts', 'trips', 'destinations'],
      overrides: {
        admin: { group: 'Site' },
        hooks: { afterChange: [revalidateRedirects] },
      },
    }),

    /**
     * Search. Maintains a flattened `search` collection via hooks, so queries
     * hit one small indexed table instead of fanning out across four
     * collections with a `like` on rich text.
     *
     * `beforeSync` is where the priority ordering lives: trips are the
     * commercial pages, so they outrank journal posts for the same term.
     */
    searchPlugin({
      collections: ['trips', 'posts', 'destinations', 'pages'],
      defaultPriorities: { trips: 10, destinations: 8, pages: 5, posts: 3 },
      searchOverrides: {
        admin: { group: 'Site' },
        fields: ({ defaultFields }) => [
          ...defaultFields,
          { name: 'excerpt', type: 'textarea', admin: { readOnly: true } },
          { name: 'slug', type: 'text', index: true, admin: { readOnly: true } },
        ],
      },
      beforeSync: ({ originalDoc, searchDoc }) => ({
        ...searchDoc,
        excerpt: originalDoc.summary ?? originalDoc.excerpt ?? '',
        slug: originalDoc.slug ?? '',
      }),
    }),

    s3Storage({
      // Not configured locally → files go to /media on disk, which is
      // gitignored. No branching needed anywhere else in the codebase.
      enabled: Boolean(process.env.S3_BUCKET),
      collections: { media: true },
      bucket: process.env.S3_BUCKET || '',
      // Vercel caps a serverless request body at 4.5 MB and your hero plates
      // are bigger. `clientUploads` has the browser PUT straight to R2 with a
      // presigned URL, bypassing the function entirely.
      clientUploads: true,
      config: {
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT, // R2: https://<account>.r2.cloudflarestorage.com
        forcePathStyle: true, // required for R2 and MinIO
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],

  /**
   * Scheduled publishing needs a worker. On Vercel that is a cron hitting
   * /api/payload-jobs/run with a bearer token — see §14.4 and the vercel.json
   * in §16. Without the access guard below that endpoint is public.
   */
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
