/**
 * Canonical absolute site URL.
 *
 * There are three different "where am I" answers on Vercel and using the wrong
 * one is the single most common cause of broken OG images, broken preview
 * links and CORS failures on preview deployments:
 *
 *   1. Production custom domain  → NEXT_PUBLIC_SERVER_URL (set by you)
 *   2. A preview deployment      → VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL
 *   3. Local dev                 → http://localhost:3000
 *
 * Never return a trailing slash — these get concatenated with paths that start
 * with `/`, and `//blog/x` is a different URL to `/blog/x` for canonical tags.
 */

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '')

/**
 * Server-side absolute URL. Safe in Server Components, route handlers,
 * `payload.config.ts`, sitemaps, and email templates.
 */
export const getServerSideURL = (): string => {
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    return stripTrailingSlash(process.env.NEXT_PUBLIC_SERVER_URL)
  }

  // Set on every Vercel deployment, including previews. Has no protocol.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return `http://localhost:${process.env.PORT || 3000}`
}

/**
 * Client-side absolute URL.
 *
 * In the browser, prefer the real origin over any build-time env var: that way
 * a preview deployment talks to itself rather than to production, and a user
 * on `www.` is not bounced to the apex domain mid-session.
 *
 * `NEXT_PUBLIC_` prefix is required for the fallback — anything without it is
 * stripped from the client bundle at build time and would be `undefined` here.
 */
export const getClientSideURL = (): string => {
  if (typeof window !== 'undefined') {
    return stripTrailingSlash(window.location.origin)
  }
  return getServerSideURL()
}

/**
 * Base URL for media. Set NEXT_PUBLIC_MEDIA_URL to your R2 custom domain
 * (e.g. https://media.hikeglobally.com) to serve images straight off the CDN
 * and skip a hop through the Next.js server.
 */
export const getMediaURL = (): string =>
  process.env.NEXT_PUBLIC_MEDIA_URL
    ? stripTrailingSlash(process.env.NEXT_PUBLIC_MEDIA_URL)
    : getServerSideURL()
