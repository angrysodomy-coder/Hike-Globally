import type { Tab } from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

/**
 * Drop-in SEO tab. Use the same one on every public collection so the fields
 * are named identically everywhere and `generateMeta()` stays generic.
 *
 * `name: 'meta'` nests everything under a `meta` group in the database, which
 * is what makes `doc.meta.title` work across Pages, Posts, Trips and
 * Destinations without per-collection special-casing.
 *
 * The plugin's field components are imported directly rather than letting
 * `seoPlugin({ collections: [...] })` inject them, because that gives us
 * control over tab placement and ordering.
 */
export const seoTab: Tab = {
  name: 'meta',
  label: 'SEO',
  fields: [
    // Live character counters with the Google-truncation thresholds marked.
    OverviewField({
      titlePath: 'meta.title',
      descriptionPath: 'meta.description',
      imagePath: 'meta.image',
    }),
    MetaTitleField({ hasGenerateFn: true }),
    MetaDescriptionField({ hasGenerateFn: true }),
    MetaImageField({ relationTo: 'media' }),
    // Renders an actual Google-result mock from the values above.
    PreviewField({
      hasGenerateFn: true,
      titlePath: 'meta.title',
      descriptionPath: 'meta.description',
    }),
  ],
}
