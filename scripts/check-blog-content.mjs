/* Guards the journal article "Best Summer Treks For Family in Nepal For Beginners".
 *
 * The article body must be the markdown file at the repository root, verbatim —
 * the same words, in the same order, with nothing added. This check renders the
 * real SummerFamilyTreksBlog component (react-dom/server) and diffs the text it
 * produces against the text of the .md file:
 *
 *   1. every text unit (heading, paragraph, list item, table cell) matches 1:1,
 *   2. the full article text is byte-identical after markdown syntax is stripped,
 *   3. structural counts (headings, list items, table rows) match the source,
 *   4. copy invented by earlier drafts of this component is gone.
 *
 * Run with: node scripts/check-blog-content.mjs
 */
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const MARKDOWN_FILE = 'Best Summer Treks For Family in Nepal For Beginners.md'
const markdown = readFileSync(resolve(root, MARKDOWN_FILE), 'utf8')

let failures = 0
const check = (label, actual, expected) => {
  const ok = actual === expected
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${ok ? '' : `\n       got:  ${JSON.stringify(actual)}\n       want: ${JSON.stringify(expected)}`}`)
}

/* ---------- 1. Bundle + render the real component ---------- */

/* Vite serves `*.md?raw` as a string; esbuild needs the same behaviour here. */
const rawPlugin = {
  name: 'vite-raw',
  setup(plugin) {
    plugin.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: args.path.replace(/\?raw$/, ''),
      namespace: 'vite-raw',
      pluginData: { resolveDir: args.resolveDir },
    }))
    plugin.onLoad({ filter: /.*/, namespace: 'vite-raw' }, (args) => ({
      contents: `export default ${JSON.stringify(readFileSync(resolve(args.pluginData.resolveDir, args.path), 'utf8'))}`,
      loader: 'js',
    }))
  },
}

const bundled = await build({
  stdin: {
    contents: [
      "import { renderToStaticMarkup } from 'react-dom/server'",
      "import SummerFamilyTreksBlog from './src/components/SummerFamilyTreksBlog.jsx'",
      "import { ARTICLE_TITLE, parseMarkdown } from './src/lib/articleMarkdown.jsx'",
      'globalThis.__renderBlog = () => renderToStaticMarkup(<SummerFamilyTreksBlog onClose={() => {}} onBook={() => {}} />)',
      'globalThis.__articleTitle = ARTICLE_TITLE',
      'globalThis.__parseMarkdown = parseMarkdown',
    ].join('\n'),
    resolveDir: root,
    loader: 'jsx',
  },
  bundle: true,
  format: 'cjs',
  platform: 'node',
  jsx: 'automatic',
  write: false,
  logLevel: 'warning',
  outfile: 'blog-check.cjs',
  plugins: [rawPlugin],
})

const bundlePath = resolve(here, '.blog-content-bundle.cjs')
writeFileSync(bundlePath, bundled.outputFiles[0].text)
const require = createRequire(import.meta.url)
require(bundlePath)
const { __renderBlog, __articleTitle, __parseMarkdown } = globalThis

const html = __renderBlog()
const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`)
const document = dom.window.document
const article = document.querySelector('.blog-article')

/* ---------- 2. Expected text, parsed straight from the .md file ---------- */

const stripSyntax = (text) =>
  text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\\([\s\S])/g, '$1').trim()

const norm = (text) => text.replace(/\s+/g, ' ').trim()

const splitRow = (row) => row.split('|').slice(1, -1).map((cell) => cell.trim())

