import { useMemo } from 'react'
import { ArrowRight, ArrowUpRight, Star, Clock } from 'lucide-react'
import { articles } from '../data/content'
import { articlePath } from '../data/tripDetails'
import { Link } from '../lib/router'
import Reveal from './Reveal'

export default function JournalSection({ cmsPosts }) {
  const items = useMemo(() => {
    if (!cmsPosts || cmsPosts.length === 0) return articles
    const mapped = cmsPosts.map((p) => ({
      id: p.slug,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt || '',
      category: (typeof p.categories?.[0] === 'object' && p.categories?.[0]?.title) || 'Field Notes',
      date: p.publishedAt
        ? new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recent',
      readTime: '6 min read',
      image: (typeof p.heroImage === 'object' && p.heroImage?.url) ? p.heroImage.url : '/images/journal-annapurna.webp',
      alt: (typeof p.heroImage === 'object' && p.heroImage?.alt) ? p.heroImage.alt : p.title,
    }))
    const existingSlugs = new Set(mapped.map((m) => m.id))
    const remainder = articles.filter((a) => !existingSlugs.has(a.id))
    return [...mapped, ...remainder]
  }, [cmsPosts])

  const [featured, ...secondary] = items

  return (
    <section id="journal" className="journal-section section-pad" aria-labelledby="journal-title">
      <div className="shell">
        <div className="section-intro section-intro--journal">
          <Reveal>
            <p className="eyebrow"><span>03</span> The journal</p>
            <h2 id="journal-title">Stories from<br />the <em>road.</em></h2>
          </Reveal>
          <Reveal className="section-intro__aside" delay={100}>
            <p>Field notes, practical guides and honest stories to help you travel more deeply.</p>
            <Link className="inline-link" href={articlePath(featured)}>
              Explore the journal <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </Reveal>
        </div>

        <Reveal as="article" className={`featured-story ${featured.premium ? 'featured-story--premium' : ''}`}>
          <Link className="featured-story__image" href={articlePath(featured)} aria-label={`Read ${featured.title}`}>
            <img src={featured.image} alt={featured.alt} loading="lazy" decoding="async" />
            <span>{featured.premium ? 'Premium Guide · Featured' : 'Field notes · 001'}</span>
            {featured.premium && <span className="premium-badge"><Star size={12} /> Premium Guide</span>}
          </Link>
          <div className="featured-story__content">
            <div className="story-kicker">
              <span>{featured.category}</span>
              <span><Clock size={12} style={{display:'inline', verticalAlign:'middle', marginRight:'4px'}} />{featured.readTime}</span>
            </div>
            <h3>{featured.title}</h3>
            <p>{featured.excerpt}</p>
            {/* Chips name real sections of the article — nothing it doesn't have. */}
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
              <Link href={articlePath(featured)}>
                {featured.premium ? 'Explore Guide' : 'Read article'} <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>

        <div className="secondary-stories">
          {secondary.map((article, index) => (
            <Reveal as="article" className={`story-card ${article.premium ? 'story-card--premium' : ''}`} key={article.id} delay={index * 80}>
              <Link className="story-card__image" href={articlePath(article)} aria-label={`Read ${article.title}`}>
                <img src={article.image} alt={article.alt} loading="lazy" decoding="async" />
                <span>0{index + 2}</span>
              </Link>
              <div className="story-kicker">
                <span>{article.category}</span>
                <span>{article.readTime}</span>
              </div>
              <h3><Link href={articlePath(article)}>{article.title}</Link></h3>
              <p>{article.excerpt}</p>
              <footer>
                <time>{article.date}</time>
                <Link href={articlePath(article)} aria-label={`Read ${article.title}`}><ArrowUpRight size={18} /></Link>
              </footer>
            </Reveal>
          ))}
        </div>
      </div>

      <style>{`
        .featured-story--premium {
          position: relative;
          border: none;
        }
        .featured-story--premium .featured-story__image {
          position: relative;
        }
        .premium-badge {
          position: absolute !important;
          top: 16px !important;
          right: 16px !important;
          left: auto !important;
          bottom: auto !important;
          background: #0F8378 !important;
          color: #fff !important;
          padding: 6px 12px !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          z-index: 2;
        }
        .premium-features {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }
        .premium-features span {
          font-size: 11px;
          padding: 4px 8px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.9);
        }
      `}</style>
    </section>
  )
}
