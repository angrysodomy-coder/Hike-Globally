import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidateTag } from 'next/cache'

/** Purge the cached redirects list whenever an editor changes a redirect. */
export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  payload.logger.info('Revalidating redirects')
  revalidateTag('redirects')
  return doc
}

export const revalidateRedirectsDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateTag('redirects')
  return doc
}
