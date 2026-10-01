/**
 * The single place that maps a collection to its URL prefix.
 *
 * Four separate things need this mapping — SEO canonical URLs, the sitemap,
 * link-field resolution, and the live-preview path generator — and when they
 * disagree you get canonical tags pointing at 404s, which is the kind of bug
 * that quietly costs a season of organic traffic. So it lives here once.
 *
 * Typed as `Record<string, string>` rather than `Record<CollectionSlug, …>`
 * on purpose: `CollectionSlug` is generated from the collections currently
 * registered, so a literal union would stop compiling every time this file
 * mentions a collection that has not landed yet during the rollout.
 */
export const COLLECTION_PATH_PREFIX: Record<string, string> = {
  pages: '',
  posts: '/blog',
  trips: '/trips',
  destinations: '/destinations',
}

/**
 * Root-relative path for a document. Returns '/' for the homepage, whose slug
 * is 'home' by convention.
 */
export const documentHref = (collectionSlug: string, slug?: string | null): string => {
  if (!slug) return '/'

  const prefix = COLLECTION_PATH_PREFIX[collectionSlug] ?? ''

  if (collectionSlug === 'pages' && slug === 'home') return '/'

  return `${prefix}/${slug}`
}
