import type { GroupField } from 'payload'

/**
 * Art direction = a DIFFERENT CROP, not a different size.
 *
 * `next/image` solves resolution (one source, many widths via `srcset`). It
 * cannot solve composition: a 21:9 ridge-line hero letterboxed onto a phone is
 * a grey sliver. Your repo already ships the two plates separately
 * (`hero-himalaya.webp` + `hero-himalaya-mobile.webp`,
 * `dest-hero-ridge.webp` + `dest-hero-mobile.webp`), so the CMS has to model
 * the pair explicitly — otherwise an editor swaps the hero and silently drops
 * the portrait version.
 *
 * Rendered by `<ArtDirectedImage>` as a `<picture>` with a `media` query, which
 * is the only mechanism that lets the browser pick before it starts the
 * download.
 */
export const artDirectedImage = (name = 'image', label = 'Image'): GroupField => ({
  name,
  type: 'group',
  label,
  fields: [
    {
      name: 'desktop',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Landscape crop. Used from 768px up.' },
    },
    {
      name: 'mobile',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional portrait crop for phones. Falls back to the desktop image.',
      },
    },
    {
      name: 'objectPosition',
      type: 'text',
      defaultValue: 'center center',
      admin: {
        description:
          'CSS object-position, e.g. "center 42%". Only needed when the media focal point is not enough.',
      },
    },
  ],
})
