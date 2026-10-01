import type { FieldHook, TextField } from 'payload'

/**
 * "Pokharā to Jomsom — 12 Days!" → "pokhara-to-jomsom-12-days"
 *
 * The NFKD normalise + combining-mark strip matters on a Nepal-focused site:
 * without it "Pokharā" becomes "pokhar" and the URL silently loses a letter.
 */
export const formatSlug = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics: "Pokharā" → "Pokhara"
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * A `beforeValidate` field hook runs before the document is saved and can
 * rewrite the incoming value. This one fills the slug from the title on create,
 * then gets out of the way — so renaming a published trip does not silently
 * change its live URL and 404 every inbound link.
 */
const slugHook =
  (sourceField: string): FieldHook =>
  ({ data, operation, value }) => {
    if (typeof value === 'string' && value.length > 0) return formatSlug(value)

    if (operation === 'create' || !data?.slug) {
      const source = data?.[sourceField]
      if (typeof source === 'string' && source.length > 0) return formatSlug(source)
    }

    return value
  }

/**
 * URL-safe, unique, indexed identifier.
 *
 * `index: true` is not optional — every public page does a
 * `where: { slug: { equals } }` lookup, and without an index that is a
 * sequential scan on every request.
 *
 * Trade-off vs the core `slugField()`: Payload 3.90 exports one with a nicer
 * admin widget, but its source is annotated `@experimental — this field may
 * change or be removed`. This 25-line version has zero upgrade risk and
 * identical behaviour.
 */
type SlugFieldOverrides = Partial<
  Omit<TextField, 'hasMany' | 'maxRows' | 'minRows' | 'name' | 'type' | 'validate'>
>

export const slugField = (
  sourceField = 'title',
  overrides: SlugFieldOverrides = {},
): TextField => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  required: true,
  admin: {
    position: 'sidebar',
    description:
      'The URL segment for this document. Auto-filled from the title. Changing it after publishing breaks existing links — add a redirect if you do.',
  },
  hooks: { beforeValidate: [slugHook(sourceField)] },
  ...overrides,
})
