/* Smoke test for the /trips collection page.
 * Mounts the real <App /> inside <RouterProvider /> at the `/trips` URL in
 * jsdom and asserts the page renders, the collection search/filter/sort all
 * behave, the FAQ toggles, and the router can return home.
 */
import { JSDOM } from 'jsdom'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'https://hike.example/trips',
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

require('./.smoke-trips-page-bundle.cjs')
globalThis.__mountApp()
await sleep(500)

const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => [...document.querySelectorAll(sel)]
const cards = () => $$('.tp-card')
const firstCardTitle = () => cards()[0]?.querySelector('.tp-card__title')?.textContent

const setInput = (input, value) => {
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  set.call(input, value)
  input.dispatchEvent(new window.Event('input', { bubbles: true }))
}

const setSelect = (select, value) => {
  const set = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
  set.call(select, value)
  select.dispatchEvent(new window.Event('change', { bubbles: true }))
}

const chip = (group, label) =>
  (typeof group === 'string' ? $$(group) : [group])
    .flatMap((g) => [...g.querySelectorAll('button')])
    .find((b) => b.textContent.trim() === label)

/* ---- Page sections ---- */
check('renders trips hero', !!$('.tp-hero'), true)
check('hero title present', $('.tp-hero__title')?.textContent.replace(/\s+/g, ' ').includes('Eight journeys.'), true)
check('renders marquee', !!$('.tp-marquee'), true)
check('marquee lists all eight journeys', $$('.tp-marquee__group:first-child .tp-marquee__item').length, 8)
check('signature journey renders', !!$('.tp-signature'), true)
check('signature timeline has 8 days', $$('.tp-timeline__node').length, 8)
check('stats band renders 4 cells', $$('.tp-stats__cell').length, 4)
check('season matrix renders 8 journey rows', $$('.tp-matrix__row--trip').length, 8)
check('season matrix renders 21 in-season dots', $$('.tp-matrix__row--trip .tp-matrix__dot--prime, .tp-matrix__row--trip .tp-matrix__dot--good').length, 21)
check('inclusions list has 6 items', $$('.tp-include').length, 6)
check('voices stage renders', !!$('.dp-voices__stage'), true)
check('cta section renders', !!$('.tp-cta'), true)
check('page title set', document.title, 'Trips — Hike Globally')

/* ---- Collection: defaults ---- */
check('collection defaults to 8 cards', cards().length, 8)
check('featured first: Everest leads', firstCardTitle(), 'Everest Base Camp')
check('count line shows 8 of 8', $('.tp-count')?.textContent.replace(/\s+/g, ' ').includes('8 of 8'), true)

/* ---- Region filter ---- */
const regionChips = $('.tp-chips')
chip(regionChips, 'Mustang')?.click()
await sleep(800)
check('Mustang filter shows 1 card', cards().length, 1)
check('Mustang card is the passage', firstCardTitle(), 'Upper Mustang Passage')
chip(regionChips, 'All')?.click()
await sleep(800)
check('All regions restores 8 cards', cards().length, 8)

/* ---- Search ---- */
const search = $('.tp-search input')
setInput(search, 'mustang')
await sleep(800)
check('search "mustang" shows 1 card', cards().length, 1)
setInput(search, 'zzzz')
await sleep(800)
check('nonsense search shows empty state', !!$('.tp-empty'), true)
check('empty state offers a private build', $('.tp-empty')?.textContent.includes('Build it with us'), true)
const clearBtn = $('.tp-count__clear')
clearBtn?.click()
await sleep(800)
check('clear restores 8 cards', cards().length, 8)
check('search cleared', search.value, '')

/* ---- Difficulty filter ---- */
const effortChips = $('.tp-chips + .tp-chips')
chip(effortChips, 'Challenging')?.click()
await sleep(800)
check('Challenging shows 3 cards', cards().length, 3)
chip(effortChips, 'Easy')?.click()
await sleep(800)
check('Easy shows 1 card (Kathmandu)', firstCardTitle(), 'Kathmandu & the Foothills')
chip(effortChips, 'Any effort')?.click()
await sleep(800)
check('Any effort restores 8 cards', cards().length, 8)

/* ---- Season filter ---- */
chip(effortChips, 'Summer')?.click()
await sleep(800)
check('Summer shows only Upper Mustang', cards().length, 1)
chip(effortChips, 'Winter')?.click()
await sleep(800)
check('Winter shows 4 cards', cards().length, 4)
chip(effortChips, 'Any season')?.click()
await sleep(800)
check('Any season restores 8 cards', cards().length, 8)

/* ---- Sorting ---- */
const sort = $('.tp-sort select')
setSelect(sort, 'price-asc')
await sleep(400)
check('price asc leads with Mardi Himal ($890)', firstCardTitle(), 'Mardi Himal Ridge')
setSelect(sort, 'price-desc')
await sleep(400)
check('price desc leads with Upper Mustang ($2,150)', firstCardTitle(), 'Upper Mustang Passage')
setSelect(sort, 'duration-asc')
await sleep(400)
check('duration asc leads with Mardi Himal (8 days)', firstCardTitle(), 'Mardi Himal Ridge')
setSelect(sort, 'duration-desc')
await sleep(400)
check('duration desc leads with Gokyo (18 days)', firstCardTitle(), 'Gokyo Lakes & Cho La')
setSelect(sort, 'featured')
await sleep(400)
check('featured restores Everest first', firstCardTitle(), 'Everest Base Camp')

/* ---- Card affordances ---- */
const card = cards()[0]
check('card shows availability tag', card?.querySelector('.tp-card__tag')?.textContent.includes('October'), true)
check('card shows signature moment', card?.querySelector('.tp-card__moment')?.textContent.length > 10, true)
check('card shows departures', card?.querySelector('.tp-card__dep')?.textContent.includes('Mar'), true)
const viewBtn = card?.querySelector('.tp-card__go')
check('card has a view-journey CTA', !!viewBtn, true)
viewBtn?.click()
await sleep(300)
check('view-journey opens the booking drawer', !!$('.booking-drawer'), true)
check('drawer shows the right trip', $('.booking-drawer')?.textContent.includes('Everest Base Camp'), true)
window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
await sleep(300)
check('escape closes the drawer', !!$('.booking-drawer'), false)

/* ---- FAQ ---- */
const questions = $$('.tp-faq__question')
check('renders 5 FAQ questions', questions.length, 5)
check('first FAQ open by default', !!$('#tp-faq-panel-0'), true)
questions[1]?.click()
await sleep(300)
check('second FAQ opens on click', !!$('#tp-faq-panel-1'), true)
check('second FAQ button is expanded', questions[1].getAttribute('aria-expanded'), 'true')
check('accordion collapses the first when the second opens', questions[0].getAttribute('aria-expanded'), 'false')
await sleep(600)
check('first FAQ panel exits after the animation', !!$('#tp-faq-panel-0'), false)

/* ---- Router back to home ---- */
window.history.pushState({}, '', '/')
window.dispatchEvent(new window.Event('popstate'))
await sleep(500)
check('home hero renders after navigation', !!$('.hero'), true)
check('trips hero unmounted', !!$('.tp-hero'), false)
check('home trips rail present', !!$('.trips-scroll'), true)
check('home trips section links to /trips', $('.trips-section .inline-link')?.getAttribute('href'), '/trips')

console.log(failures === 0 ? 'TRIPS PAGE OK' : `TRIPS PAGE FAILED (${failures})`)
process.exit(failures === 0 ? 0 : 1)
