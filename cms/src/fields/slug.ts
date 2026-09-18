import type { Field } from 'payload'

function formatSlug(val: string): string {
  return val
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()
    .trim()
}

export const slugField = (fieldToUse: string = 'title'): Field => ({
  name: 'slug',
  label: 'Slug',
  type: 'text',
  index: true,
  unique: true,
  admin: {
    position: 'sidebar',
    description: 'Unique URL path identifier. Auto-generated from title/name if left empty.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === 'string' && value.trim() !== '') {
          return formatSlug(value)
        }

        const fallback = data?.[fieldToUse]
        if (typeof fallback === 'string' && fallback.trim() !== '') {
          return formatSlug(fallback)
        }

        return value
      },
    ],
  },
})
