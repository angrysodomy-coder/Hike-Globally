/* Guards the Popular Treks rail card width (--rail-card-w) against the
 * percentage-sizing regression that made the section invisible on phones,
 * tablets and small desktops.
 *
 * History: at <=1240px/--shell breakpoints, --shell was redefined with
 * percentages (`calc(100% - 44px)` etc.). --rail-card-w derives from --shell,
 * and the rail cards are flex items of a `width: max-content` track, so the
 * percentage resolved against the track itself — a circular sizing dependency.
 * Engines then collapsed the cards to zero-width slivers (or blew them up to
 * content width), leaving the Popular Treks section blank or unrecognisable
 * while the desktop (viewport-unit) layout kept working.
 *
 * This check fails if any --shell or --rail-card-w declaration that feeds the
 * rail resolves to a percentage-based length.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../src/styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

/** Collect { prop, value, media } for every custom-property declaration. */
function collectDeclarations(text) {
  const declarations = []
  const mediaStack = []
  let buffer = ''
  let selector = ''
  let decls = []

  for (const char of text) {
    if (char === '{') {
      const head = buffer.trim()
      buffer = ''
      if (head.startsWith('@media')) mediaStack.push(head.slice('@media'.length).trim())
      else if (!head.startsWith('@')) {
        selector = head
        decls = []
      }
      continue
    }
    if (char === '}') {
      buffer = ''
      if (selector) {
        for (const decl of decls) declarations.push({ ...decl, media: [...mediaStack] })
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
  return declarations
}

const declarations = collectDeclarations(css)

let failures = 0
const check = (label, ok) => {
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
}

const shellDeclarations = declarations.filter((decl) => decl.prop === '--shell')
check('found --shell declarations', shellDeclarations.length > 0)
for (const { value, media } of shellDeclarations) {
  const scope = media.length ? media.join(' + ') : 'base'
  check(
    `--shell (${scope}) is percentage-free: ${value}`,
    !/(^|[^\\w-])100\s*%/.test(value) && !value.includes('%'),
  )
}

const railWidthDeclarations = declarations.filter((decl) => decl.prop === '--rail-card-w')
check('found --rail-card-w declarations', railWidthDeclarations.length > 0)

/* The base formula must keep dividing the shell into exactly three cards with
 * (n - 1) gaps between them — PER_VIEW_DESKTOP in TripsSection.jsx relies on it. */
const base = railWidthDeclarations.find((decl) => decl.media.length === 0)
const match = /calc\(\(var\(--shell\)\s*-\s*(\d+)\s*\*\s*var\(--rail-gap\)\)\s*\/\s*(\d+)\)/.exec(base?.value ?? '')
check('base --rail-card-w divides the shell into 3 columns', match && Number(match[2]) === 3)
check('base --rail-card-w leaves a gap between each pair', match && Number(match[1]) === 2)

for (const { value, media } of railWidthDeclarations) {
  const scope = media.length ? media.join(' + ') : 'base'
  check(`--rail-card-w (${scope}) is percentage-free: ${value}`, !value.includes('%'))
}

/* Media-scoped rail widths must carry a px floor so the cards can never
 * collapse, whatever an engine does with the calc chain. */
for (const { value, media } of railWidthDeclarations) {
  if (!media.length) continue
  check(`--rail-card-w (${media.join(' + ')}) has a px floor: ${value}`, /max\(\s*\d+px/.test(value))
}

console.log(failures === 0 ? 'RAIL WIDTH OK' : `RAIL WIDTH FAILED (${failures})`)
process.exit(failures === 0 ? 0 : 1)
