import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import { LinkJSXConverter, RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'
import React from 'react'

import type { CalloutBlock, GalleryBlock, TripCardBlock } from '@/payload-types'

import { CalloutBlockComponent } from '@/blocks/Callout/Component'
import { GalleryBlockComponent } from '@/blocks/Gallery/Component'
import { TripCardBlockComponent } from '@/blocks/TripCard/Component'
import { documentHref } from '@/lib/utils/documentHref'

/**
 * Resolve an internal link at RENDER time, from the relationship.
 *
 * This is the whole reason internal links are stored as a relationship rather
 * than as typed-in text. An editor renames `/trips/everest-base-camp` to
 * `/trips/ebc-classic` and every internal link in every article follows it on
 * the next revalidation. Hardcoded hrefs would all 404 silently.
 */
const internalDocToHref: Parameters<typeof LinkJSXConverter>[0]['internalDocToHref'] = ({
  linkNode,
}) => {
  const { relationTo, value } = linkNode.fields.doc ?? {}

  if (!relationTo) return '/'

  const slug = typeof value === 'object' && value && 'slug' in value ? String(value.slug) : null

  return documentHref(relationTo, slug)
}

/**
 * Left unparameterised on purpose. `JSXConvertersFunction`'s default type
 * argument is `DefaultNodeTypes | SerializedBlockNode | SerializedInlineBlockNode`;
 * narrowing it to `DefaultNodeTypes` alone makes the `blocks` key in
 * `defaultConverters` unassignable, because that key is a map of block slugs
 * rather than a single converter.
 */
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  /**
   * Block converters for the three blocks enabled inside Lexical.
   *
   * The `node` parameter has to be annotated explicitly: with the default
   * (wide) type argument on `JSXConvertersFunction`, the `blocks` map cannot
   * infer which block slug maps to which fields shape, so `node` falls back
   * to implicit `any` under `noImplicitAny`.
   */
  blocks: {
    callout: ({ node }: { node: { fields: CalloutBlock } }) => (
      <CalloutBlockComponent {...node.fields} />
    ),
    gallery: ({ node }: { node: { fields: GalleryBlock } }) => (
      <GalleryBlockComponent {...node.fields} />
    ),
    tripCard: ({ node }: { node: { fields: TripCardBlock } }) => (
      <TripCardBlockComponent {...node.fields} />
    ),
  },
})

/**
 * Renders Lexical JSON to React on the SERVER — no editor bundle reaches the
 * browser, which keeps ~300 KB of Lexical out of the client payload.
 */
export function RichText({
  className,
  data,
}: {
  className?: string
  data: null | SerializedEditorState | undefined
}) {
  if (!data) return null

  return <PayloadRichText className={className} converters={converters} data={data} />
}
