/* Guards the vertical rhythm of the single blog page (src/styles/blog.css).
 *
 * History: the article used to space itself with one rule,
 * `.blog-article > * + * { margin-top: 32px }`, while `.blog-article p` reset
 * every paragraph to `margin: 0`. Adjacent margins collapse in block flow, so a
 * block only ever got room on ONE side: the opening paragraph sat flush under
 * the hero, the closing paragraph sat flush against the end card, and two
 * consecutive paragraphs were 32px apart.
 *
 * The rhythm is now symmetric and additive: every top-level block declares the
 * gap it keeps above AND below itself (`margin-block: var(--blog-space)`), and
 * `.blog-article` is a single-column grid, where margins never collapse, so both
 * sides are always paid for. Two consecutive paragraphs are therefore 64px apart
 * (32 + 32); a list or a table keeps its own, larger side; and the paragraph
 * under a heading gives up its top gap so headings stay with their copy.
 *
 * This check fails if a paragraph loses its gap on either side, if the article
 * stops being a grid (which would collapse those gaps away), if a list or table
 * stops getting more room than plain copy, or if the documented heading totals
 * stop matching the tokens they are built from.
 *
 * Run with: node scripts/check-blog-paragraph-gap.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../src/styles/blog.css'), 'utf8')

/* The smallest and largest gap a block may keep on one of its own sides: small
 * enough that copy never sits flush, large enough that a column of paragraphs
 * stays an article and not a wall of whitespace. */
const MIN_SIDE = 20
const MAX_SIDE = 40

const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '')

/** Collect `{ selector, media, decls, order }` for every rule, in document order. */
function collectRules(text) {
  const rules = []
  const mediaStack = []
  let order = 0
  let buffer = ''
  let selector = ''
  let decls = []

  for (const char of stripComments(text)) {
    if (char === '{') {
      const head = buffer.trim()
      buffer = ''
      if (head.startsWith('@media')) {
        mediaStack.push(head.slice('@media'.length).trim())
      } else if (head.startsWith('@')) {
        mediaStack.push('@other')
      } else {
        selector = head
        decls = []
      }
      continue
    }
    if (char === '}') {
      buffer = ''
      if (selector) {
        rules.push({ selector, media: mediaStack.filter((m) => m !== '@other'), decls, order: order++ })
        selector = ''
      } else {
        mediaStack.pop()
      }
      continue
    }
    if (char === ';' && selector) {
      const [prop, ...rest] = buffer.split(':')
      if (rest.length) decls.push({ prop: prop.trim(), value: rest.join(':').trim() })
      buffer = ''
      continue
    }
    buffer += char
  }
  return rules
}

const rules = collectRules(css)

const mediaApplies = (media, width) =>
  media.every((query) => query.split(',').some((part) => {
    const max = /max-width:\s*(\d+)px/.exec(part)
    const min = /min-width:\s*(\d+)px/.exec(part)
    return (!max || width <= Number(max[1])) && (!min || width >= Number(min[1]))
  }))

const specificity = (selector) => [
  (selector.match(/#[\w-]+/g) || []).length,
  (selector.match(/\.[\w-]+/g) || []).length + (selector.match(/\[[^[\]]+\]/g) || []).length,
  (selector.match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) || []).length,
]
const compareSpecificity = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

/** Split a selector list on top-level commas only — `:is(h2, h3)` keeps its own. */
function splitSelectorList(selector) {
  const parts = []
  let depth = 0
  let buffer = ''
  for (const char of selector) {
    if (char === '(' || char === '[') depth += 1
    if (char === ')' || char === ']') depth -= 1
    if (char === ',' && depth === 0) {
      parts.push(buffer.trim())
      buffer = ''
      continue
    }
    buffer += char
  }
  parts.push(buffer.trim())
  return parts.filter(Boolean)
}

/** Every declaration that can reach one of the article's blocks, cascade order. */
function matchingRules(partTest, width) {
  return rules
    .filter((rule) => mediaApplies(rule.media, width))
    .flatMap((rule) => splitSelectorList(rule.selector)
      .filter(partTest)
      .map((part) => ({ decls: rule.decls, part, order: rule.order, spec: specificity(part) })))
    .sort((a, b) => compareSpecificity(a.spec, b.spec) || a.order - b.order)
}

/** Split a function's arguments on top-level commas. */
function splitArgs(text) {
  const args = []
  let depth = 0
  let buffer = ''
  for (const char of text) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (char === ',' && depth === 0) {
      args.push(buffer.trim())
      buffer = ''
      continue
    }
    buffer += char
  }
  args.push(buffer.trim())
  return args
}

/** Custom properties `.blog-article` sets at this width (the media override wins). */
function articleTokens(width) {
  const tokens = new Map()
  for (const rule of rules) {
    if (!mediaApplies(rule.media, width)) continue
    if (!splitSelectorList(rule.selector).includes('.blog-article')) continue
    for (const decl of rule.decls) {
      if (decl.prop.startsWith('--')) tokens.set(decl.prop, decl.value)
    }
  }
  return tokens
}

