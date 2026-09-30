/* Smoke test for the single trip page (`/trips/<slug>`).
 *
 * Mounts the real <App /> at /trips/everest-base-camp in jsdom and walks the
 * whole page in the order a traveller reads it:
 *
 *   hero · title · excerpt · byline · highlights · overview · outline ·
 *   booking calendar · full itinerary · includes/excludes ·
 *   essential info · map · packing list · FAQs
 *
 * plus the two interactive pieces the design depends on — the paginated
 * booking calendar (month navigation, date selection, Name/Email/Country
 * validation, Book now) and the itinerary accordion (fact box, copy and the
 * three-image slider) — and the mandatory glowing price rail.
 */
import { JSDOM } from 'jsdom'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../src/styles/trip-single.css'), 'utf8')

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'https://hike.example/trips/everest-base-camp',
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
window.Element.prototype.scrollTo = function scrollTo() {}
window.Element.prototype.scrollIntoView = function scrollIntoView() {}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

let failures = 0
const check = (label, actual, expected) => {
  const ok = expected instanceof RegExp ? expected.test(String(actual)) : actual === expected
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${ok ? '' : ` (got ${JSON.stringify(actual)}, want ${expected})`}`)
}

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

require('./.smoke-trip-single-bundle.cjs')
globalThis.__mountApp()
await sleep(500)

const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => [...document.querySelectorAll(sel)]
const text = (sel) => $(sel)?.textContent?.replace(/\s+/g, ' ').trim() || ''

/* ---- 1 · Hero + featured image ---- */
check('page mounts', !!$('.tsp'), true)
check('hero renders the featured image', $('.tsp-hero__media img')?.getAttribute('src'), '/images/trip-everest.webp')
check('hero image has alt text', ($('.tsp-hero__media img')?.getAttribute('alt') || '').length > 10, true)
check('breadcrumb links back to the collection', !!$$('.tsp-crumbs a').find((a) => a.getAttribute('href') === '/trips'), true)
check('hero shows 5 fact chips', $$('.tsp-hero__chips li').length, 5)

/* ---- 2/3/4 · Title, excerpt, byline ---- */
check('exactly one h1', $$('.tsp h1').length, 1)
check('title is the trip name', text('.tsp-lede h1'), 'Everest Base Camp')
check('excerpt is a real standfirst', text('.tsp-lede__excerpt').length > 180, true)
check('byline shows the writer', text('.tsp-byline__name'), 'Pemba Dorjee Sherpa')
check('byline shows published date, updated date and reading time', $$('.tsp-byline__meta > div').length, 3)
check('reading time rendered', /min read/.test(text('.tsp-byline__meta')), true)

/* ---- 5 · Highlights ---- */
check('highlights box renders', !!$('#highlights .tsp-highlights'), true)
check('highlights are pointers', $$('#highlights .tsp-highlights li').length, 8)

/* ---- 6 · Overview ---- */
check('overview is a content section', $$('#overview .tsp-prose p').length >= 4, true)

/* ---- 7 · Day-to-day outline ---- */
const outline = $$('#itinerary-outline .tsp-outline li')
check('outline lists every day', outline.length, 10)
check('outline rows stay an outline (no body copy)', outline[0]?.querySelectorAll('p').length, 0)

/* ---- 8 · Booking calendar ---- */
check('calendar renders', !!$('#booking .tsp-calendar'), true)
check('one month in view', $$('.tsp-calendar__month').length, 1)
check('weekday header has 7 cells', $$('.tsp-calendar__weekdays span').length, 7)
check('calendar grid is a whole number of weeks', $$('.tsp-calendar__days > *').length % 7, 0)
check('legend explains the three states', $$('.tsp-calendar__legend li').length, 3)

const monthLabel = () => text('.tsp-calendar__month')
const [prev, next] = $$('.tsp-calendar__nav button')
check('previous month disabled on the current month', prev?.disabled, true)
const firstMonth = monthLabel()
next?.click()
await sleep(200)
check('next month paginates forward', monthLabel() !== firstMonth, true)
prev?.click()
await sleep(200)
check('previous month paginates back', monthLabel(), firstMonth)

/* Walk forward until a month with departures shows up, then pick one. */
let guard = 0
while ($$('.tsp-day--departure:not(:disabled)').length === 0 && guard < 14) {
  $$('.tsp-calendar__nav button')[1]?.click()
  await sleep(120)
  guard += 1
}
const departures = $$('.tsp-day--departure')
check('departure dates are marked on the calendar', departures.length > 0, true)
check('departure cells carry a status class', /is-(available|limited|sold-out)/.test(departures[0]?.className), true)
check('sold-out departures are not clickable', $$('.tsp-day--departure.is-sold-out').every((d) => d.disabled), true)

const bookable = $$('.tsp-day--departure:not(:disabled)')
bookable[bookable.length - 1]?.click()
await sleep(200)
check('clicking a date selects it', $$('.tsp-day.is-selected').length, 1)
check('only one date can be selected', $$('.tsp-day[aria-pressed="true"]').length, 1)
check('selection is summarised for the traveller', text('.tsp-calendar__chosen-date').length > 6, true)

check('form keeps a Name field', !!$('#tsp-name'), true)
check('form keeps an Email field', $('#tsp-email')?.getAttribute('type'), 'email')
check('form keeps a Country field', $('#tsp-country')?.tagName, 'SELECT')
check('country list is populated', $$('#tsp-country option').length > 40, true)
check('name, email and country are all required', ['#tsp-name', '#tsp-email', '#tsp-country'].every((sel) => $(sel).required), true)
check('book now submit button renders', !!$('.tsp-calendar__form .tsp-bookBtn'), true)

/* Submitting empty must not confirm anything. */
$('.tsp-calendar__form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
await sleep(200)
check('invalid form does not confirm', !!$('.tsp-calendar--done'), false)

setInput($('#tsp-name'), 'Maya Tamang')
setInput($('#tsp-email'), 'maya@example.com')
setSelect($('#tsp-country'), 'Germany')
await sleep(150)
$('.tsp-calendar__form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
await sleep(300)
check('valid form confirms the booking', !!$('.tsp-calendar--done'), true)
check('confirmation echoes the email', /maya@example\.com/.test(text('.tsp-calendar--done')), true)
check('confirmation shows a receipt', $$('.tsp-calendar__receipt > div').length, 4)
$('.tsp-calendar--done .tsp-ghostBtn')?.click()
await sleep(250)
check('traveller can return to the form', !!$('.tsp-calendar__form'), true)

/* ---- 9 · Full itinerary accordion ---- */
const items = $$('.tsp-acc__item')
check('every day has an accordion row', items.length, 10)
check('first day open by default', items[0]?.classList.contains('is-open'), true)
check('other days start collapsed', $$('.tsp-acc__item.is-open').length, 1)
check('open day shows the fact box', $$('.tsp-acc__item.is-open .tsp-factbox > div').length, 4)
check('fact box order: altitude, trek duration, accommodation, meals',
  $$('.tsp-acc__item.is-open .tsp-factbox dt').map((dt) => dt.textContent.trim()).join('|'),
  'Altitude|Trek duration|Accommodation|Meals')
check('open day shows content copy', $$('.tsp-acc__item.is-open .tsp-acc__copy p').length >= 2, true)
check('open day shows 3 images', $$('.tsp-acc__item.is-open .tsp-slider__slide img').length, 3)
check('slider shows one image at a time', $$('.tsp-acc__item.is-open .tsp-slider__slide.is-active').length, 1)

$('.tsp-acc__item.is-open .tsp-slider__dots button:last-child')?.click()
await sleep(150)
check('slider dots switch the photograph',
  $$('.tsp-acc__item.is-open .tsp-slider__slide')[2]?.classList.contains('is-active'), true)

const secondTrigger = items[1]?.querySelector('.tsp-acc__trigger')
secondTrigger?.click()
await sleep(250)
check('a second day can be opened', items[1]?.classList.contains('is-open'), true)
check('accordion allows several open days', $$('.tsp-acc__item.is-open').length, 2)
check('trigger reports its state', secondTrigger?.getAttribute('aria-expanded'), 'true')
check('panel is linked to its trigger', $(`#${secondTrigger?.getAttribute('aria-controls')}`)?.hasAttribute('hidden'), false)
secondTrigger?.click()
await sleep(250)
check('a day can be collapsed again', items[1]?.classList.contains('is-open'), false)
$('.tsp-acc__toolbar .tsp-ghostBtn')?.click()
await sleep(250)
check('expand all opens every day', $$('.tsp-acc__item.is-open').length, 10)

/* ---- 10 · Includes / excludes ---- */
check('includes and excludes sit side by side', $$('#inclusions .tsp-inex__col').length, 2)
check('includes column first', $$('#inclusions .tsp-inex__col')[0]?.classList.contains('tsp-inex__col--in'), true)
check('excludes column second', $$('#inclusions .tsp-inex__col')[1]?.classList.contains('tsp-inex__col--ex'), true)
check('includes list is populated', $$('.tsp-inex__col--in li').length, 12)
check('excludes list is populated', $$('.tsp-inex__col--ex li').length, 12)

/* ---- 11 · Essential information ---- */
check('essential information renders as content blocks', $$('#essential-information .tsp-prose__block').length, 5)

/* ---- 12 · Map ---- */
check('map section renders an image', $('#route-map .tsp-map__frame img')?.getAttribute('src'), '/images/trip-route-map.jpg')
check('map has a caption', text('#route-map figcaption').length > 20, true)

/* ---- 13 · Packing list ---- */
const boxes = $$('#packing-list .tsp-packing__box')
check('packing list has 4 boxes', boxes.length, 4)
check('each packing box has a header', boxes.every((box) => !!box.querySelector('h3')), true)
check('each packing box has pointer content', boxes.every((box) => box.querySelectorAll('li').length >= 4), true)

/* ---- 14 · FAQs ---- */
const faqs = $$('.tsp-faq__item')
check('FAQ accordion renders', faqs.length, 7)
check('first FAQ open by default', faqs[0]?.classList.contains('is-open'), true)
faqs[2]?.querySelector('button')?.click()
await sleep(200)
check('FAQ opens on click', faqs[2]?.classList.contains('is-open'), true)
check('FAQ accordion is single-open', $$('.tsp-faq__item.is-open').length, 1)

/* ---- The mandatory left rail ---- */
check('left rail renders', !!$('.tsp-rail'), true)
check('rail carries the price', /\$1,490/.test(text('.tsp-priceCard__price')), true)
check('rail carries a Book now CTA', /Book now/.test(text('.tsp-priceCard .tsp-bookBtn')), true)
check('rail has the glow element', !!$('.tsp-priceCard__glow'), true)
check('rail is first in the DOM, before the article', $('.tsp-layout')?.firstElementChild?.classList.contains('tsp-rail'), true)
check('rail index links to every section', $$('.tsp-rail__index a').length, 10)
check('every rail index target exists', $$('.tsp-rail__index a').every((a) => !!$(a.getAttribute('href'))), true)

/* ---- CSS guards: the rail must glow and the page must stay responsive ---- */
const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
check('glow is animated', /\.tsp-priceCard__glow::before[\s\S]{0,400}animation:\s*tsp-orbit/.test(stripped), true)
check('glow uses a conic gradient border', /\.tsp-priceCard__glow::before[\s\S]{0,400}conic-gradient/.test(stripped), true)
check('rail is sticky on desktop', /\.tsp-rail__sticky\s*\{[\s\S]*?position:\s*sticky/.test(stripped), true)
check('rail folds above the article below 1080px', /@media \(max-width: 1080px\)[\s\S]*?\.tsp-rail\s*\{\s*order:\s*-1/.test(stripped), true)
check('includes column is green', /\.tsp-inex__col--in li i\s*\{\s*background:\s*var\(--tsp-green\)/.test(stripped), true)
check('excludes column is red', /\.tsp-inex__col--ex li i\s*\{\s*background:\s*var\(--tsp-red\)/.test(stripped), true)
check('packing grid is two per row', /\.tsp-packing\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,/.test(stripped), true)
check('includes/excludes grid is two across', /\.tsp-inex\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,/.test(stripped), true)
check('a 5" phone breakpoint exists', /@media \(max-width: 380px\)/.test(stripped), true)
check('a 100" display breakpoint exists', /@media \(min-width: 3400px\)/.test(stripped), true)
check('reduced motion pauses the glow', /@media \(prefers-reduced-motion: reduce\)[\s\S]*?tsp-priceCard__glow/.test(stripped), true)
check('no fixed px page width leaks into the layout', /\.tsp-layout\s*\{[\s\S]*?grid-template-columns:\s*var\(--tsp-rail-w\)/.test(stripped), true)

/* ---- Another trip renders from the same template ---- */
window.history.pushState({}, '', '/trips/langtang-valley')
window.dispatchEvent(new window.Event('popstate'))
await sleep(500)
check('a second trip uses the same template', text('.tsp-lede h1'), 'Langtang Valley')
check('its price rail updates', /\$1,080/.test(text('.tsp-priceCard__price')), true)
check('its itinerary is generated', $$('.tsp-acc__item').length, 6)
check('its calendar renders', !!$('.tsp-calendar'), true)

/* ---- Unknown slug ---- */
window.history.pushState({}, '', '/trips/not-a-real-trek')
window.dispatchEvent(new window.Event('popstate'))
await sleep(400)
check('unknown slugs fall back to the collection', !!$('.tp-hero') || !!$('.trip-detail--missing'), true)

console.log(failures === 0 ? 'TRIP SINGLE OK' : `TRIP SINGLE FAILED (${failures})`)
process.exit(failures === 0 ? 0 : 1)
