import 'server-only'

import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

/**
 * The Local API client.
 *
 * `getPayload()` memoises the initialised instance per process, so calling
 * this on every render is cheap — it is a direct function call into Payload,
 * not an HTTP round trip to our own API.
 *
 * `import 'server-only'` turns it into a BUILD error if a client component
 * ever imports this file, rather than a confusing runtime failure about `fs`
 * or `pg` being unavailable in the browser.
 *
 * ── The footgun to internalise ───────────────────────────────────────────
 * In the Local API `overrideAccess` defaults to **true** — access control is
 * SKIPPED unless you opt in. A careless `payload.find({ collection: 'trips' })`
 * on a public page returns unpublished drafts, including next season's prices.
 * Every helper in `src/lib/queries/*` passes `overrideAccess: false`.
 */
export const getPayloadClient = async (): Promise<Payload> => getPayload({ config: configPromise })
