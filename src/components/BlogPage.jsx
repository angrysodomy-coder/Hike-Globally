import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { parseMarkdown, renderInline, stripInline } from '../lib/articleMarkdown'

/**
 * BlogPage — the long-form article layout used by a blog route.
 *
 * This is a normal document page, not a drawer or modal. Each article owns its
 * `/blog/<slug>` URL while the shared renderer keeps the editorial typography,
 * contents rail and CTAs consistent across posts. See the type-scale
 * documentation at the top of src/styles/blog.css.
 */
export default function BlogPage({ title, markdown, image, imageAlt = '', kicker = null, onBook }) {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown])
  const contents = useMemo(
    () =>
      blocks
        .filter((block) => block.type === 'h2')
        .map((block) => ({ id: block.id, label: stripInline(block.content) })),
    [blocks],
  )

  const [progress, setProgress] = useState(0)
  const [activeId, setActiveId] = useState(contents[0]?.id)

  useEffect(() => {
    const onScroll = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(documentHeight > 0 ? Math.min(1, window.scrollY / documentHeight) : 0)

      let current = contents[0]?.id
      for (const item of contents) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top <= 140) current = item.id
      }
      setActiveId(current)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [contents])

  const jumpTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main id="main-content" className="blog-page">
      <div className="blog-page__progress" style={{ transform: `scaleX(${progress})` }} />

      <header className="blog-bar">
        <a className="blog-bar__close" href="/#journal">
          <ArrowLeft size={17} aria-hidden="true" /> <span>Back to journal</span>
        </a>
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
        <a className="blog-end__back" href="/#journal">
          <ArrowLeft size={15} aria-hidden="true" /> <span>Back to the journal</span>
        </a>
      </footer>
    </main>
  )
}
