/* Guards the hero title treatment in src/components/Hero.jsx + src/styles.css.
 *
 * The hero heading is styled by several competing rules (`.hero h1`, the
 * `!important` `.hero__heading--cal` overrides, and per-breakpoint clamps), so a
 * plain edit of one rule silently loses on some screens. This check asserts, per
 * viewport, that:
 *   1. the winning h1 size is 85% of the size authored before the shrink,
 *   2. line 1 ("The world is waiting.") is still Cal Sans / upright,
 *   3. line 2 ("Go find your story.") wins with Instrument Serif + italic,
 *   4. the "01" badge next to "Start your journey" is gone from the markup and CSS.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../src/styles.css'), 'utf8')
const hero = readFileSync(resolve(here, '../src/components/Hero.jsx'), 'utf8')
const main = readFileSync(resolve(here, '../src/main.jsx'), 'utf8')

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

/** `:root` custom properties, so `var(--hero-title-scale)` can be resolved. */
const rootVars = new Map(
  rules
    .filter((rule) => rule.selector === ':root')
    .flatMap((rule) => rule.decls)
    .filter((decl) => decl.prop.startsWith('--'))
    .map((decl) => [decl.prop, decl.value]),
)

/** Drop the `!important` flag and report whether it was there. */
const splitImportant = (value) => ({
  important: /!important$/.test(value.trim()),
  value: value.replace(/\s*!important\s*$/, '').trim(),
})

/** Resolve `calc(<length|clamp(...)> * <number>)` against a viewport width. */
function resolveLength(value, width) {
  const calc = /^calc\(([\s\S]+)\)$/.exec(value.trim())
  if (calc) return resolveLength(calc[1], width)

  const product = /^([\s\S]+?)\s*\*\s*([\d.]+)$/.exec(value.trim())
  if (product) return resolveLength(product[1], width) * Number(product[2])

  const scaled = /^([\s\S]+?)\s*\*\s*var\((--[\w-]+)\)$/.exec(value.trim())
  if (scaled) {
    const factor = Number.parseFloat(rootVars.get(scaled[2]))
    return resolveLength(scaled[1], width) * factor
  }

  const clamp = /clamp\(([^)]+)\)/.exec(value)
  if (clamp) {
    const [min, middle, max] = clamp[1].split(',').map((part) => part.trim())
    const toPx = (part) => {
      const vw = /^([\d.]+)vw$/.exec(part)
      if (vw) return (Number(vw[1]) * width) / 100
      return Number.parseFloat(part)
    }
    return Math.min(Math.max(toPx(min), toPx(middle)), toPx(max))
  }

  const vw = /^([\d.]+)vw$/.exec(value.trim())
  if (vw) return (Number(vw[1]) * width) / 100
  return Number.parseFloat(value)
}

/**
 * Resolve the cascade for an element at a viewport width.
 * `selectors` is every compound rule that matches it (e.g. the h1 is matched by
 * both `.hero h1` and `.hero__heading--cal`), so `!important` + specificity +
 * document order decide exactly like a browser does.
 */
function winningDecl(selectors, prop, width) {
  const matches = new Set(selectors)
  const candidates = rules
    .filter((rule) => mediaApplies(rule.media, width))
    .flatMap((rule) => rule.selector.split(',').map((part) => part.trim())
      .filter((part) => matches.has(part))
      .map((part) => ({ selector: part, order: rule.order, decls: rule.decls })))
    .map((cand) => ({ ...cand, decl: cand.decls.find((d) => d.prop === prop) }))
    .filter((cand) => cand.decl)
    .map((cand) => ({ ...cand, ...splitImportant(cand.decl.value) }))

  const pick = (list) => list
    .sort((a, b) => compareSpecificity(specificity(a.selector), specificity(b.selector)) || a.order - b.order)
    .at(-1)

  return pick(candidates.filter((cand) => cand.important)) ?? pick(candidates)
}

let failures = 0
const check = (label, actual, expected) => {
  const ok = typeof expected === 'function' ? expected(actual) : actual === expected
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${ok ? '' : ` (got ${JSON.stringify(actual)})`}`)
}

/* Sizes authored for the hero title before the 15% shrink, as the winning rule
 * per breakpoint (`.hero__heading--cal` is `!important`, so it beats `.hero h1`
 * below 620px and the 380px override beats it below 380px). */
const H1 = ['.hero h1', '.hero__heading--cal']
const AUTHORED = [
  [1920, 'clamp(69px, 7.4vw, 124px)'],
  [1440, 'clamp(69px, 7.4vw, 124px)'],
  [1024, 'clamp(70px, 9.7vw, 102px)'],
  [900, 'clamp(70px, 9.7vw, 102px)'],
  [760, 'clamp(61px, 10.8vw, 84px)'],
  [600, 'clamp(46px, 13vw, 62px)'],
  [420, 'clamp(46px, 13vw, 62px)'],
  [375, '42px'],
  [360, '42px'],
]

check('--hero-title-scale is 0.85 (-15%)', rootVars.get('--hero-title-scale'), '0.85')

for (const [width, authored] of AUTHORED) {
  const applied = winningDecl(H1, 'font-size', width)
  const px = Number(resolveLength(applied.value, width).toFixed(3))
  const expected = Number((resolveLength(authored, width) * 0.85).toFixed(3))
  check(`@${width}px hero title is 15% smaller than ${authored}`, px, expected)
  check(`@${width}px shrink comes from the --hero-title-scale factor`, /var\(--hero-title-scale\)/.test(applied.value), true)
}

/* Typefaces: the `--cal` rules force family/style on the inner <i> of each line.
 * Line 2 carries both `hero__line` and `hero__line--italic`, so its cascade has
 * to be resolved across all four selectors. */
const LINE1 = ['.hero__line i', '.hero__heading--cal .hero__line i']
const LINE2 = [
  '.hero__line i',
  '.hero__line--italic i',
  '.hero__heading--cal .hero__line i',
  '.hero__heading--cal .hero__line--italic i',
]
const serifStack = rootVars.get('--serif') ?? ''

check('--serif leads with Instrument Serif', serifStack.startsWith("'Instrument Serif'"), true)

const line1Family = winningDecl(LINE1, 'font-family', 1440)
const line1Style = winningDecl(LINE1, 'font-style', 1440)
check('line 1 keeps the display sans', line1Family.value, 'var(--display)')
check('line 1 stays upright', line1Style.value, 'normal')

const line2Family = winningDecl(LINE2, 'font-family', 1440)
const line2Style = winningDecl(LINE2, 'font-style', 1440)
check('line 2 wins with Instrument Serif', line2Family.value, 'var(--serif)')
check('line 2 is italic, !important', `${line2Style.value}${line2Style.important ? ' !important' : ''}`, 'italic !important')
check('line 2 wins the cascade on every breakpoint', [1920, 1024, 600, 360].every((width) => winningDecl(LINE2, 'font-family', width).selector === '.hero__heading--cal .hero__line--italic i'), true)
check(
  'Instrument Serif italic is self-hosted (no FOUT substitute / fake oblique)',
  /@fontsource\/instrument-serif\/latin-400-italic\.css/.test(main),
  true,
)

/* The circled "01" beside "Start your journey" must stay removed. */
check('Hero markup has no numbered badge', /journey-finder__number/.test(hero), false)
check('styles.css has no .journey-finder__number rule', /\.journey-finder__number/.test(css), false)

console.log(failures === 0 ? 'HERO TITLE OK' : `HERO TITLE FAILED (${failures})`)
process.exit(failures === 0 ? 0 : 1)
