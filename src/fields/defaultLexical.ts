import {
  BlockquoteFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
  type LinkFields,
} from '@payloadcms/richtext-lexical'

/**
 * Concept — Lexical. Payload 3's rich text is Lexical (Meta's editor). It
 * stores a JSON tree, not HTML or Markdown. That is deliberate: JSON is
 * queryable, diffable for version history, and can embed your own Payload
 * blocks inline (a CTA, a trip card, a map) that render as real React
 * components rather than `dangerouslySetInnerHTML`.
 *
 * Define the feature set once here and point `editor:` at it in
 * `payload.config.ts`, so every `richText` field on the site inherits the same
 * toolbar. Individual fields can still override with their own
 * `lexicalEditor({ features: ({ rootFeatures }) => [...] })` when they need
 * more or less.
 *
 * What is deliberately NOT enabled:
 *   - H1: exactly one per page, and it is the document title, not body copy.
 *   - Text colour / font size: editors reaching for these means the design
 *     system has a gap. Fix the gap instead.
 *   - Tables: they do not work on a 390px viewport.
 */
export const defaultLexical = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    HorizontalRuleFeature(),

    UploadFeature({
      collections: {
        media: {
          // Extra fields stored on the *usage* of the image inside this
          // document, not on the media library item itself — so the same photo
          // can be full-bleed in one post and inset in another.
          fields: [
            { name: 'caption', type: 'text' },
            {
              name: 'size',
              type: 'select',
              defaultValue: 'full',
              options: [
                { label: 'Full bleed', value: 'full' },
                { label: 'Inset', value: 'inset' },
                { label: 'Half width', value: 'half' },
              ],
            },
          ],
        },
      },
    }),

    /**
     * Internal links are stored as relationships, so they survive slug
     * changes — rename a trip and every link to it follows.
     *
     * `enabledCollections` is deliberately NOT passed. Hardcoding
     * `['pages', 'posts', 'trips', 'destinations']` makes Payload throw
     * `InvalidFieldRelationship` at boot for any collection that is not
     * registered yet, which breaks the admin during an incremental rollout
     * like this one.
     *
     * Instead, each collection opts itself out with
     * `admin.enableRichTextLink: false` (see Media and Users). Payload then
     * derives the linkable set from the registered collections, so new content
     * collections become linkable the moment they are added, and there is no
     * second list to keep in sync.
     */
    LinkFeature({
      fields: ({ defaultFields }) => [
        ...defaultFields.filter((field) => !('name' in field) || field.name !== 'url'),
        {
          name: 'url',
          type: 'text',
          label: 'URL',
          required: true,
          admin: {
            condition: (_data, siblingData) => siblingData?.linkType !== 'internal',
          },
          // Cast required: Payload's generic field `validate` signature is
          // wider than the link-field sibling shape the plugin actually passes.
          validate: ((
            value: string | null | undefined,
            options: { siblingData: Partial<LinkFields> },
          ) => {
            if (options?.siblingData?.linkType === 'internal') return true
            return value ? true : 'URL is required'
          }) as never,
        },
      ],
    }),

    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})
