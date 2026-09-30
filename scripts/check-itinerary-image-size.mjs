/* Guards the half-size itinerary gallery on the single trip page.
 *
 * History: the full itinerary accordion rendered its three photographs across
 * the entire article column at a 16/7 aspect-ratio. On a 1440px screen that is
 * an ~880px-wide stage — each photograph ~290px wide and ~385px tall, taller
 * than the day's copy next to it. The strip was scaled to 50%: one custom
 * property, `--tsp-slide-scale`, drives the stage width, the gap between
 * photographs and (via the preserved aspect-ratio) the stage height, so every
 * photograph renders at exactly half its former width AND half its former
 * height. The source images are untouched, so the browser downsamples them and
 * they stay sharp.
 *
 * This check fails if the scale drifts away from 0.5, if the stage stops
 * deriving its width from it, if the aspect-ratio is hard-coded to something
 * other than 16/7 on desktop (which would squash the crops instead of scaling
 * them), or if the track/slide maths goes back to a fixed 10px gap — the last
 * one would leave the slides slightly off half size.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../src/styles/trip-single.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')

let failures = 0
const check = (label, ok) => {
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
}

/** Grab the declaration block of a rule, ignoring @media-nested copies. */
function ruleBody(selector, source = css) {
  const match = new RegExp(`(^|[},])\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{([^}]*)}`)
    .exec(source)
  return match ? match[2] : null
}

function declaration(body, prop) {
  if (!body) return null
  const match = new RegExp(`(?:^|;)\\s*${prop.replace(/[-]/g, '\\-')}\\s*:([^;]*)`).exec(body)
  return match ? match[1].trim() : null
}

const slider = ruleBody('.tsp-slider')
const stage = ruleBody('.tsp-slider__stage')
const track = ruleBody('.tsp-slider__track')
const slide = ruleBody('.tsp-slider__slide')

check('found the .tsp-slider rule', Boolean(slider))
check('found the .tsp-slider__stage rule', Boolean(stage))
check('found the .tsp-slider__track rule', Boolean(track))
check('found the .tsp-slider__slide rule', Boolean(slide))

const scaleValue = declaration(slider, '--tsp-slide-scale')
const scale = Number(scaleValue)
check(`--tsp-slide-scale is declared: ${scaleValue}`, scaleValue !== null)
check(`--tsp-slide-scale halves the gallery (0.5): ${scaleValue}`, scale === 0.5)

const maxWidth = declaration(slider, 'max-width')
check(
  `.tsp-slider width derives from the scale: ${maxWidth}`,
  Boolean(maxWidth) && maxWidth.includes('var(--tsp-slide-scale)') && maxWidth.includes('100%'),
)

check(
  '.tsp-slider stays anchored to the text column',
  declaration(slider, 'justify-self') === 'start',
)

/* The crops must not be squashed: keep the original desktop aspect-ratio so
 * halving the width halves the height by the same factor. */
check(
  `.tsp-slider__stage keeps the 16/7 crop: ${declaration(stage, 'aspect-ratio')}`,
  /^16\s*\/\s*7$/.test(declaration(stage, 'aspect-ratio') ?? ''),
)

const gap = declaration(slider, '--tsp-slide-gap')
check(
  `--tsp-slide-gap scales with the gallery: ${gap}`,
  Boolean(gap) && gap.includes('var(--tsp-slide-scale)'),
)

for (const [label, body, prop] of [
  ['track gap', track, 'gap'],
  ['track transform', track, 'transform'],
  ['slide flex basis', slide, 'flex'],
]) {
  const value = declaration(body, prop)
  check(
    `${label} uses the scaled gap, not a fixed 10px: ${value}`,
    Boolean(value) && value.includes('var(--tsp-slide-gap)') && !/\b10px\b/.test(value),
  )
}

/* Numeric proof, on the real desktop article column (~936px at 1440px wide):
 * a slide must come out at exactly half its pre-scale width and height. */
const BASE_GAP = 10
const COLUMN = 936
const slideWidth = (columnWidth, factor) =>
  ((columnWidth * factor) - (BASE_GAP * factor * 2)) / 3

const before = slideWidth(COLUMN, 1)
const after = slideWidth(COLUMN, scale)
check(
  `a slide is 50% narrower (${before.toFixed(1)}px → ${after.toFixed(1)}px)`,
  Math.abs(after / before - 0.5) < 1e-9,
)

const heightBefore = (COLUMN * 7) / 16
const heightAfter = (COLUMN * scale * 7) / 16
check(
  `a slide is 50% shorter (${heightBefore.toFixed(1)}px → ${heightAfter.toFixed(1)}px)`,
  Math.abs(heightAfter / heightBefore - 0.5) < 1e-9,
)

/* Phones show one photograph across a ~320px column; halving that would leave
 * a stamp, so the mobile gallery deliberately stays full width. */
const mobileBlock = /@media\s*\(max-width:\s*640px\)\s*{([\s\S]*?)\n}/.exec(css)?.[1] ?? ''
check(
  'phones keep the full-width gallery (scale 1)',
  /\.tsp-slider\s*{[^}]*--tsp-slide-scale:\s*1\s*;?[^}]*}/.test(mobileBlock),
)

/* Quality guard: the markup must keep pointing at the full-resolution source
 * files — shrinking the box is what reduces the size, not a smaller asset. */
const slider_jsx = readFileSync(resolve(here, '../src/components/trip/ItinerarySlider.jsx'), 'utf8')
check(
  'slides still render the original image source',
  /<img\s+src=\{image\.src\}/.test(slider_jsx),
)
check(
  'slides still cover their box (no letterboxing after the resize)',
  declaration(ruleBody('.tsp-slider__slide img'), 'object-fit') === 'cover',
)

console.log(failures === 0 ? 'ITINERARY IMAGE SIZE OK' : `ITINERARY IMAGE SIZE FAILED (${failures})`)
process.exit(failures === 0 ? 0 : 1)
