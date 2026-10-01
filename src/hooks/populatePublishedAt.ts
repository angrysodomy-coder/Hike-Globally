import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Stamps `publishedAt` the first time a document actually goes live.
 *
 * Why not `defaultValue: () => new Date()`? Because that stamps the moment the
 * editor clicks "Create", so a trip drafted in March and published in August
 * reports March — which then drives the journal sort order, the sitemap's
 * `lastmod`, and the `datePublished` in structured data. All three would be
 * wrong.
 *
 * The guard is `!data.publishedAt`, so an editor can still override the date by
 * hand (back-dating an imported article, for instance) and this never
 * overwrites it.
 */
export const populatePublishedAt: CollectionBeforeChangeHook = ({ data, operation }) => {
  if (operation !== 'create' && operation !== 'update') return data
  if (data?.publishedAt) return data
  if (data?._status !== 'published') return data

  return { ...data, publishedAt: new Date().toISOString() }
}
