import type { Field, FieldHook } from 'payload'

/** Top-level routes that CMS slugs must never shadow. */
const RESERVED_SLUGS = ['admin', 'api', 'next', 'blog', 'trips', 'destinations', 'contact']

export const formatSlug = (val: string): string =>
  val
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')

const formatSlugHook =
  (fallbackField: string): FieldHook =>
  ({ data, operation, value }) => {
    if (typeof value === 'string' && value.length > 0) return formatSlug(value)
    if (operation === 'create' || !data?.slug) {
      const fallback = data?.[fallbackField]
      if (typeof fallback === 'string' && fallback.length > 0) return formatSlug(fallback)
    }
    return value
  }

type SlugFieldOptions = {
  fallbackField?: string
  /** Guard against shadowing real routes — enable for collections served at the site root. */
  checkReserved?: boolean
}

export const slugField = ({ fallbackField = 'title', checkReserved = false }: SlugFieldOptions = {}): Field => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  required: true,
  admin: {
    position: 'sidebar',
    description: 'URL identifier. Auto-generated from the title; edit with care after publishing.',
  },
  hooks: { beforeValidate: [formatSlugHook(fallbackField)] },
  validate: (val: string | null | undefined) => {
    if (checkReserved && val && RESERVED_SLUGS.includes(val)) {
      return `"${val}" is a reserved path and cannot be used as a slug.`
    }
    return true
  },
})
