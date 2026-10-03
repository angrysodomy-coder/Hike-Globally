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
 * Local/cloud sandboxes add one more wrinkle: the app may run on
 * `localhost:3000` inside the container but be opened in the browser through a
 * proxy such as `https://3000-<sandbox>.e2b.app`. If Payload's `serverURL` is
 * set to localhost, Payload appends that localhost origin to `csrf`, and the
 * proxied browser origin is rejected. In development we therefore leave
 * Payload's `serverURL` blank and its CSRF list empty so admin/API URLs stay
 * same-origin relative and uploads work from the preview URL. In production we
 * use exact deployment origins.
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

const isLocalOrigin = (origin?: string | null): boolean => {
  if (!origin) return false
  try {
    const { hostname } = new URL(origin)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0'
  } catch {
    return false
  }
}

const fromEnv = (key: string): string | null => toOrigin(process.env[key])

/**
 * The canonical, absolute URL of this deployment — used for sitemap/SEO output
 * and public metadata. Prefer an explicitly configured public URL, but do not
 * let a copied `http://localhost:3000` production value poison a Vercel deploy.
 */
export const getServerURL = (): string => {
  const configured = fromEnv('NEXT_PUBLIC_SERVER_URL')
  const vercelProduction = fromEnv('VERCEL_PROJECT_PRODUCTION_URL')
  const vercelDeployment = fromEnv('VERCEL_URL')

  if (configured && !(isProduction() && isLocalOrigin(configured) && (vercelProduction || vercelDeployment))) {
    return configured
  }

  return vercelProduction ?? vercelDeployment ?? configured ?? 'http://localhost:3000'
}

/**
 * Payload's `serverURL` is allowed to be blank. That is the safest value for
 * local/Arena preview development because Payload then emits relative admin,
 * API and media URLs instead of hard-coding the container's localhost origin.
 */
export const getPayloadServerURL = (): string => {
  if (!isProduction()) return ''

  const serverURL = getServerURL()

  // A localhost Payload serverURL makes the admin unusable from any real
  // browser-facing host because Payload appends it to the CSRF allowlist and
  // emits localhost media/admin URLs. Treat it as a placeholder and fall back
  // to relative URLs instead.
  return isLocalOrigin(serverURL) ? '' : serverURL
}

/**
 * Every exact origin allowed to make authenticated, cookie-bearing requests in
 * production. Payload does exact string comparisons here — no wildcards — so
 * development/proxied preview keeps this empty to avoid breaking uploads from
 * an unknown preview host.
 */
export const getTrustedOrigins = (): string[] => {
  if (!isProduction()) return []

  const extra = (process.env.PAYLOAD_CSRF_ORIGINS ?? '').split(',')

  const candidates = [
    getPayloadServerURL(),
    // Vercel: the stable production domain plus this deployment's own URLs,
    // so preview deployments can be administered without reconfiguration.
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    ...extra,
  ]

  return [
    ...new Set(
      candidates
        .map(toOrigin)
        .filter((origin): origin is string => Boolean(origin))
        .filter((origin) => !(isProduction() && isLocalOrigin(origin))),
    ),
  ]
}
