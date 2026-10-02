/**
 * Canonical URL + trusted-origin resolution.
 *
 * Why this file exists
 * --------------------
 * Payload copies `config.serverURL` into `config.csrf` (its CSRF allowlist).
 * Every write the admin panel makes is a `fetch()` POST/PATCH, and browsers
 * always attach an `Origin` header to those. If that origin is not on the
 * allowlist, Payload silently discards the `payload-token` cookie, the request
 * runs as an anonymous user, and collection access returns `false` —
 * surfacing as "You are not allowed to perform this action." on Publish/Save
 * even though the panel itself looks perfectly logged in (page navigations are
 * plain GETs with no `Origin` header, so they sail through).
 *
 * So the allowlist must contain *every* origin the admin can legitimately be
 * served from, not just one hardcoded environment variable.
 */

/** Normalise anything host-ish into a bare origin (`https://host[:port]`). */
const toOrigin = (value?: string | null): string | null => {
  const raw = value?.trim()
  if (!raw) return null
  // Vercel exposes bare hostnames (`my-app.vercel.app`) with no protocol.
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    return new URL(withProtocol).origin
  } catch {
    return null
  }
}

const isProduction = (): boolean => process.env.NODE_ENV === 'production'

/**
 * The canonical, absolute URL of this deployment — used for media URLs,
 * sitemap/SEO output and `og:` tags.
 */
export const getServerURL = (): string =>
  toOrigin(process.env.NEXT_PUBLIC_SERVER_URL) ??
  toOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  toOrigin(process.env.VERCEL_URL) ??
  'http://localhost:3000'

/**
 * Every origin allowed to make authenticated, cookie-bearing requests.
 *
 * Covers the canonical URL, Vercel's production/preview/branch domains, local
 * development hosts, and anything listed in `PAYLOAD_CSRF_ORIGINS` — the
 * escape hatch for custom domains, `www.` aliases, tunnels (ngrok, Cloudflare)
 * and cloud dev sandboxes that proxy the dev server behind their own hostname.
 */
export const getTrustedOrigins = (): string[] => {
  const extra = (process.env.PAYLOAD_CSRF_ORIGINS ?? '').split(',')

  const candidates = [
    getServerURL(),
    // Vercel: the stable production domain plus this deployment's own URLs,
    // so preview deployments can be administered without reconfiguration.
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    ...extra,
    // Local development: the dev server is reachable under several hostnames.
    ...(isProduction() ? [] : ['http://localhost:3000', 'http://127.0.0.1:3000']),
  ]

  return [...new Set(candidates.map(toOrigin).filter((o): o is string => Boolean(o)))]
}
