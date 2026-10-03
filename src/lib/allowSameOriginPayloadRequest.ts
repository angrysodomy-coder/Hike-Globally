/**
 * Payload validates cookie-authenticated requests against a static CSRF origin
 * list. On hosts with aliases (notably a Vercel custom domain), the browser's
 * real origin is not always knowable when the config is built. Payload then
 * ignores an otherwise valid login cookie and reports a misleading 403.
 *
 * For requests which are demonstrably same-origin, remove Origin and let
 * Payload's built-in Sec-Fetch-Site check authenticate the cookie. Cross-origin
 * requests are returned untouched and still have to match the configured CSRF
 * allowlist.
 */
export const allowSameOriginPayloadRequest = (request: Request): Request => {
  const originHeader = request.headers.get('origin')
  if (!originHeader) return request

  let browserOrigin: URL
  try {
    browserOrigin = new URL(originHeader)
  } catch {
    return request
  }

  const firstHeaderValue = (name: string): string | null =>
    request.headers.get(name)?.split(',')[0]?.trim() || null

  const forwardedHost = firstHeaderValue('x-forwarded-host')
  const host = forwardedHost ?? firstHeaderValue('host') ?? new URL(request.url).host
  const protocol = firstHeaderValue('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':', '')

  let publicOrigin: string
  try {
    publicOrigin = new URL(`${protocol}://${host}`).origin
  } catch {
    return request
  }

  if (browserOrigin.origin !== publicOrigin) return request

  const headers = new Headers(request.headers)
  headers.delete('origin')
  // Payload accepts an origin-less cookie only when Fetch Metadata proves the
  // request came from this site. Set it for trusted reverse proxies that omit
  // the browser's original Sec-Fetch-Site header.
  headers.set('sec-fetch-site', 'same-origin')

  return new Request(request, { headers })
}
