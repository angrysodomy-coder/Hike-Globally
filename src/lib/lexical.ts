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

/**
 * Extract paragraph strings from a Lexical richText node.
 */
export const lexicalToParagraphs = (data: unknown): string[] => {
  if (!data) return []
  if (typeof data === 'string') return data.split('\n\n').filter((p) => p.trim().length > 0)
  if (typeof data === 'object' && data !== null && 'root' in data) {
    const root = (data as { root?: { children?: Array<{ children?: Array<{ text?: string }> }> } }).root
    if (Array.isArray(root?.children)) {
      const paragraphs: string[] = []
      for (const node of root.children) {
        if (Array.isArray(node?.children)) {
          const text = node.children
            .map((c) => c?.text || '')
            .join('')
            .trim()
          if (text) paragraphs.push(text)
        }
      }
      if (paragraphs.length > 0) return paragraphs
    }
  }
  return []
}

/**
 * Convert Lexical data to a single plain text string.
 */
export const lexicalToPlainText = (data: unknown): string => {
  return lexicalToParagraphs(data).join('\n\n')
}

