import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfig, type PayloadRequest } from 'payload'
import sharp from 'sharp'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { s3Storage } from '@payloadcms/storage-s3'
import type { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'

import { defaultLexical } from '@/fields/defaultLexical'
import { documentHref } from '@/lib/utils/documentHref'
import { getServerSideURL } from '@/lib/utils/getURL'

import { Media } from '@/collections/Media'
import { Users } from '@/collections/Users'

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
   * Collections are added as each step of the integration lands, so the admin
   * always boots. Remaining, in order:
   *   step 4 — Trips, Departures
   *   step 6 — Pages, Posts, Destinations, Reviews, Enquiries, Categories,
   *            Authors, plus the Header / Footer / SiteSettings globals and
   *            the redirects + search plugins.
   */
  collections: [Media, Users],

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
