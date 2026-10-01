import type { Access, FieldAccess, PayloadRequest } from 'payload'

/**
 * Access control in Payload is just a function that returns one of three things:
 *
 *   true            → allowed, no restriction
 *   false           → denied
 *   a `Where` query → allowed, but only for documents matching this constraint
 *
 * The third form is the powerful one: Payload merges it into the database query,
 * so a public visitor literally cannot fetch a draft, even by guessing an ID.
 *
 * These run on the REST API, GraphQL, the admin UI, AND the Local API whenever
 * `overrideAccess` is false. Defining them once here keeps every collection honest.
 */

/** Public. Use for anything that should be readable without logging in. */
export const anyone: Access = () => true

/** Any logged-in user, regardless of role. */
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

/** Admins only. */
export const isAdmin: Access = ({ req: { user } }) => Boolean(user?.roles?.includes('admin'))

/**
 * Field-level variant. Collection access does not protect individual fields —
 * without this, an editor could PATCH their own `roles` to `['admin']`.
 */
export const isAdminField: FieldAccess = ({ req: { user } }) =>
  Boolean(user?.roles?.includes('admin'))

/**
 * "May this person open /admin at all."
 *
 * This slot is narrower than `Access`: it must return a plain boolean, because
 * there is no sensible query-constraint form of "can log in". Using
 * `authenticated` here is a type error, which is a good thing — it is a
 * genuinely different question from "may this person read this document".
 */
export const canAccessAdminUI = ({ req: { user } }: { req: PayloadRequest }): boolean =>
  Boolean(user)

/** Admins and the operations team — departures, enquiries, booking inventory. */
export const isAdminOrOperations: Access = ({ req: { user } }) =>
  Boolean(user?.roles?.some((role) => role === 'admin' || role === 'operations'))

/**
 * The workhorse for public content.
 *
 * Logged-in users see everything, including drafts, so the admin list view and
 * live preview work. Everyone else gets a query constraint pinning them to
 * published documents only.
 *
 * Note `_status` only exists on collections with `versions.drafts` enabled; do
 * not use this on a collection without drafts or every public read returns zero
 * rows.
 */
export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