/** Markdown lines -> the text units the article should contain, in order. */
function expectedUnits(md) {
  const units = []
  for (const rawLine of md.split('\n')) {
    const line = rawLine.trim()
    if (line === '') continue
    if (/^#{1,6}$/.test(line)) continue // the empty `## ` line in the source

    const heading = /^(#{1,6})\s*(.*)$/.exec(line)
    if (heading) {
      units.push({ kind: heading[1].length === 2 ? 'h2' : 'h3', text: norm(stripSyntax(heading[2])) })
      continue
    }
    if (line.startsWith('|')) {
      const cells = splitRow(line)
      if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) continue // divider row
      for (const cell of cells) units.push({ kind: 'cell', text: norm(stripSyntax(cell)) })
      continue
    }
    if (/^\*\s+/.test(line)) {
      units.push({ kind: 'li', text: norm(stripSyntax(line.replace(/^\*\s+/, ''))) })
      continue
    }
    units.push({ kind: 'p', text: norm(stripSyntax(line)) })
  }
  return units
}

/** Same units, read back out of the rendered DOM. */
function renderedUnits(element) {
  const units = []
  const leaf = { H2: 'h2', H3: 'h3', P: 'p', LI: 'li', TH: 'cell', TD: 'cell' }
  const walk = (node) => {
    for (const child of node.children) {
      const kind = leaf[child.tagName]
      if (kind) units.push({ kind, text: norm(child.textContent) })
      else walk(child)
    }
  }
  walk(element)
  return units
}

const expected = expectedUnits(markdown)
const rendered = article ? renderedUnits(article) : []

/* ---------- 3. Assertions ---------- */

check('article element exists', Boolean(article), true)
check('h1 is the article title', document.querySelector('.blog-hero__inner h1')?.textContent, MARKDOWN_FILE.replace(/\.md$/, ''))
check('component ARTICLE_TITLE matches the file name', __articleTitle, MARKDOWN_FILE.replace(/\.md$/, ''))

check(
  `renders every text unit of ${MARKDOWN_FILE} (${expected.length} units)`,
  rendered.length,
  expected.length,
)

const firstMismatch = expected.findIndex((unit, index) => rendered[index]?.text !== unit.text)
check(
  'every unit matches the source text word for word, in order',
  firstMismatch === -1 ? 'all match' : `unit ${firstMismatch + 1}: ${JSON.stringify(rendered[firstMismatch]?.text)} != ${JSON.stringify(expected[firstMismatch].text)}`,
  'all match',
)

check(
  'full article text is identical to the source (markdown syntax stripped)',
  rendered.map((unit) => unit.text).join(' '),
  expected.map((unit) => unit.text).join(' '),
)

const countBy = (units, kind) => units.filter((unit) => unit.kind === kind).length
for (const kind of ['h2', 'h3', 'p', 'li', 'cell']) {
  check(`${kind} count matches source`, countBy(rendered, kind), countBy(expected, kind))
}

/* Table shape: rows and cells, so a merged or dropped column cannot slip by. */
check(
  'table rows rendered',
  document.querySelectorAll('.blog-article tbody tr').length,
  markdown.split('\n').filter((line) => line.trim().startsWith('|')).length
    - markdown.split('\n').filter((line) => /^\|(\s*:?-{3,}:?\s*\|)+$/.test(line.trim())).length
    - __parseMarkdown(markdown).filter((block) => block.type === 'table').length,
)
check(
  'table cells rendered',
  document.querySelectorAll('.blog-article td').length,
  countBy(expected, 'cell') - document.querySelectorAll('.blog-article th').length,
)

/* ---------- 4. Nothing invented, nothing left over from earlier drafts ---------- */

for (const phrase of [
  'Written by Kishor',
  'Expert Verified',
  'Summer Magic',
  'Family Budget Calculator',
  'Trail Highlights',
  'Monsoon Reality Check',
  'Why Summer Wins for Families',
  'Plan this trek for my family',
  'min read',
]) {
  check(`no invented copy: "${phrase}"`, html.includes(phrase), false)
}

check('no interactive packing checklist survived', document.querySelectorAll('.blog-article input').length, 0)

/* ---------- 5. The article must not ship unstyled ---------- */
/* An earlier draft of this component used `.blog-*` classes that had no rules in
 * src/styles.css at all, so the article rendered as raw browser-default markup. */
const componentSource = readFileSync(resolve(root, 'src/components/SummerFamilyTreksBlog.jsx'), 'utf8')
const stylesheet = readFileSync(resolve(root, 'src/styles.css'), 'utf8')
const usedClasses = [...new Set(
  componentSource
    .match(/className="([^"{]+)"/g)
    ?.flatMap((attr) => attr.slice(11, -1).trim().split(/\s+/)) ?? [],
)].filter((name) => name.startsWith('blog-'))

for (const className of usedClasses) {
  check(`styles.css styles .${className}`, stylesheet.includes(`.${className}`), true)
}

rmSync(bundlePath, { force: true })

console.log(failures === 0 ? 'BLOG CONTENT OK' : `BLOG CONTENT FAILED (${failures})`)
process.exit(failures === 0 ? 0 : 1)
