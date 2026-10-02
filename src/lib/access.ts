import type { Access, AccessArgs } from 'payload'
import type { User } from '@/payload-types'

/** Any logged-in admin-panel user. */
export const authenticated = ({ req: { user } }: AccessArgs<User>): boolean => Boolean(user)

/** Public read. */
export const anyone: Access = () => true

/**
 * Editors see everything; anonymous visitors only see published docs.
 * This is the guard that keeps drafts off the live site.
 */
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
