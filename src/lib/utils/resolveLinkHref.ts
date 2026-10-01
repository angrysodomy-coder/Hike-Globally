import { documentHref } from './documentHref'

/**
 * The shape `linkField()` produces. Kept structural rather than importing a
 * generated type, because the same group appears inside a dozen different
 * blocks and globals and each one gets its own anonymous interface in
 * `payload-types.ts`.
 */
export type LinkValue = {
  label?: null | string
  newTab?: boolean | null
  reference?: {
    relationTo: string
    value: { slug?: null | string } | number | string
  } | null
  type?: 'custom' | 'reference' | null
  url?: null | string
}

/**
 * Resolve a link field to an href.
 *
 * Returns `null` when a reference is unresolvable — a relationship that was
 * populated at depth 0, or one whose target was deleted. Call sites render
 * plain text instead of an anchor rather than emitting `href="/undefined"`,
 * which is the usual way this failure reaches production unnoticed.
 */
export const resolveLinkHref = (link: LinkValue | null | undefined): null | string => {
  if (!link) return null

  if (link.type === 'custom') return link.url || null

  const ref = link.reference
  if (!ref) return null

  // depth: 0 leaves `value` as an ID — there is no slug to build a path from.
  if (typeof ref.value !== 'object' || ref.value === null) return null

  const slug = ref.value.slug
  if (!slug) return null

  return documentHref(ref.relationTo, slug)
}
