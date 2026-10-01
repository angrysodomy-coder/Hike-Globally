import type { CollectionSlug, Field } from 'payload'

/**
 * A link that is either a relationship to a real document or a raw URL.
 *
 * Why not just a text field? Because a text field rots. When someone renames a
 * trip's slug, every hard-coded `/trips/old-slug` in a nav or CTA silently
 * 404s. A `relationship` stores the document ID, so the URL is resolved at
 * render time from the current slug and can never drift.
 *
 * `relationTo` is an array, which makes this a *polymorphic* relationship:
 * the stored value is `{ relationTo: 'trips', value: 42 }`, so the renderer
 * knows which path prefix to use. See `resolveLinkHref()` in
 * `src/lib/utils/resolveLinkHref.ts`.
 */
export const linkField = (options: {
  /**
   * Which collections this link may point at. Required rather than defaulted,
   * because `CollectionSlug` is generated from the collections currently
   * registered: a hardcoded default would stop compiling until every target
   * exists. Call sites pass `[...LINKABLE_COLLECTIONS]` from
   * `src/collections/linkable.ts`.
   */
  relationTo: CollectionSlug[]
  name?: string
  label?: string
}): Field => ({
  name: options.name ?? 'link',
  type: 'group',
  label: options.label ?? 'Link',
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'radio',
          defaultValue: 'reference',
          options: [
            { label: 'Internal page', value: 'reference' },
            { label: 'Custom URL', value: 'custom' },
          ],
          admin: { layout: 'horizontal', width: '50%' },
        },
        {
          name: 'newTab',
          type: 'checkbox',
          label: 'Open in new tab',
          admin: { width: '50%', style: { alignSelf: 'flex-end' } },
        },
      ],
    },
    {
      name: 'reference',
      type: 'relationship',
      relationTo: options.relationTo,
      required: true,
      // `condition` hides the field in the admin UI unless the sibling radio
      // says so. It does not make the field optional server-side — that is why
      // both branches are `required` and validation still passes: Payload skips
      // validation for fields hidden by a condition.
      admin: { condition: (_, sibling) => sibling?.type === 'reference' },
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: { condition: (_, sibling) => sibling?.type === 'custom' },
    },
    { name: 'label', type: 'text', required: true },
  ],
})
