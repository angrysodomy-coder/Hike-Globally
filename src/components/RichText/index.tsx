import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import { LinkJSXConverter, RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'
import React from 'react'

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
})

/**
 * Renders Lexical JSON to React on the SERVER — no editor bundle reaches the
 * browser, which keeps ~300 KB of Lexical out of the client payload.
 *
 * Block converters (callout / tripCard / gallery) are intentionally absent:
 * only the Posts `content` field enables BlocksFeature, and the blog route has
 * not landed yet. They get added alongside it.
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
