import { unstable_cache } from 'next/cache'

import type { Footer, Header, SiteSetting } from '@/payload-types'

import { getPayloadClient } from '@/lib/payload'

/**
 * Globals appear on every page, so they are cached under their own tags and
 * invalidated by the `revalidateGlobal` hooks. `depth: 1` resolves nav
 * references far enough for `resolveLinkHref` to read a slug.
 *
 * The tag MUST match what `revalidateGlobal(tag)` passes in
 * `src/hooks/revalidate.ts` — it is called with the bare global slug
 * (`'header'`, `'footer'`, `'site-settings'`). Inventing a prefixed tag here
 * would register a cache entry nothing ever invalidates, and the nav would
 * stay stale for the full hour.
 */
const cachedGlobal = <T>(slug: 'footer' | 'header' | 'site-settings', depth = 1) =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug, depth, overrideAccess: false }) as Promise<T>
    },
    [`global-${slug}`],
    { revalidate: 3600, tags: [slug] },
  )

export const getHeader = () => cachedGlobal<Header>('header')()
export const getFooter = () => cachedGlobal<Footer>('footer')()
export const getSiteSettings = () => cachedGlobal<SiteSetting>('site-settings')()
