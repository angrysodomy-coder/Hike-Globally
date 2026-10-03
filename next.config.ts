import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Vercel Blob public CDN URLs (production media)
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: '*.blob.vercel-storage.com' },
      // Local dev without a Blob token: Payload serves media from the app itself
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      // Arena / e2b sandbox preview hosts
      { protocol: 'https', hostname: '*.e2b.app' },
    ],
  },
  /* `src/components/SummerFamilyTreksBlog.jsx` imports the premium guide's
     markdown source with Vite's `?raw` suffix. Teach webpack the same trick so
     the article keeps rendering from its single source of truth. */
  webpack: (config) => {
    config.module.rules.push({ resourceQuery: /raw/, type: 'asset/source' })
    return config
  },
  // The sandbox preview is proxied under https://{port}-{sandbox}.e2b.app, so
  // server actions must accept that origin in addition to localhost.
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.e2b.app'],
    },
  },
}

export default withPayload(nextConfig)
