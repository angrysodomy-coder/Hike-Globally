import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import sharp from 'sharp'

import { Users } from '@/collections/Users'
import { Media } from '@/collections/Media'
import { Categories } from '@/collections/Categories'
import { Destinations } from '@/collections/Destinations'
import { Posts } from '@/collections/Posts'
import { Trips } from '@/collections/Trips'
import { Pages } from '@/collections/Pages'
import { Testimonials } from '@/collections/Testimonials'
import { Inquiries } from '@/collections/Inquiries'
import { Header } from '@/globals/Header'
import { Footer } from '@/globals/Footer'
import { migrations } from '@/migrations/index'
import { revalidateRedirects, revalidateRedirectsDelete } from '@/hooks/revalidateRedirects'
import { explainRejectedOrigin } from '@/hooks/explainRejectedOrigin'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  csrf: [],
  cors: '*',
  secret: process.env.PAYLOAD_SECRET || 'build-fallback-secret-for-static-prerender',
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    // Brand the CMS: the public site's ridgeline mark on the login screen and
    // in the nav, plus Hike Globally titles/favicon on every admin tab.
    components: {
      graphics: {
        Logo: '@/components/admin/Logo#AdminLogo',
        Icon: '@/components/admin/Icon#AdminIcon',
      },
      views: {
        // Custom /admin home — live KPIs, inquiry chart, pipeline and
        // departures, rendered as a server component (see CustomDashboard.tsx).
        dashboard: {
          Component: '@/components/admin/CustomDashboard#CustomDashboard',
        },
      },
    },
    meta: {
      titleSuffix: '— Hike Globally',
      description: 'Content management for Hike Globally — premium Himalayan journeys.',
      icons: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          url: '/favicon.svg',
        },
      ],
      openGraph: {
        title: 'Hike Globally CMS',
        description: 'Content management for Hike Globally — premium Himalayan journeys.',
      },
    },
  },
  editor: lexicalEditor(),
  collections: [
    Users,
    Media,
    Categories,
    Destinations,
    Posts,
    Trips,
    Pages,
    Testimonials,
    Inquiries,
  ],
  globals: [Header, Footer],
  // Logs an actionable reason whenever a 403 is really a rejected-origin
  // problem rather than a genuine permissions problem.
  hooks: { afterError: [explainRejectedOrigin] },
  // Email: enabled only when SMTP env vars are set; without them Payload logs
  // emails to the console (fine for local dev). Used by the Inquiries
  // notification hook and Payload's own password-reset emails.
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || 'noreply@example.com',
        defaultFromName: 'Hike Globally',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
      })
    : undefined,
  // node-postgres adapter: works identically against Neon/Vercel Postgres in
  // production AND any local or self-hosted Postgres in development.
  db: postgresAdapter({
    pool: { connectionString: process.env.POSTGRES_URL || '' },
    prodMigrations: migrations,
  }),
  plugins: [
    vercelBlobStorage({
      // Disabled automatically when no token is set (pure-local dev → files in /media)
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
    redirectsPlugin({
      collections: ['pages', 'posts', 'trips'],
      overrides: {
        admin: { group: 'Admin' },
        hooks: {
          afterChange: [revalidateRedirects],
          afterDelete: [revalidateRedirectsDelete],
        },
      },
    }),
    seoPlugin({
      collections: ['pages', 'posts', 'trips'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) =>
        doc?.title ? `${doc.title} | Hike Globally` : 'Hike Globally',
      generateURL: ({ doc, collectionSlug }) => {
        const base = process.env.NEXT_PUBLIC_SERVER_URL || ''
        const prefix =
          collectionSlug === 'posts' ? '/blog' : collectionSlug === 'trips' ? '/trips' : ''
        const slug = doc?.slug === 'home' ? '' : `/${doc?.slug ?? ''}`
        return collectionSlug === 'pages' ? `${base}${slug}` : `${base}${prefix}/${doc?.slug ?? ''}`
      },
    }),
  ],
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
