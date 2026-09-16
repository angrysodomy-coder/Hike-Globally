import { Fragment } from 'react'

/* The journal article "Best Summer Treks For Family in Nepal For Beginners" is
 * rendered straight from the markdown file at the repository root — see
 * SummerFamilyTreksBlog.jsx, which imports that file with `?raw`. Nothing in the
 * article is rewritten: this module only turns markdown syntax into elements.
 * scripts/check-blog-content.mjs fails the build if the rendered text drifts
 * from the source file by a single character. */

export const ARTICLE_TITLE = 'Best Summer Treks For Family in Nepal For Beginners'

/** `**bold**` and backslash escapes -> plain text (for TOC labels and anchor ids). */
export const stripInline = (text) =>
  text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\\([\s\S])/g, '$1').trim()

export const slugify = (text) =>
  stripInline(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Inline markdown -> React nodes. Only the two constructs the article uses are
 * handled (`**bold**`, `\.` escapes); every other character passes through
 * untouched, including the en dashes and curly quotes in the source.
 */
export function renderInline(text, keyBase) {
  const nodes = []
  const pattern = /\*\*([^*]+)\*\*|\\([\s\S])/g
  let cursor = 0
  let match
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index))
    if (match[1] !== undefined) {
      nodes.push(
        <strong key={`${keyBase}-${key}`}>{renderInline(match[1], `${keyBase}-${key}`)}</strong>,
      )
    } else {
      nodes.push(match[2])
    }
    cursor = match.index + match[0].length
    key += 1
  }
  if (cursor < text.length) nodes.push(text.slice(cursor))

  return <Fragment>{nodes}</Fragment>
}

const isTableRow = (line) => line.startsWith('|')
const isListItem = (line) => /^\*\s+/.test(line)
const isHeading = (line) => /^#{1,6}(\s|$)/.test(line)

const splitRow = (row) => row.split('|').slice(1, -1).map((cell) => cell.trim())
const isDividerRow = (cells) => cells.every((cell) => /^:?-{3,}:?$/.test(cell))

/**
 * Markdown -> block list. The article only uses headings, paragraphs, `*` lists
 * and pipe tables; blank lines separate blocks exactly as written.
 */
export function parseMarkdown(markdown) {
  const lines = markdown.split('\n')
  const blocks = []
  let index = 0

  while (index < lines.length) {
    const trimmed = lines[index].trimEnd().trim()

    if (trimmed === '') {
      index += 1
      continue
    }

    const heading = /^(#{1,6})\s*(.*)$/.exec(trimmed)
    if (heading) {
      const content = heading[2].trim()
      /* The source has one empty `## ` line; it carries no content to render. */
      if (content) {
        blocks.push({
          type: `h${heading[1].length}`,
          content,
          id: heading[1].length === 2 ? slugify(content) : undefined,
        })
      }
      index += 1
      continue
    }

    if (isTableRow(trimmed)) {
      const rows = []
      while (index < lines.length && isTableRow(lines[index].trim())) {
        const cells = splitRow(lines[index].trim())
        if (!isDividerRow(cells)) rows.push(cells)
        index += 1
      }
      blocks.push({ type: 'table', rows })
      continue
    }

    if (isListItem(trimmed)) {
      const items = []
      while (index < lines.length && isListItem(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\*\s+/, ''))
        index += 1
      }
      blocks.push({ type: 'list', items })
      continue
    }

    const parts = [trimmed]
    index += 1
    while (index < lines.length) {
      const next = lines[index].trim()
      if (next === '' || isHeading(next) || isTableRow(next) || isListItem(next)) break
      parts.push(next)
      index += 1
    }
    blocks.push({ type: 'paragraph', content: parts.join(' ') })
  }

  return blocks
}
