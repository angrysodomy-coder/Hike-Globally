/* Smoke test for the /destinations landing page.
 * Mounts the real <App /> inside <RouterProvider /> at the `/destinations` URL in
 * jsdom (no pin-mode geometry, so the GSAP horizontal pin is intentionally inert)
 * and asserts the page renders, the explorer filters, the FAQ toggles, and the
 * router can return home without a remount error.
 */
import { JSDOM } from 'jsdom'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'https://hike.example/destinations',
})

const { window } = dom
globalThis.window = window
globalThis.document = window.document
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true })

window.matchMedia = (query) => ({
  matches: false,
  media: query,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
})
globalThis.matchMedia = window.matchMedia

window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
globalThis.ResizeObserver = window.ResizeObserver

window.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver = window.IntersectionObserver

globalThis.requestAnimationFrame = (cb) => window.requestAnimationFrame(cb)
globalThis.cancelAnimationFrame = (id) => window.cancelAnimationFrame(id)
globalThis.getComputedStyle = (el, pseudo) => window.getComputedStyle(el, pseudo)
globalThis.HTMLElement = window.HTMLElement
globalThis.Element = window.Element
/* jsdom's HTMLMediaElement.play() returns undefined; return a resolved promise. */
window.HTMLMediaElement.prototype.play = function play() { return Promise.resolve() }
window.HTMLMediaElement.prototype.pause = function pause() {}

window.scrollTo = () => {}
const proto = window.Element.prototype
proto.scrollTo = function scrollTo() {}
proto.scrollIntoView = function scrollIntoView() {}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let failures = 0
const check = (label, actual, expected) => {
  const ok = expected instanceof RegExp ? expected.test(String(actual)) : actual === expected
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${ok ? '' : ` (got ${JSON.stringify(actual)}, want ${expected})`}`)
}

require('./.smoke-dest-bundle.cjs')
globalThis.__mountApp()
await sleep(500)

const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => [...document.querySelectorAll(sel)]

check('renders destinations hero', !!$('.dp-hero'), true)
check('hero title present', $('.dp-hero__title')?.textContent.replace(/\s+/g, ' ').includes('Five regions.'), true)
check('renders marquee', !!$('.dp-marquee'), true)
check('renders 5 region rail panels', $$('.dp-rail__panel').length, 5)
check('renders stats cells', $$('.dp-stats__cell').length, 4)

const chips = $$('.dp-explorer__chips button')
check('explorer shows All + 5 region chips', chips.length, 6)
check('all-trips grid defaults to 8 cards', $$('.dp-explore__trip').length, 8)

/* Filter to a region with scheduled trips. */
const eastern = chips.find((c) => c.textContent.trim() === 'Eastern')
eastern?.click()
await sleep(700)
check('Eastern filter shows 2 trips', $$('.dp-explore__trip').length, 2)

/* Filter to a region with private expeditions only. */
const farWest = $$('.dp-explorer__chips button').find((c) => c.textContent.trim() === 'Far West')
farWest?.click()
await sleep(700)
check('Far West shows private-expedition CTA', !!$('.dp-explorer__private'), true)

/* FAQ toggling. */
const questions = $$('.dp-faq__question')
check('renders 4 FAQ questions', questions.length, 4)
check('first FAQ open by default', !!$('#dp-faq-panel-0'), true)
questions[1]?.click()
await sleep(300)
check('second FAQ opens on click', !!$('#dp-faq-panel-1'), true)

/* Craft + season + voices render. */
check('craft steps list has 4', $$('.dp-craft__steps button').length, 4)
check('season rows render', $$('.dp-season__row').length, 4)
check('voices stage renders', !!$('.dp-voices__stage'), true)

/* Router back to home renders the original page, not the destinations page. */
window.history.pushState({}, '', '/')
window.dispatchEvent(new window.Event('popstate'))
await sleep(500)
check('home hero renders after navigation', !!$('.hero'), true)
check('destinations hero unmounted', !!$('.dp-hero'), false)
check('home trips rail present', !!$('.trips-scroll'), true)

console.log(failures === 0 ? 'DESTINATIONS OK' : `DESTINATIONS FAILED (${failures})`)
process.exit(failures === 0 ? 0 : 1)
