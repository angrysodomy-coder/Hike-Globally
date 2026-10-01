import type { CollectionSlug, PayloadRequest } from 'payload'

import { documentHref } from './documentHref'

/**
 * Builds the URL the admin "Preview" button and the live-preview iframe point at.
 *
 * It does NOT point at the page directly. It points at `/next/preview`, which
 * validates the secret, validates the Payload session, enables Next's draft
 * mode, and only then redirects to the real path. Linking straight to
 * `/trips/<slug>` would render the published document, so an editor would
 * preview the thing they just changed and see the old copy.
 *
 * The path prefix comes from `documentHref()` rather than a local map. The
 * plan sketches a second `PREFIX` constant here, but two copies of the
 * collection → URL mapping is exactly how canonical tags end up pointing at
 * 404s, so this defers to the single source of truth in `documentHref.ts`.
 *
 * Returns a RELATIVE url on purpose: Payload resolves it against the browser's
 * origin, so the same code works on localhost, on a Vercel preview deployment,
 * and in production without reading NEXT_PUBLIC_SERVER_URL.
 */
export const generatePreviewPath = ({
  collection,
  slug,
}: {
  collection: CollectionSlug
  slug: string
  /**
   * Accepted so call sites can keep Payload's `({ data, req })` signature
   * intact. Unused today — the preview route reads auth from the incoming
   * request's cookies, not from here.
   */
  req?: PayloadRequest
}): null | string => {
  if (!slug) return null

  // Slugs are already `[a-z0-9-]` via formatSlug(), but a hand-edited or
  // imported slug is not guaranteed to be, and an un-encoded one would break
  // the `path` query parameter.
  const path = documentHref(collection, encodeURIComponent(slug))

  const params = new URLSearchParams({
    path,
    previewSecret: process.env.PREVIEW_SECRET || '',
  })

  return `/next/preview?${params.toString()}`
}