/** Resolve a CSS length (`var()`, `clamp`/`min`/`max`, px and viewport units) to px. */
function resolveLength(raw, view, tokens, seen = new Set()) {
  const text = String(raw).trim()

  const varFn = /^var\((--[\w-]+)(?:\s*,\s*([\s\S]*))?\)$/.exec(text)
  if (varFn) {
    if (seen.has(varFn[1])) return null
    const value = tokens.get(varFn[1]) ?? varFn[2]
    if (value === undefined) return null
    return resolveLength(value, view, tokens, new Set([...seen, varFn[1]]))
  }

  if (/^auto$/.test(text)) return null

  const fn = /^(clamp|min|max)\(([\s\S]*)\)$/.exec(text)
  if (fn) {
    const args = splitArgs(fn[2]).map((arg) => resolveLength(arg, view, tokens, seen))
    if (args.some((arg) => arg === null)) return null
    if (fn[1] === 'clamp') return Math.min(Math.max(args[0], args[1]), args[2])
    if (fn[1] === 'min') return Math.min(...args)
    return Math.max(...args)
  }

  const length = /^(-?[\d.]+)(px|vw|vh|svh|dvh|lvh)?$/.exec(text)
  if (!length) return null
  const amount = Number(length[1])
  const unit = length[2] ?? 'px'
  if (unit === 'px') return amount
  if (unit === 'vw') return (amount * view.width) / 100
  return (amount * view.height) / 100
}

/**
 * The winning top/bottom margin of a block after the whole cascade, in px.
 * Shorthands are folded in the order the cascade applies them, exactly as a
 * browser would.
 */
function blockSides(partTest, width) {
  const view = { width, height: 900 }
  const tokens = articleTokens(width)
  const read = (value) => resolveLength(value, view, tokens)
  const sides = { top: 0, bottom: 0 }

  for (const rule of matchingRules(partTest, width)) {
    for (const decl of rule.decls) {
      const parts = decl.value.trim().split(/\s+/)
      switch (decl.prop.toLowerCase()) {
        case 'margin':
          if (parts.length === 1 || parts.length === 2) {
            sides.top = read(parts[0])
            sides.bottom = read(parts[0])
          } else if (parts.length >= 3) {
            sides.top = read(parts[0])
            sides.bottom = read(parts[parts.length === 3 ? 2 : 2])
          }
          break
        case 'margin-block':
          sides.top = read(parts[0])
          sides.bottom = read(parts[1] ?? parts[0])
          break
        case 'margin-block-start': sides.top = read(decl.value); break
        case 'margin-block-end': sides.bottom = read(decl.value); break
        case 'margin-top': sides.top = read(decl.value); break
        case 'margin-bottom': sides.bottom = read(decl.value); break
        default: break
      }
    }
  }
  return sides
}

