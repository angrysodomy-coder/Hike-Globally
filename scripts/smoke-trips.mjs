/* Smoke test for the TripsSection horizontal-scroll rail.
 * Runs the real component in jsdom with stubbed geometry:
 * viewport 1344px, track 3000px -> distance 1656px; outer height 2556px, innerHeight 900 -> total 1656px.
 */
import { JSDOM } from 'jsdom'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'https://hike.example/',
})

const { window } = dom
globalThis.window = window
globalThis.document = window.document
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true })

globalThis.__scrollY = 0
const scrollCalls = []

globalThis.requestAnimationFrame = (cb) => window.requestAnimationFrame(cb)
globalThis.cancelAnimationFrame = (id) => window.cancelAnimationFrame(id)

Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => 1440 })
Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => 900 })
Object.defineProperty(window, 'scrollY', { configurable: true, get: () => globalThis.__scrollY })
window.scrollTo = (opts) => scrollCalls.push(opts)

window.matchMedia = (query) => ({
  matches: false,
  media: query,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
})

window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = window.ResizeObserver

window.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver = window.IntersectionObserver

const proto = window.Element.prototype
proto.scrollTo = function scrollTo(opts) { scrollCalls.push({ element: this.className, ...opts }) }

Object.defineProperty(proto, 'scrollWidth', {
  configurable: true,
  get() {
    if (this.classList.contains('trips-scroll__track') || this.classList.contains('trips-scroll__viewport')) return 3000
    return 800
  },
})
Object.defineProperty(proto, 'clientWidth', {
  configurable: true,
  get() {
    if (this.classList.contains('trips-scroll__viewport')) return 1344
    return 1344
  },
})
Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    if (this.classList.contains('trips-scroll')) return 2556
    return 100
  },
})

const origRect = proto.getBoundingClientRect
proto.getBoundingClientRect = function getBoundingClientRect() {
  if (this.classList.contains('trips-scroll')) {
    return { top: -globalThis.__scrollY, left: 0, right: 1440, bottom: 2556, width: 1440, height: 2556, x: 0, y: -globalThis.__scrollY }
  }
  if (this.classList.contains('trip-card--rail')) {
    return { top: 200, left: 300, right: 620, bottom: 700, width: 320, height: 500, x: 300, y: 200 }
  }
  return origRect.call(this)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let failures = 0
const check = (label, actual, expected) => {
  const ok = expected instanceof RegExp ? expected.test(String(actual)) : actual === expected
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${ok ? '' : ` (got ${JSON.stringify(actual)}, want ${expected})`}`)
}

require('./.smoke-bundle.cjs')
globalThis.__mountTrips()
await sleep(80)

const outer = document.querySelector('.trips-scroll')
const track = document.querySelector('.trips-scroll__track')
const cards = document.querySelectorAll('.trip-card--rail')
const dots = () => [...document.querySelectorAll('.trips-scroll__dots button')]
const counter = () => document.querySelector('.trips-controls > span').textContent.replace(/\s+/g, ' ')
const nextBtn = () => document.querySelector('.trips-controls button[aria-label="Next journeys"]')
const prevBtn = () => document.querySelector('.trips-controls button[aria-label="Previous journeys"]')
const fill = () => document.querySelector('.trips-scroll__line i')

check('renders 8 trip cards', cards.length, 8)
check('pin mode active on desktop', outer.classList.contains('is-pin'), true)
check('outer height carries scroll distance', outer.style.height, /1656px.*100svh|100svh.*1656px/)
check('two page dots', dots().length, 2)
check('counter starts 01/02', counter(), /01 \/ 02/)
check('prev disabled at start', prevBtn().disabled, true)
check('next enabled at start', nextBtn().disabled, false)

scrollCalls.length = 0
nextBtn().click()
await sleep(40)
check('next scrolls window to end of pin', scrollCalls[0]?.top, 1656)
check('next uses smooth behavior', scrollCalls[0]?.behavior, 'smooth')

globalThis.__scrollY = 1656
window.dispatchEvent(new window.Event('scroll'))
await sleep(120)
check('track translated full distance', track.style.transform, /translate3d\(-1656(\.00)?px, 0, 0\)/)
check('progress fill at 100%', fill().style.transform, 'scaleX(1)')
check('counter advances to 02/02', counter(), /02 \/ 02/)
check('next disabled at end', nextBtn().disabled, true)
check('second dot active', dots()[1].classList.contains('is-active'), true)
check('parallax var set on card', cards[0].style.getPropertyValue('--img-x') !== '', true)

globalThis.__scrollY = 414
window.dispatchEvent(new window.Event('scroll'))
await sleep(120)
check('mid-scroll transform at quarter', track.style.transform, /translate3d\(-414(\.00)?px, 0, 0\)/)

globalThis.__scrollY = 0
window.dispatchEvent(new window.Event('scroll'))
await sleep(120)
check('returns to start transform', track.style.transform, /translate3d\((0|-0)(\.00)?px, 0, 0\)/)
check('counter back to 01/02', counter(), /01 \/ 02/)

scrollCalls.length = 0
dots()[1].click()
await sleep(40)
check('dot navigation scrolls to end', scrollCalls[0]?.top, 1656)

/* ---- Phase 2: mobile rail fallback ---- */
let mobile = false
window.matchMedia = (query) => ({
  matches: mobile && query.includes('max-width'),
  media: query,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
})
Object.defineProperty(proto, 'scrollLeft', {
  configurable: true,
  get() { return globalThis.__scrollLeft || 0 },
})

mobile = true
window.dispatchEvent(new window.Event('resize'))
await sleep(100)
check('rail mode on mobile', outer.classList.contains('is-rail'), true)
check('pin height cleared', outer.style.height, '')
check('eight dots on mobile', dots().length, 8)

scrollCalls.length = 0
nextBtn().click()
await sleep(40)
check('next scrolls rail to next card', Math.round(scrollCalls[0]?.left ?? -1), Math.round(1656 / 7))

globalThis.__scrollLeft = 1656
document.querySelector('.trips-scroll__viewport').dispatchEvent(new window.Event('scroll'))
await sleep(120)
check('rail counter reaches 08/08', counter(), /08 \/ 08/)
check('rail fill at 100%', fill().style.transform, 'scaleX(1)')

console.log(failures === 0 ? 'SMOKE OK' : `SMOKE FAILED (${failures})`)
process.exit(failures === 0 ? 0 : 1)
