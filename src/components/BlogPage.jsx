import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { parseMarkdown, renderInline, stripInline } from '../lib/articleMarkdown'

/**
 * BlogPage — the single article design for every blog post on Hike Globally.
 *
 * Every post renders through this one component (typography, spacing, contents
 * rail and CTAs are defined once in src/styles/blog.css), so any new markdown
 * file drops in unchanged: pass `title`, the raw `markdown`, a hero `image`
 * and an optional `kicker` (category label). See the type-scale documentation
 * at the top of that stylesheet.
 */
export default function BlogPage({ title, markdown, image, imageAlt = '', kicker = null, onClose, onBook }) {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown])
  const contents = useMemo(
    () =>
      blocks
        .filter((block) => block.type === 'h2')
        .map((block) => ({ id: block.id, label: stripInline(block.content) })),
    [blocks],
  )

  const pageRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [activeId, setActiveId] = useState(contents[0]?.id)

  useEffect(() => {
    document.body.classList.add('drawer-is-open')
    return () => document.body.classList.remove('drawer-is-open')
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    const page = pageRef.current
    if (!page) return undefined

    const onScroll = () => {
      const max = page.scrollHeight - page.clientHeight
      setProgress(max > 0 ? Math.min(1, page.scrollTop / max) : 0)

      const pageTop = page.getBoundingClientRect().top
      let current = contents[0]?.id
      for (const item of contents) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top - pageTop <= 140) current = item.id
      }
      setActiveId(current)
    }

    page.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => page.removeEventListener('scroll', onScroll)
  }, [contents])

  const jumpTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="blog-page" ref={pageRef}>
      <div className="blog-page__progress" style={{ transform: `scaleX(${progress})` }} />

      <header className="blog-bar">
        <button className="blog-bar__close" type="button" onClick={onClose}>
          <X size={17} aria-hidden="true" /> <span>Close</span>
        </button>
        <p className="blog-bar__title">{title}</p>
        <button className="blog-bar__cta" type="button" onClick={onBook}>
          Plan my trip <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </header>

      <section className="blog-hero">
        <div className="blog-hero__media" aria-hidden="true">
          <img src={image} alt={imageAlt} />
        </div>
        <div className="blog-hero__inner">
          {kicker ? <p className="blog-hero__kicker">{kicker}</p> : null}
          <h1>{title}</h1>
        </div>
      </section>

      <div className="blog-layout">
        <aside className="blog-contents">
          <div className="blog-contents__inner">
            <p className="eyebrow">Contents</p>
            <nav>
              {contents.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={activeId === item.id ? 'is-active' : ''}
                  onClick={() => jumpTo(item.id)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Everything inside <article> comes from the post's markdown, verbatim. */}
        <article className="blog-article">
          {blocks.map((block, index) => {
            const key = `${block.type}-${index}`

            if (block.type === 'h2') {
              return (
                <h2 key={key} id={block.id}>
                  {renderInline(block.content, key)}
                </h2>
              )
            }
            if (block.type === 'h3') {
              return <h3 key={key}>{renderInline(block.content, key)}</h3>
            }
            if (block.type === 'list') {
              return (
                <ul key={key}>
                  {block.items.map((item, itemIndex) => (
                    <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
                  ))}
                </ul>
              )
            }
            if (block.type === 'table') {
              const [head, ...body] = block.rows
              return (
                <div className="blog-table-wrap" key={key}>
                  <table>
                    <thead>
                      <tr>
                        {head.map((cell, cellIndex) => (
                          <th key={`${key}-h-${cellIndex}`} scope="col">
                            {renderInline(cell, `${key}-h-${cellIndex}`)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {body.map((row, rowIndex) => (
                        <tr key={`${key}-r-${rowIndex}`}>
                          {row.map((cell, cellIndex) => (
                            <td key={`${key}-r-${rowIndex}-${cellIndex}`}>
                              {renderInline(cell, `${key}-r-${rowIndex}-${cellIndex}`)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
            return <p key={key}>{renderInline(block.content, key)}</p>
          })}
        </article>
      </div>

      <footer className="blog-end">
        <button className="blog-end__cta" type="button" onClick={onBook}>
          Plan my trip <ArrowUpRight size={16} aria-hidden="true" />
        </button>
        <button className="blog-end__back" type="button" onClick={onClose}>
          <X size={15} aria-hidden="true" /> <span>Back to the journal</span>
        </button>
      </footer>
    </div>
  )
}
