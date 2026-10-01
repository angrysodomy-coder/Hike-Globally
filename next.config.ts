import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Resolution order matters:
 *  1. NEXT_PUBLIC_SERVER_URL        — explicit, wins everywhere
 *  2. VERCEL_PROJECT_PRODUCTION_URL — set by Vercel, stable across deployments
 *  3. localhost                     — local development
 */
const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

/** Only add a remote pattern when the value is a parseable absolute URL. */
const remotePattern = (value: string | undefined) => {
  if (!value) return []
  try {
    const url = new URL(value)
    return [
      {
        protocol: url.protocol.replace(':', '') as 'http' | 'https',
        hostname: url.hostname,
      },
    ]
  } catch {
    return []
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Pin the workspace root. Without this, Turbopack can walk up past the repo
  // and pick the wrong root when a parent directory also has a lockfile.
  turbopack: {
    root: path.resolve(dirname),

    // Make `@payload-config` resolution explicit. tsconfig.json also maps
    // this alias, but Turbopack's import map can end up pointing at the
    // Payload-template default location ('./src/payload.config.ts') in some
    // environments, which fails with "Module not found: Can't resolve
    // '@payload-config'" because our config lives at the repo root.
    //
    // IMPORTANT: this MUST stay a relative './' path. An absolute path (e.g.
    // path.resolve(...)) is treated as "server relative" by Turbopack and
    // breaks the build with the same module-not-found error.
    resolveAlias: {
      '@payload-config': './payload.config.ts',
    },
  },

  images: {
    // Payload serves uploads from /api/media/file/** when object storage is off.
    // Declaring it as a LOCAL pattern keeps Next from routing it through
    // remotePatterns, which blocks private IPs as of Next 16.
    localPatterns: [{ pathname: '/api/media/file/**' }],

    // Every distinct quality is a separate billable transformation on Vercel.
    // Keep this list short and use only these values in the `quality` prop.
    qualities: [60, 75, 90],

    formats: ['image/avif', 'image/webp'],

    // 31 days. The default re-transforms far more often than a CMS needs.
    minimumCacheTTL: 2678400,

    remotePatterns: [
      ...remotePattern(SERVER_URL),
      ...remotePattern(process.env.NEXT_PUBLIC_MEDIA_URL),
    ],
  },

  // Payload's admin UI ships Sass partials that import by bare path.
  sassOptions: { loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'] },

  // The legacy Vite entrypoints live alongside the Next app during the
  // migration. They are not part of any Next route and must not be traced.
  outputFileTracingExcludes: {
    '*': ['./scripts/**/*', './src/main.jsx', './src/App.jsx'],
  },
}

// withPayload externalises sharp, Drizzle and the Postgres driver so the
// bundler never tries to ship them to the browser. It is not optional.
export default withPayload(nextConfig, { devBundleServerPackages: false })
