import { Fragment, useMemo } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock3 } from 'lucide-react'
import { articles } from '../data/content'
import { parseMarkdown, renderInline } from '../lib/articleMarkdown'
import Reveal from './Reveal'

/**
 * BlogPage — renders a full markdown article inside the same editorial shell
 * used by the rest of the journal detail pages.
 *
 * The article copy still comes verbatim from markdown. The surrounding hero,
 * byline, related-story rail and CTA intentionally mirror BlogArticlePage so
 * the premium family-treks guide no longer feels like a separate template.
 */
export default function BlogPage({
  title,
  markdown,
  image,
  imageAlt = '',
  kicker = 'Family Guides',
  readTime = '10 min read',
  date = 'September 16, 2026',
  author = 'Nima Sherpa',
  articleId = 'best-summer-treks-family-nepal-beginners',
  onBook,
}) {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown])
  const firstParagraphIndex = useMemo(
    () => blocks.findIndex((block) => block.type === 'paragraph'),
    [blocks],
  )
  const relatedArticles = useMemo(
    () => articles.filter((item) => item.id !== articleId).slice(0, 3),
    [articleId],
  )

  const renderBlock = (block, index) => {
    const key = `${block.type}-${index}`
    const isStandfirst = index === firstParagraphIndex

    if (block.type === 'h2') {
      return (
        <h2 key={key} id={block.id}>
          {renderInline(block.content, key)}
        </h2>
      )
    }

    if (/^h[3-6]$/.test(block.type)) {
      const Heading = block.type
      return <Heading key={key}>{renderInline(block.content, key)}</Heading>
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

    return (
      <p key={key} className={isStandfirst ? 'article-page__standfirst' : undefined}>
        {renderInline(block.content, key)}
      </p>
    )
  }

  return (
    <main id="main-content" className="article-page article-page--markdown">
      <section className="article-page__hero">
        <div className="article-page__hero-media" aria-hidden="true">
          <img src={image} alt={imageAlt} />
        </div>
        <div className="article-page__hero-inner blog-hero__inner shell">
          <a className="article-page__back" href="/#journal">
            <ArrowLeft size={15} aria-hidden="true" /> The journal
          </a>
          <div className="story-kicker">
            <span>{kicker}</span>
            <span><Clock3 size={13} aria-hidden="true" /> {readTime}</span>
          </div>
          <h1>{title}</h1>
        </div>
      </section>

      <div className="article-page__layout shell">
        <article className="article-page__body">
          <Reveal className="article-page__copy article-page__copy--markdown blog-article">
            {blocks.map((block, index) => (
              <Fragment key={`${block.type}-wrap-${index}`}>
                {renderBlock(block, index)}
                {index === firstParagraphIndex ? (
                  <div className="article-page__byline">
                    <span>Words by <strong>{author}</strong></span>
                    <time>{date}</time>
                  </div>
                ) : null}
              </Fragment>
            ))}
          </Reveal>

          <Reveal as="aside" className="article-page__cta">
            <span>Ready to see it for yourself?</span>
            <button type="button" onClick={() => onBook?.()}>
              Plan a journey <ArrowRight size={17} aria-hidden="true" />
            </button>
          </Reveal>
        </article>

        <aside className="article-page__more">
          <p className="eyebrow"><span>More</span> from the journal</p>
          <ul>
            {relatedArticles.map((item) => (
              <li key={item.id}>
                <a href={`/blog/${item.id}`}>
                  <small>{item.category}</small>
                  {item.title}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  )
}
