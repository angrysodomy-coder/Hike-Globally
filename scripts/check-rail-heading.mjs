/* Guards the Popular Treks rail card headings (TripsSection rail, `.trip-card--rail`).
 *
 * History: `.trip-card--rail h3` and the generic `.trip-card h3` have the same
 * specificity, and the generic rule sits later in styles.css, so it used to win and
 * the rail card titles rendered at 34-47px no matter what the rail rule said.
 * This check fails if the rail heading rule stops winning, or if its rendered size
 * is not 72.25% (two 15% reductions, i.e. -27.75%) of the generic trip-card
 * heading at each viewport.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../src/styles.css'), 'utf8')

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

/** Rules that size the heading of a rail card (last compound ends in `h3`). */
const railHeadingRules = (width) =>
  rules
    .filter((rule) => mediaApplies(rule.media, width))
    .flatMap((rule) => rule.selector.split(',').map((part) => part.trim())
      .filter((part) => /(^|[\s>+~])h3$/.test(part) && /\.trip-card/.test(part))
      .map((part) => ({ ...rule, part })))

const winner = (width) =>
  railHeadingRules(width).sort((a, b) => compareSpecificity(specificity(a.part), specificity(b.part)) || a.order - b.order).at(-1)

const genericSize = (width) => {
  /* The LAST `.trip-card h3` rule that applies wins the cascade (later media
   * overrides beat the base clamp), so the ratio is computed against the size
   * that actually renders at this width. */
  const generic = railHeadingRules(width).filter((rule) => rule.part === '.trip-card h3').at(-1)
  return generic?.decls.find((decl) => decl.prop === 'font-size')?.value
}

/** Resolve `clamp(min, Vvw, max)` (and plain px lengths) against a viewport width. */
const resolveSize = (value, width) => {
  const clamp = /clamp\(([^)]+)\)/.exec(value)
  if (!clamp) return Number.parseFloat(value)
  const [min, middle, max] = clamp[1].split(',').map((part) => part.trim())
  const toPx = (part) => {
    const vw = /^([\d.]+)vw$/.exec(part)
    if (vw) return (Number(vw[1]) * width) / 100
    return Number.parseFloat(part)
  }
  return Math.min(Math.max(toPx(min), toPx(middle)), toPx(max))
}

let failures = 0
const check = (label, actual, expected) => {
  const ok = typeof expected === 'function' ? expected(actual) : actual === expected
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${ok ? '' : ` (got ${JSON.stringify(actual)})`}`)
}

/* The rail heading keeps the same 72.25% (two 15% reductions) ratio to the
 * generic card heading on every breakpoint, including the <=620px phone
 * override (0.7225 x 28px = 20.23px — the old 10.8375px was unreadable). */
for (const width of [1920, 1440, 1024, 900, 700, 500, 380]) {
  const heading = winner(width)
  const railValue = heading?.decls.find((decl) => decl.prop === 'font-size')?.value
  const genericValue = genericSize(width)
  const railPx = resolveSize(railValue, width)
  const genericPx = resolveSize(genericValue, width)

  const label = `@${width}px`
  check(`${label} rail heading rule wins over .trip-card h3`, heading?.part ?? '(none)', (part) => /\.trip-card--rail/.test(String(part)))
  check(`${label} rail heading is 27.75% smaller than before`, Number(railPx.toFixed(3)), Number((genericPx * 0.7225).toFixed(3)))
}

const mobile = winner(500)
const mobilePx = resolveSize(mobile?.decls.find((decl) => decl.prop === 'font-size')?.value, 500)
check('@500px mobile rail override still wins', mobile?.part ?? '(none)', (part) => /\.trip-card--rail/.test(String(part)))
check('@500px mobile rail heading stays readable and compact', mobilePx, (px) => px >= 18 && px <= 24)

console.log(failures === 0 ? 'RAIL HEADING OK' : `RAIL HEADING FAILED (${failures})`)
process.exit(failures === 0 ? 0 : 1)
