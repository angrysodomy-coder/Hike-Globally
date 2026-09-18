import type { Access } from 'payload'

/**
 * Access control for operations restricted to authenticated admin users.
 */
export const isAdmin: Access = ({ req: { user } }) => {
  return Boolean(user)
}

/**
 * Public access that only returns published content for anonymous visitors,
 * while allowing authenticated admin users to see all (including drafts).
 */
export const publishedOrAdmin: Access = ({ req: { user } }) => {
  if (user) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}

/**
 * Public read access for non-versioned public collections (e.g. Categories, Media)
 */
export const publicRead: Access = () => true
