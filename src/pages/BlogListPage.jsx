import { useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, Clock, Star, RefreshCw } from 'lucide-react'
import { useBlogs } from '../services/payload/blogs'
import { Link, usePageMeta } from '../lib/router'
import Reveal from '../components/Reveal'

export default function BlogListPage() {
  const { blogs, loading, error, refetch } = useBlogs()
  const [activeCategory, setActiveCategory] = useState('All')

  usePageMeta({
    title: 'The Journal — Stories & Field Notes — Hike Globally',
    description: 'Field notes, practical trekking guides, family routes and cultural dispatches from the trails of Nepal.',
  })

  const categories = useMemo(() => {
    return ['All', ...new Set(blogs.map((b) => b.category).filter(Boolean))]
  }, [blogs])

  const filteredBlogs = useMemo(() => {
    if (activeCategory === 'All') return blogs
    return blogs.filter((b) => b.category === activeCategory)
  }, [blogs, activeCategory])

  const featured = filteredBlogs.find((b) => b.premium) || filteredBlogs[0] || null
  const secondary = filteredBlogs.filter((b) => b.id !== featured?.id)

  return (
    <main className="blog-list-page">
      <section className="section-pad blog-list-hero">
        <div className="shell">
          <div className="section-intro section-intro--journal">
            <Reveal>
              <p className="eyebrow"><span>03</span> The Journal</p>
              <h2>Stories from<br />the <em>road.</em></h2>
            </Reveal>
            <Reveal className="section-intro__aside" delay={100}>
              <p>Field notes, practical guides and honest stories to help you travel more deeply.</p>
              {error && (
                <button type="button" className="inline-link" onClick={() => refetch()}>
                  <RefreshCw size={14} /> Reconnect CMS
                </button>
              )}
            </Reveal>
          </div>

          {/* Category Filter Chips */}
          <div className="blog-category-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`blog-chip ${activeCategory === cat ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Featured Article */}
          {featured && (
            <Reveal as="article" className={`featured-story ${featured.premium ? 'featured-story--premium' : ''}`}>
              <Link
                href={`/blog/${featured.slug || featured.id}`}
                className="featured-story__image"
                aria-label={`Read ${featured.title}`}
              >
                <img src={featured.image} alt={featured.alt} loading="lazy" decoding="async" />
                <span>{featured.premium ? 'Premium Guide · Featured' : 'Field notes · 001'}</span>
                {featured.premium && (
                  <span className="premium-badge">
                    <Star size={12} /> Premium Guide
                  </span>
                )}
              </Link>
              <div className="featured-story__content">
                <div className="story-kicker">
                  <span>{featured.category}</span>
                  <span>
                    <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                    {featured.readTime}
                  </span>
                </div>
                <h3>
                  <Link href={`/blog/${featured.slug || featured.id}`}>{featured.title}</Link>
                </h3>
                <p>{featured.excerpt}</p>
                {featured.premium && (
                  <div className="premium-features">
                    <span>✓ Quick comparison table</span>
                    <span>✓ Budget breakdown</span>
                    <span>✓ Essential packing list</span>
                    <span>✓ FAQ</span>
                  </div>
                )}
                <div className="featured-story__foot">
                  <time>{featured.date}</time>
                  <Link href={`/blog/${featured.slug || featured.id}`} className="button-like-link">
                    {featured.premium ? 'Explore Guide' : 'Read article'} <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </Reveal>
          )}

          {/* Secondary Stories */}
          {secondary.length > 0 && (
            <div className="secondary-stories">
              {secondary.map((article, index) => (
                <Reveal as="article" className="story-card" key={article.id} delay={index * 80}>
                  <Link
                    href={`/blog/${article.slug || article.id}`}
                    className="story-card__image"
                    aria-label={`Read ${article.title}`}
                  >
                    <img src={article.image} alt={article.alt} loading="lazy" decoding="async" />
                    <span>0{index + 2}</span>
                  </Link>
                  <div className="story-kicker">
                    <span>{article.category}</span>
                    <span>{article.readTime}</span>
                  </div>
                  <h3>
                    <Link href={`/blog/${article.slug || article.id}`}>{article.title}</Link>
                  </h3>
                  <p>{article.excerpt}</p>
                  <footer>
                    <time>{article.date}</time>
                    <Link
                      href={`/blog/${article.slug || article.id}`}
                      aria-label={`Read ${article.title}`}
                    >
                      <ArrowUpRight size={18} />
                    </Link>
                  </footer>
                </Reveal>
              ))}
            </div>
          )}

          {filteredBlogs.length === 0 && !loading && (
            <div className="blog-empty text-center section-pad">
              <p className="eyebrow">Empty Shelf</p>
              <h3>No dispatches found in this category.</h3>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setActiveCategory('All')}
              >
                View all articles
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
