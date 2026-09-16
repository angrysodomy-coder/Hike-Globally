/* Guards the clearance between the Popular Treks rail card meta row and its
 * "View this trip" CTA (TripsSection rail, `.trip-card--rail`).
 *
 * History: the rail card body is a flex column and `.trip-card--rail
 * .trip-card__link` is bottom-anchored with `margin-top: auto`. An auto margin
 * only absorbs *free* space, and on the tallest card in the rail the body has
 * none, so the CTA rendered flush against the Duration/Difficulty/From row with
 * 0px between the two. The meta row now carries a `margin-bottom` floor (flex
 * margins do not collapse) and the auto margin adds any leftover space on top.
 *
 * This check fails if the CTA loses its bottom anchoring, if the rail meta row
 * stops declaring a `margin-bottom` floor, or if that floor resolves below the
 * minimum clearance at any breakpoint.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../src/styles.css'), 'utf8')

/* Smallest gap the CTA is allowed to have above it, and the point at which the
 * clearance would start to crowd the card instead of breathing. */
const MIN_CLEARANCE = 16
const MAX_CLEARANCE = 40

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
  (selector.match(/\.[\w-]+/g) || []).length + (selector.match(/\[[^\]]+\]/g) || []).length,
  (selector.match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) || []).length,
]
const compareSpecificity = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

/** The rule that wins the cascade for one selector part at this width. */
const winner = (partTest, width) =>
  rules
    .filter((rule) => mediaApplies(rule.media, width))
    .flatMap((rule) => rule.selector.split(',').map((part) => part.trim())
      .filter((part) => partTest(part))
      .map((part) => ({ ...rule, part })))
    .sort((a, b) => compareSpecificity(specificity(a.part), specificity(b.part)) || a.order - b.order)
    .at(-1)

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

/** Resolve a CSS length (`clamp`/`min`/`max`, px and viewport units) to px. */
function resolveLength(value, { width, height }) {
  const text = value.trim()
  if (/^0(px)?$/.test(text)) return 0

  const fn = /^(clamp|min|max)\(([\s\S]*)\)$/.exec(text)
  if (fn) {
    const args = splitArgs(fn[2]).map((arg) => resolveLength(arg, { width, height }))
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
  if (unit === 'vw') return (amount * width) / 100
  return (amount * height) / 100
}

/** The bottom component of a `margin` shorthand, or null if it is not one. */
function shorthandBottom(value) {
  const parts = value.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  if (parts.length === 2 || parts.length === 3) return parts[1]
  if (parts.length === 4) return parts[2]
  return null
}

/** Bottom margin declared by the winning rule, resolved to px (null = unknown). */
function marginBottomPx(rule, view) {
  const longhand = rule.decls.find((decl) => decl.prop === 'margin-bottom')
  if (longhand) return resolveLength(longhand.value, view)
  const shorthand = rule.decls.find((decl) => decl.prop === 'margin')
  if (!shorthand) return null
  const bottom = shorthandBottom(shorthand.value)
  return bottom === null ? null : resolveLength(bottom, view)
}

let failures = 0
const check = (label, actual, expected) => {
  const ok = typeof expected === 'function' ? expected(actual) : actual === expected
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${ok ? '' : ` (got ${JSON.stringify(actual)})`}`)
}

const isRailMeta = (part) => /\.trip-card--rail\s+\.trip-card__meta$/.test(part)
const isRailCta = (part) => /\.trip-card--rail\s+\.trip-card__link$/.test(part)

/* 1024+ keeps the pinned rail, 1023 and below the swipeable one; both share the
 * same card body, so the clearance has to hold on every breakpoint. */
for (const width of [1920, 1440, 1024, 900, 700, 500, 380]) {
  const view = { width, height: 900 }
  const label = `@${width}px`

  const cta = winner(isRailCta, width)
  check(
    `${label} rail CTA stays bottom-anchored (margin-top: auto)`,
    cta?.decls.find((decl) => decl.prop === 'margin-top')?.value ?? '(none)',
    'auto',
  )

  const meta = winner(isRailMeta, width)
  const clearance = meta ? marginBottomPx(meta, view) : null
  check(
    `${label} rail meta row declares a resolvable margin-bottom floor: ${meta?.decls.find((d) => /^margin(-bottom)?$/.test(d.prop))?.value ?? '(none)'}`,
    clearance,
    (px) => typeof px === 'number' && px >= MIN_CLEARANCE && px <= MAX_CLEARANCE,
  )
}

/* The rail meta rule must be the one that actually applies: if a later or more
 * specific rule ever zeroes the floor, the CTA is flush against the text again. */
const baseMeta = winner(isRailMeta, 1440)
check('rail meta rule that wins the cascade is the rail-scoped one', baseMeta?.part ?? '(none)', (part) =>
  /\.trip-card--rail\s+\.trip-card__meta$/.test(String(part)))

console.log(failures === 0 ? 'RAIL CTA GAP OK' : `RAIL CTA GAP FAILED (${failures})`)
process.exit(failures === 0 ? 0 : 1)
