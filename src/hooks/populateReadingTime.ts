import type { CollectionBeforeChangeHook } from 'payload'

type LexicalNode = { children?: LexicalNode[]; text?: string }

/**
 * Flattens a Lexical JSON tree to plain text.
 *
 * Lexical stores `{ root: { children: [...] } }`, where any node may carry a
 * `text` string and/or more `children`. Recursing over both covers paragraphs,
 * headings, list items, quotes and inline formatting without special-casing
 * node types — a bold run is just a child node with its own `text`.
 *
 * Exported because the search plugin and the OG-image generator need the same
 * conversion later.
 */
export const lexicalToPlainText = (node: unknown): string => {
  if (!node || typeof node !== 'object') return ''

  const typed = node as LexicalNode & { root?: LexicalNode }
  if (typed.root) return lexicalToPlainText(typed.root)

  const own = typeof typed.text === 'string' ? typed.text : ''
  const children = Array.isArray(typed.children)
    ? typed.children.map(lexicalToPlainText).join(' ')
    : ''

  return `${own} ${children}`.trim()
}

/**
 * 220 wpm is the usual adult silent-reading figure for non-technical prose.
 * It is a comfort signal on a card, not a measurement — do not agonise over it.
 */
const WORDS_PER_MINUTE = 220

/** Recomputes `readingTime` from the body on every save. */
export const populateReadingTime: CollectionBeforeChangeHook = ({ data }) => {
  if (!data?.content) return data

  const words = lexicalToPlainText(data.content).split(/\s+/).filter(Boolean).length

  return { ...data, readingTime: Math.max(1, Math.round(words / WORDS_PER_MINUTE)) }
}
