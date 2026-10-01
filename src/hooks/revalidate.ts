import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  Payload,
  RequestContext,
} from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Departure, Destination, Page, Post, Trip } from '@/payload-types'

/**
 * ── The cache strategy in one place ──────────────────────────────────────
 *
 * Two mechanisms, deliberately both:
 *
 *   ISR          `export const revalidate = 3600` on the route. Self-healing
 *                safety net. If a hook below ever misses a path, the page is
 *                still wrong for at most an hour, not forever.
 *   On-demand    these hooks. Correct within seconds, but only for the paths
 *                and tags we remember to enumerate.
 *
 * Next 16 made the second argument to `revalidateTag` REQUIRED (verified
 * against next@16.3.8: `revalidateTag(tag: string, profile: string |
 * { expire?: number })`). The one-argument form is gone, so the split below
 * is forced on us anyway — which is a good thing, because it makes the
 * editorial-vs-money distinction explicit at every call site.
 */

/**
 * `'max'` — a cacheLife profile meaning "serve the stale copy immediately,
 * refresh in the background". The visitor never waits. Correct for anything
 * where being 30 seconds out of date is invisible: body copy, photography,
 * headings, SEO text.
 */
const EDITORIAL = 'max' as const

/**
 * `{ expire: 0 }` — drop it now; the next request re-renders and blocks while
 * it does. Slower, and worth it. This is reserved for price and availability,
 * where serving a stale copy means selling a seat that does not exist. See
 * pitfall 3 in the plan: showing a sold-out departure as bookable is the worst
 * failure mode in this industry.
 */
const CRITICAL = { expire: 0 } as const

/**
 * Bulk operations (the seed script, a CSV import, a backfill) pass
 * `context: { disableRevalidate: true }` so 400 `create` calls do not fire 400
 * cache invalidations. Without this guard an import either crawls or times out
 * on Vercel. Every hook in this file checks it first.
 *
 *   await payload.create({ collection: 'trips', data, context: { disableRevalidate: true } })
 */
const skip = (context: RequestContext): boolean => Boolean(context?.disableRevalidate)

// ─── Trips ────────────────────────────────────────────────────────────────

export const revalidateTrip: CollectionAfterChangeHook<Trip> = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (skip(context)) return doc

  /**
   * Autosave fires this hook every ~375ms while an editor types. Autosaved
   * drafts carry `_status: 'draft'`, so this guard is what stops a revalidation
   * storm — do not relax it to "always revalidate".
   */
  if (doc._status === 'published') {
    revalidatePath(`/trips/${doc.slug}`)
    payload.logger.info(`Revalidated /trips/${doc.slug}`)
  }

  // A renamed slug leaves the OLD url cached and serving a page that no longer
  // exists. Unpublishing leaves it cached and serving content that is no longer
  // public. Both need the previous path cleared.
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
    revalidatePath(`/trips/${previousDoc.slug}`)
  }
  if (previousDoc?._status === 'published' && doc._status !== 'published') {
    revalidatePath(`/trips/${previousDoc.slug}`)
  }

  // Trip cards appear on the index, the homepage rails, destination pages and
  // related-trip modules. One tag covers all of them.
  revalidateTag('trips', EDITORIAL)
  revalidateTag('sitemap', EDITORIAL)

  return doc
}

export const revalidateTripDelete: CollectionAfterDeleteHook<Trip> = ({
  doc,
  req: { context },
}) => {
  if (skip(context)) return doc

  revalidatePath(`/trips/${doc?.slug}`)
  // CRITICAL, not EDITORIAL: a deleted trip must stop being offered for sale
  // immediately, not after a background refresh.
  revalidateTag('trips', CRITICAL)
  revalidateTag('sitemap', EDITORIAL)

  return doc
}

// ─── Departures ───────────────────────────────────────────────────────────

/**
 * Availability is money, so this expires immediately and is scoped to the one
 * affected trip rather than the whole catalogue.
 *
 * `doc.trip` is an ID at depth 0 and a populated object at depth > 0, and which
 * one you get depends on how the write was made — the admin UI, the REST API
 * and the Local API all differ. Handling only one shape means availability
 * silently stops revalidating for half your writes, so look the slug up when
 * it is missing instead of skipping.
 */
const revalidateDepartureDoc = async (
  doc: Departure,
  payload: Payload,
  context: RequestContext,
): Promise<Departure> => {
  if (skip(context)) return doc

  let tripSlug: null | string = null

  if (doc.trip && typeof doc.trip === 'object' && 'slug' in doc.trip) {
    tripSlug = String(doc.trip.slug)
  } else if (doc.trip) {
    try {
      const trip = await payload.findByID({
        collection: 'trips',
        depth: 0,
        id: doc.trip as number | string,
        select: { slug: true },
      })
      tripSlug = trip?.slug ?? null
    } catch (error) {
      // The trip is already gone — this is a cascade from deleting a trip.
      // The trip's own delete hook has handled the path; nothing to do.
      payload.logger.warn({ err: error }, 'Departure revalidation: parent trip not found')
    }
  }

  if (tripSlug) {
    revalidatePath(`/trips/${tripSlug}`)
    payload.logger.info(`Revalidated departures for /trips/${tripSlug}`)
  }

  revalidateTag('departures', CRITICAL)

  return doc
}

