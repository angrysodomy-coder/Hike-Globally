import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { generateBlurDataURL } from '@/hooks/generateBlurDataURL'

/**
 * Concept — an upload collection. Adding an `upload` key turns an ordinary
 * collection into a file store. Payload then handles the multipart upload,
 * runs sharp to produce every size in `imageSizes`, and writes `url`,
 * `filename`, `width`, `height`, `mimeType` and a `sizes` object onto the
 * document automatically. You never declare those fields yourself.
 *
 * In production the files go to R2/S3 instead of disk via the `s3Storage`
 * plugin in `payload.config.ts`, which sets `disableLocalStorage` for you.
 * With no S3 bucket configured (local dev) they land in `/media`, which is
 * gitignored.
 */
export const Media: CollectionConfig<'media'> = {
  slug: 'media',

  // Payload 3.90 media folders. Turn this on now, not later: retrofitting
  // folder structure onto 400 loose assets is a manual afternoon.
  folders: true,

  admin: {
    group: 'Library',
    // Keeps media out of the rich-text internal-link picker; nobody wants to
    // link a paragraph to an image document. See src/fields/defaultLexical.ts.
    enableRichTextLink: false,
    defaultColumns: ['filename', 'alt', 'credit', 'updatedAt'],
    description:
      'Every image and video on the site. Alt text is required — it is read aloud by screen readers and it is SEO.',
  },

  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },

  /**
   * `defaultPopulate` controls which fields come back when this document is
   * *referenced* from another one. Without it, every trip query drags the
   * complete media document — including every size variant's metadata — for
   * every image in the gallery. On a 12-card trips index that is the
   * difference between a 40KB and a 900KB payload.
   */
  defaultPopulate: {
    url: true,
    alt: true,
    width: true,
    height: true,
    mimeType: true,
    filename: true,
    focalX: true,
    focalY: true,
    sizes: true,
    blurDataUrl: true,
  },

  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Describe what is in the photo for someone who cannot see it. "Prayer flags above Phoksundo lake" — not "image1".',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional visible caption, shown under the image where the layout supports it.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'credit',
          type: 'text',
          admin: { width: '50%', description: 'Photographer or source.' },
        },
        {
          name: 'licence',
          type: 'select',
          defaultValue: 'owned',
          admin: { width: '50%' },
          options: [
            { label: 'Owned / commissioned', value: 'owned' },
            { label: 'Licensed stock', value: 'stock' },
            { label: 'Creative Commons', value: 'cc' },
            { label: 'Guest submission (permission on file)', value: 'guest' },
          ],
        },
      ],
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        description: 'Where it was taken. Used for photo credits and internal search.',
      },
    },
    {
      // Named `blurDataUrl`, not `blurDataURL`. Payload derives column names by
      // splitting camelCase, and a run of capitals becomes one underscore each:
      // `blurDataURL` would land in Postgres as `blur_data_u_r_l`. `dbName` is
      // not available on scalar fields, so the field name is the only lever —
      // and renaming a column after the first production migration means
      // hand-writing the ALTER. Map it to next/image's `blurDataURL` prop in
      // the CMSImage component instead.
      name: 'blurDataUrl',
      type: 'text',
      admin: { hidden: true, readOnly: true },
    },
  ],

  hooks: {
    beforeChange: [generateBlurDataURL],
  },

  upload: {
    adminThumbnail: 'thumbnail',

    // Editors drag a point onto the image; `src/components/CMSImage` turns it
    // into `object-position` so a cropped hero never decapitates the climber.
    focalPoint: true,
    crop: true,

    mimeTypes: ['image/*', 'video/mp4', 'application/pdf'],

    // Converting every derivative to WebP halves the bytes before next/image
    // is even involved.
    formatOptions: { format: 'webp', options: { quality: 82 } },

    /**
     * These match real breakpoints on your site, not round numbers:
     *   thumbnail  — admin list view only
     *   card       — trips grid and journal cards
     *   feature    — itinerary-day photography
     *   hero       — full-bleed plates
     *   heroMobile — the 3:4 portrait crop your `-mobile.webp` assets already use
     *   og         — hard 1200x630 JPEG, because Facebook and LinkedIn scrapers
     *                still mishandle WebP
     *
     * Every size costs storage and upload time, so resist adding more. Widths
     * between these are handled by next/image on the fly.
     */
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768 },
      { name: 'feature', width: 1280 },
      { name: 'hero', width: 1920 },
      { name: 'heroMobile', width: 900, height: 1200, position: 'centre' },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
        formatOptions: { format: 'jpeg', options: { quality: 85 } },
      },
    ],
  },
}
