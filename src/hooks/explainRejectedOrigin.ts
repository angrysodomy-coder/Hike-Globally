import type { AfterErrorHook } from 'payload'

/**
 * Turns Payload's opaque "You are not allowed to perform this action." into a
 * diagnosable event.
 *
 * When the browser's `Origin` is not on `config.csrf`, Payload throws the auth
 * cookie away *before* access control runs. The request then looks anonymous,
 * every collection's `authenticated` access returns false, and the editor sees
 * a bare 403 with no clue that the real problem is a URL mismatch. This hook
 * spots that exact signature — a 403, no `req.user`, but an auth cookie was
 * actually sent — and logs the offending origin next to the allowlist.
 */
export const explainRejectedOrigin: AfterErrorHook = ({ error, req }) => {
  const status = (error as { status?: number })?.status
  if (status !== 403 || req.user) return

  const origin = req.headers?.get('Origin')
  if (!origin) return

  const cookieName = `${req.payload.config.cookiePrefix}-token`
  const sentAuthCookie = (req.headers?.get('Cookie') ?? '').includes(`${cookieName}=`)
  if (!sentAuthCookie) return

  // Payload appends `serverURL` to whatever `csrf` list the config supplies,
  // so de-duplicate before reporting it.
  const trusted = [...new Set(req.payload.config.csrf)]
  if (trusted.length === 0 || trusted.includes(origin)) return

  req.payload.logger.error(
    `Rejected an authenticated request from origin "${origin}": it is not in Payload's CSRF ` +
      `allowlist [${trusted.join(', ')}], so the "${cookieName}" cookie was ignored and the ` +
      `request ran as an anonymous user. Set NEXT_PUBLIC_SERVER_URL to the URL you actually ` +
      `browse the admin panel on, or add this origin to PAYLOAD_CSRF_ORIGINS.`,
  )
}
