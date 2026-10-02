/**
 * Wraps a build-time data fetch (generateStaticParams / sitemap) so a
 * misconfigured or unreachable database never hard-fails the whole
 * `next build`. All call sites already use `dynamicParams = true` and/or
 * ISR, so returning an empty result just means those pages render
 * on-demand at request time instead of being pre-rendered at build time —
 * much better than Vercel reporting "Build error occurred" and shipping
 * nothing at all.
 *
 * This does NOT paper over real problems: the error is still logged to the
 * build output so it's easy to spot and fix (missing `PAYLOAD_SECRET`,
 * `POSTGRES_URL` not pointing at a reachable database, etc.).
 */
export async function safeStaticParams<T>(label: string, fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn()
  } catch (error) {
    console.warn(
      `[safeStaticParams] Skipping build-time prerender for "${label}" — ` +
        'could not reach Payload/Postgres at build time. Pages will render ' +
        'on-demand instead. Check PAYLOAD_SECRET and POSTGRES_URL in your ' +
        'deployment environment variables.\n',
      error,
    )
    return []
  }
}
