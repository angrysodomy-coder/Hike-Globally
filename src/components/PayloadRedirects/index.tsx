import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import React from 'react'

import { getPayloadClient } from '@/lib/payload'
import { documentHref } from '@/lib/utils/documentHref'

/**
 * Cached on the `redirects` tag, which `revalidateRedirects` purges the
 * instant an editor saves one. Without the cache this would be a database
 * round trip on EVERY 404, which is exactly the traffic a crawler generates.
 */
const getRedirects = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'redirects',
      depth: 1,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
    })
    return result.docs
  },
  ['redirects'],
  { revalidate: 3600, tags: ['redirects'] },
)

/**
 * Checks the redirects table before letting a URL 404.
 *
 * Rendered in two modes:
 *  - `disableNotFound` on a page that DID resolve — it still runs, so a
 *    redirect created for a now-reused slug wins over the stale document.
 *  - without it, as the last thing a route does before giving up.
 */
export async function PayloadRedirects({
  disableNotFound,
  url,
}: {
  disableNotFound?: boolean
  url: string
}) {
  const redirects = await getRedirects()
  const match = redirects.find((doc) => doc.from === url)

  if (match) {
    const to = match.to

    if (to?.type === 'custom' && to.url) redirect(to.url)

    const ref = to?.reference
    if (ref && typeof ref.value === 'object' && ref.value && 'slug' in ref.value) {
      redirect(documentHref(ref.relationTo, String(ref.value.slug)))
    }
  }

  if (disableNotFound) return null

  notFound()
}
