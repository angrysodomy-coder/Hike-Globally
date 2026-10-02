/**
 * Shape of a richText field as emitted in payload-types.ts (structurally
 * identical to Lexical's SerializedEditorState, but with the index signatures
 * Payload's generated types use). Returning this type lets seed scripts pass
 * the result straight into payload.create() without casts.
 */
export type RichTextData = {
  [k: string]: unknown
  root: {
    type: string
    children: { [k: string]: unknown; type: string; version: number }[]
    direction: ('ltr' | 'rtl') | null
    format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | ''
    indent: number
    version: number
  }
}

/**
 * Convert plain text (paragraphs separated by blank lines) into Lexical
 * editor state for seeding richText fields from mock data.
 */
export const textToLexical = (text: string): RichTextData => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: text
      .split('\n\n')
      .filter((p) => p.trim().length > 0)
      .map((paragraph) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'text',
            text: paragraph.trim(),
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
      })),
  },
})