export const revalidateDeparture: CollectionAfterChangeHook<Departure> = ({
  doc,
  req: { context, payload },
}) => revalidateDepartureDoc(doc, payload, context)

export const revalidateDepartureDelete: CollectionAfterDeleteHook<Departure> = ({
  doc,
  req: { context, payload },
}) => revalidateDepartureDoc(doc, payload, context)

// ─── Posts ────────────────────────────────────────────────────────────────

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (skip(context)) return doc

  if (doc._status === 'published') {
    revalidatePath(`/blog/${doc.slug}`)
    payload.logger.info(`Revalidated /blog/${doc.slug}`)
  }
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
    revalidatePath(`/blog/${previousDoc.slug}`)
  }
  if (previousDoc?._status === 'published' && doc._status !== 'published') {
    revalidatePath(`/blog/${previousDoc.slug}`)
  }

  revalidateTag('posts', EDITORIAL)
  revalidateTag('sitemap', EDITORIAL)

  return doc
}

export const revalidatePostDelete: CollectionAfterDeleteHook<Post> = ({
  doc,
  req: { context },
}) => {
  if (skip(context)) return doc

  revalidatePath(`/blog/${doc?.slug}`)
  revalidateTag('posts', CRITICAL)
  revalidateTag('sitemap', EDITORIAL)

  return doc
}

// ─── Pages ────────────────────────────────────────────────────────────────

/** The homepage is a Page whose slug is `home`, but it lives at `/`. */
const pagePath = (slug?: null | string): string => (slug === 'home' ? '/' : `/${slug}`)

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (skip(context)) return doc

  if (doc._status === 'published') {
    revalidatePath(pagePath(doc.slug))
    payload.logger.info(`Revalidated ${pagePath(doc.slug)}`)
  }
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
    revalidatePath(pagePath(previousDoc.slug))
  }
  if (previousDoc?._status === 'published' && doc._status !== 'published') {
    revalidatePath(pagePath(previousDoc.slug))
  }

  revalidateTag('pages', EDITORIAL)
  revalidateTag('sitemap', EDITORIAL)

  return doc
}

export const revalidatePageDelete: CollectionAfterDeleteHook<Page> = ({
  doc,
  req: { context },
}) => {
  if (skip(context)) return doc

  revalidatePath(pagePath(doc?.slug))
  revalidateTag('pages', CRITICAL)
  revalidateTag('sitemap', EDITORIAL)

  return doc
}

// ─── Destinations ─────────────────────────────────────────────────────────

export const revalidateDestination: CollectionAfterChangeHook<Destination> = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (skip(context)) return doc

  if (doc._status === 'published') {
    revalidatePath(`/destinations/${doc.slug}`)
    payload.logger.info(`Revalidated /destinations/${doc.slug}`)
  }
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
    revalidatePath(`/destinations/${previousDoc.slug}`)
  }

  // The index renders every region tile, so it changes whenever any one of
  // them does — including display order, which has no slug to key off.
  revalidatePath('/destinations')
  revalidateTag('destinations', EDITORIAL)
  // Trip cards print the destination name, so renaming a region makes every
  // cached trip card stale too.
  revalidateTag('trips', EDITORIAL)
  revalidateTag('sitemap', EDITORIAL)

  return doc
}

export const revalidateDestinationDelete: CollectionAfterDeleteHook<Destination> = ({
  doc,
  req: { context },
}) => {
  if (skip(context)) return doc

  revalidatePath(`/destinations/${doc?.slug}`)
  revalidatePath('/destinations')
  revalidateTag('destinations', CRITICAL)
  revalidateTag('sitemap', EDITORIAL)

  return doc
}

// ─── Globals and plugins ──────────────────────────────────────────────────

/**
 * Header, Footer and Settings render inside the root layout, so they appear on
 * every page of the site. `revalidatePath('/', 'layout')` is the only call that
 * invalidates a layout and everything nested beneath it.
 *
 * Curried so each global passes its own tag:
 *   hooks: { afterChange: [revalidateGlobal('header')] }
 */
export const revalidateGlobal =
  (tag: string): GlobalAfterChangeHook =>
  ({ doc, req: { context } }) => {
    if (skip(context)) return doc

    revalidateTag(tag, EDITORIAL)
    revalidatePath('/', 'layout')

    return doc
  }

/**
 * Redirects are resolved in middleware on every request miss. A stale redirect
 * table means a 404 for a url the editor just fixed, so this never waits for a
 * background refresh.
 */
export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req: { context } }) => {
  if (skip(context)) return doc

  revalidateTag('redirects', CRITICAL)

  return doc
}