let failures = 0
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const check = (label, actual, expected) => {
  const ok = typeof expected === 'function' ? expected(actual) : same(actual, expected)
  if (!ok) failures += 1
  const want = typeof expected === 'function' ? `a value between ${MIN_SIDE} and ${MAX_SIDE}` : JSON.stringify(expected)
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${ok ? '' : ` (got ${JSON.stringify(actual)}, want ${want})`}`)
}

/* ---------- Which selector reaches which block the renderer emits ---------- */
const isBase = (part) => part === '.blog-article > *'
const isParagraph = (part) => part === '.blog-article p'
const isUnderHeading = (part) => part === '.blog-article > :is(h2, h3, h4, h5, h6) + p'
const isListOwn = (part) => part === '.blog-article > ul'
const isListType = (part) => part === '.blog-article ul'
const isTableOwn = (part) => part === '.blog-article > .blog-table-wrap'
const isH2 = (part) => part === '.blog-article h2'
const isH3 = (part) => part === '.blog-article h3'
const isH4 = (part) => part === '.blog-article h4'
const or = (...tests) => (part) => tests.some((test) => test(part))

const PARA = or(isBase, isParagraph)
const PARA_UNDER_HEADING = or(isBase, isParagraph, isUnderHeading)
const LIST = or(isBase, isListOwn, isListType)
const TABLE = or(isBase, isTableOwn)
const H2 = or(isBase, isH2)
const H3 = or(isBase, isH3)
const H4 = or(isBase, isH4)

/* 1023px and below swap the contents rail for a stacked one; 620px and below
 * retune the rhythm tokens. Both sides of a gap must hold at every width. */
const VIEWS = [
  { width: 1440, label: 'desktop 1440', space: 32, list: 42, table: 36, section: 72, h3Gap: 48, h4Gap: 40, h2Below: 26, h3Below: 16, h4Below: 12 },
  { width: 1024, label: 'laptop 1024', space: 32, list: 42, table: 36, section: 72, h3Gap: 48, h4Gap: 40, h2Below: 26, h3Below: 16, h4Below: 12 },
  { width: 768, label: 'tablet 768', space: 32, list: 42, table: 36, section: 72, h3Gap: 48, h4Gap: 40, h2Below: 26, h3Below: 16, h4Below: 12 },
  { width: 620, label: 'phone 620', space: 26, list: 34, table: 30, section: 56, h3Gap: 38, h4Gap: 32, h2Below: 20, h3Below: 12, h4Below: 12 },
  { width: 380, label: 'phone 380', space: 26, list: 34, table: 30, section: 56, h3Gap: 38, h4Gap: 32, h2Below: 20, h3Below: 12, h4Below: 12 },
]

for (const view of VIEWS) {
  const { width, label } = view

  /* --- 1. every paragraph keeps a gap above AND below it --- */
  const para = blockSides(PARA, width)
  check(`${label}: gap above a paragraph`, para.top, view.space)
  check(`${label}: gap below a paragraph`, para.bottom, view.space)
  for (const [side, px] of [['above', para.top], ['below', para.bottom]]) {
    check(`${label}: the gap ${side} a paragraph is real (${MIN_SIDE}-${MAX_SIDE}px)`, px, (value) =>
      typeof value === 'number' && value >= MIN_SIDE && value <= MAX_SIDE)
  }

  /* --- 2. nothing renders flush: the first block keeps its top gap, the last its bottom --- */
  check(`${label}: opening paragraph is not flush under the hero`, para.top, view.space)
  check(`${label}: closing paragraph is not flush against the end card`, para.bottom, view.space)

  /* --- 3. two consecutive paragraphs land at the sum of both sides --- */
  check(`${label}: paragraph -> paragraph gap`, para.top + para.bottom, view.space * 2)

  /* --- 4. lists and tables keep more room than plain copy, on both sides --- */
  const list = blockSides(LIST, width)
  check(`${label}: bullet list gap above and below`, [list.top, list.bottom], [view.list, view.list])
  const table = blockSides(TABLE, width)
  check(`${label}: table gap above and below`, [table.top, table.bottom], [view.table, view.table])

  /* --- 5. a heading stays with the copy it introduces --- */
  const paraUnderHeading = blockSides(PARA_UNDER_HEADING, width)
  check(`${label}: paragraph under a heading adds no top gap of its own`, paraUnderHeading.top, 0)
  check(`${label}: paragraph under a heading still keeps its gap below`, paraUnderHeading.bottom, view.space)

  const h2 = blockSides(H2, width)
  const h3 = blockSides(H3, width)
  const h4 = blockSides(H4, width)
  check(`${label}: space before an H2 section`, h2.top + view.space, view.section)
  check(`${label}: space before an H3`, h3.top + view.space, view.h3Gap)
  check(`${label}: space before an H4`, h4.top + view.space, view.h4Gap)
  check(`${label}: H2 -> its paragraph`, h2.bottom + paraUnderHeading.top, view.h2Below)
  check(`${label}: H3 -> its paragraph`, h3.bottom + paraUnderHeading.top, view.h3Below)
  check(`${label}: H4 -> its paragraph`, h4.bottom + paraUnderHeading.top, view.h4Below)

  /* A list under a heading keeps its own roomy top gap instead of collapsing
   * into the heading's margin-bottom. */
  check(`${label}: list under an H3 keeps its own top gap`, list.top, view.list)
}

/* ---------- 6. the mechanism that makes both sides count ---------- */
const articleRule = rules.find((rule) => rule.selector.trim() === '.blog-article')
check(
  'the article column is a grid (block margins would collapse both sides away)',
  articleRule?.decls.some((decl) => decl.prop === 'display' && decl.value === 'grid'),
  true,
)
check(
  'its single column cannot be widened by a wide table',
  articleRule?.decls.some((decl) => decl.prop === 'grid-template-columns' && /minmax\(0,\s*1fr\)/.test(decl.value)),
  true,
)

const baseRule = rules.find((rule) => rule.selector.trim() === '.blog-article > *')
check('the base rhythm sets both sides (margin-block), not margin-top alone', baseRule?.decls.some((decl) => decl.prop === 'margin-block'), true)
check('the base rhythm is token-driven, so every breakpoint retunes it',
  baseRule?.decls.find((decl) => decl.prop === 'margin-block')?.value, 'var(--blog-space)')

/* The old `margin: 0` resets are what stole the gap; on the blocks the renderer
 * emits only INLINE offsets may be reset, never vertical ones. */
const offenders = rules
  .filter((rule) => splitSelectorList(rule.selector)
    .some((part) => /^\.blog-article\s+(p|ul|blockquote|\.blog-table-wrap)$/.test(part)))
  .flatMap((rule) => rule.decls
    .filter((decl) => /^margin(-(block|block-start|block-end|top|bottom))?$/.test(decl.prop))
    .map((decl) => `${rule.selector.trim()} { ${decl.prop}: ${decl.value} }`))
check('no paragraph/list/table rule zeroes a vertical margin', offenders, [])

console.log(failures === 0 ? 'BLOG PARAGRAPH GAP OK' : `BLOG PARAGRAPH GAP FAILED (${failures})`)
process.exit(failures === 0 ? 0 : 1)
