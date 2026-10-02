import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import type { Redirect } from '@/payload-types'

/**
 * All redirects, cached across requests with tag 'redirects' — purged by the
 * revalidateRedirects hook the moment an editor saves one. Travel sites rarely
 * exceed a few hundred redirects, so loading the full list is the right call
 * (one cached query instead of one DB lookup per 404).
 */
const getRedirects = unstable_cache(
  async (): Promise<Redirect[]> => {
    try {
      const payload = await getPayload({ config })
      const result = await payload.find({
        collection: 'redirects',
        depth: 1, // resolve document references so we can build their URLs
        limit: 1000,
        pagination: false,
      })
      return result.docs
    } catch (error) {
      console.warn('[getRedirects] Error fetching redirects:', error)
      return []
    }
  },
  ['redirects-list'],
  { tags: ['redirects'] },
)

const collectionPrefix: Record<string, string> = {
  pages: '',
  posts: '/blog',
  trips: '/trips',
}

/** Resolve a redirect's target to a concrete URL (internal doc or custom URL). */
const resolveDestination = (redirectDoc: Redirect): string | null => {
  if (redirectDoc.to?.type === 'custom' && redirectDoc.to.url) {
    return redirectDoc.to.url
  }
  const ref = redirectDoc.to?.reference
  if (ref && typeof ref.value === 'object' && ref.value !== null && 'slug' in ref.value) {
    const prefix = collectionPrefix[ref.relationTo] ?? ''
    const slug = ref.value.slug
    return prefix === '' && slug === 'home' ? '/' : `${prefix}/${slug}`
  }
  return null
}

export const getRedirectUrlForPath = async (path: string): Promise<string | null> => {
  const redirects = await getRedirects()
  const match = redirects.find((r) => r.from === path || r.from === `${path}/`)
  return match ? resolveDestination(match) : null
}

/**
 * Call this instead of notFound() in dynamic routes: if an editor created a
 * redirect for the missing path, follow it (301); otherwise render the 404.
 */
export const redirectOrNotFound = async (path: string): Promise<never> => {
  const destination = await getRedirectUrlForPath(path)
  if (destination) redirect(destination)
  notFound()
}
