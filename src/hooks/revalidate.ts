import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

type RevalidateArgs = {
  /** '' for root-level pages, '/trips' for trips, '/blog' for posts */
  pathPrefix: string
  /** Collection-level cache tag, e.g. 'trips' — must match unstable_cache tags */
  tag: string
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path)
  } catch {
    // Ignore when called outside of Next.js request context (e.g. CLI scripts)
  }
}

function safeRevalidateTag(tag: string) {
  try {
    revalidateTag(tag)
  } catch {
    // Ignore when called outside of Next.js request context (e.g. CLI scripts)
  }
}

/** Root-level page with slug 'home' is served at '/', not '/home'. */
const docPath = (pathPrefix: string, slug: unknown): string =>
  pathPrefix === '' && slug === 'home' ? '/' : `${pathPrefix}/${slug}`

/**
 * Embedded-Payload superpower: hooks run in the same process as Next.js,
 * so we call revalidatePath/revalidateTag directly. No webhooks, no secrets.
 */
export const buildRevalidateHook =
  ({ pathPrefix, tag }: RevalidateArgs): CollectionAfterChangeHook =>
  ({ doc, previousDoc, req: { payload, context } }) => {
    if (context.disableRevalidate) return doc

    if (doc._status === 'published') {
      const path = docPath(pathPrefix, doc.slug)
      payload.logger.info(`Revalidating ${path}`)
      safeRevalidatePath(path)
      safeRevalidateTag(tag)
      safeRevalidateTag('sitemap')
    }

    // Unpublished, or slug changed → purge the old path too
    if (previousDoc?._status === 'published') {
      if (doc._status !== 'published' || previousDoc.slug !== doc.slug) {
        safeRevalidatePath(docPath(pathPrefix, previousDoc.slug))
        safeRevalidateTag(tag)
        safeRevalidateTag('sitemap')
      }
    }
    return doc
  }

export const buildRevalidateDeleteHook =
  ({ pathPrefix, tag }: RevalidateArgs): CollectionAfterDeleteHook =>
  ({ doc, req: { context } }) => {
    if (context.disableRevalidate) return doc
    safeRevalidatePath(docPath(pathPrefix, doc?.slug))
    safeRevalidateTag(tag)
    safeRevalidateTag('sitemap')
    return doc
  }

/** For globals (header, footer): purge their cache tag on save. */
export const revalidateGlobal =
  (tag: string): GlobalAfterChangeHook =>
  ({ doc, req: { context } }) => {
    if (context.disableRevalidate) return doc
    safeRevalidateTag(tag)
    return doc
  }

/**
 * For collections WITHOUT drafts (e.g. destinations): no _status checks,
 * just purge the doc path (old + new on slug change) and the list tag.
 */
export const buildRevalidateSimpleHook =
  ({ pathPrefix, tag }: RevalidateArgs): CollectionAfterChangeHook =>
  ({ doc, previousDoc, req: { payload, context } }) => {
    if (context.disableRevalidate) return doc
    const path = `${pathPrefix}/${doc.slug}`
    payload.logger.info(`Revalidating ${path}`)
    safeRevalidatePath(path)
    if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
      safeRevalidatePath(`${pathPrefix}/${previousDoc.slug}`)
    }
    safeRevalidateTag(tag)
    safeRevalidateTag('sitemap')
    return doc
  }
