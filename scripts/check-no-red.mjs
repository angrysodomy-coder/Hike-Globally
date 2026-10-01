/**
 * Palette guard — the brand has no red.
 *
 * The accent used to be #e63946 (plus a deeper #c0263a for negative states).
 * Both were replaced by the ocean-teal accent (--clay / --tsp-clay) and the
 * ochre "unavailable" colour (--tsp-amber). This check walks every colour
 * literal the site ships — stylesheets and the colours inlined in components —
 * and fails if any of them lands back in the red family.
 *
 * "Red family" = hue within 28° of 0° (i.e. >= 332° or <= 28°) with enough
 * saturation and mid lightness to read as red on screen. Near-black, near-white
 * and the warm, desaturated sepias/sands the design uses are left alone.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOTS = ['src', 'index.html']
const EXTENSIONS = new Set(['.css', '.js', '.jsx', '.html'])

const HUE_WINDOW = 28 /* degrees either side of pure red */
const MIN_SATURATION = 0.12
const MIN_LIGHTNESS = 0.06
const MAX_LIGHTNESS = 0.97

let failures = 0

const check = (label, actual, expected = true) => {
  const ok = actual === expected
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${ok ? '' : ` (got ${actual})`}`)
}

/** Every file under `dir` whose extension we scan for colours. */
const walk = (dir) => {
  const out = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...walk(path))
    else if (EXTENSIONS.has(extname(path))) out.push(path)
  }
  return out
}

const toHsl = (r, g, b) => {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === rn) h = ((gn - bn) / d) % 6
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  h *= 60
  if (h < 0) h += 360
  return { h, s, l }
}

const isRed = (r, g, b) => {
  const { h, s, l } = toHsl(r, g, b)
  if (s < MIN_SATURATION) return false
  if (l <= MIN_LIGHTNESS || l >= MAX_LIGHTNESS) return false
  return h >= 360 - HUE_WINDOW || h <= HUE_WINDOW
}

/* #rgb / #rrggbb(aa) and rgb()/rgba() — the only colour notations in the repo. */
const HEX = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g
const RGB = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g
const NAMED = /\b(red|crimson|firebrick|indianred|darkred|tomato|orangered|maroon|salmon|lightcoral)\b\s*(?=[;,)}]|$)/gi

const offenders = []

for (const root of ROOTS) {
  const files = statSync(root).isDirectory() ? walk(root) : [root]
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    source.split('\n').forEach((line, index) => {
      const at = `${file}:${index + 1}`
      for (const match of line.matchAll(HEX)) {
        let hex = match[1]
        if (hex.length === 3) hex = [...hex].map((c) => c + c).join('')
        const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))
        if (isRed(r, g, b)) offenders.push(`${at} ${match[0]}`)
      }
      for (const match of line.matchAll(RGB)) {
        const [r, g, b] = [1, 2, 3].map((i) => Number(match[i]))
        if (isRed(r, g, b)) offenders.push(`${at} ${match[0]})`)
      }
      for (const match of line.matchAll(NAMED)) {
        offenders.push(`${at} ${match[0]}`)
      }
    })
  }
}

check(`no red colour literals ship anywhere${offenders.length ? `: ${offenders.join(', ')}` : ''}`, offenders.length, 0)

/* The tokens the red used to hide behind must stay non-red. */
const base = readFileSync('src/styles.css', 'utf8')
const single = readFileSync('src/styles/trip-single.css', 'utf8')
const token = (css, name) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim() ?? null

for (const [css, name] of [
  [base, 'clay'],
  [base, 'clay-bright'],
  [base, 'gold'],
  [single, 'tsp-clay'],
  [single, 'tsp-clay-deep'],
  [single, 'tsp-amber'],
]) {
  const value = token(css, name)
  check(`--${name} is declared: ${value}`, value !== null)
}

/* The left-rail "Book now" CTA is the loudest button on the site. */
const bookBtn = single.match(/\.tsp-bookBtn\s*\{[\s\S]*?\}/)?.[0] ?? ''
check('the Book now CTA keeps a gradient fill', /background:\s*linear-gradient/.test(bookBtn))
check('the Book now CTA is teal, not red', /#15a08f/i.test(bookBtn) && /#0f8378/i.test(bookBtn))

console.log(failures === 0 ? 'NO RED OK' : `${failures} FAILED`)
process.exit(failures === 0 ? 0 : 1)
