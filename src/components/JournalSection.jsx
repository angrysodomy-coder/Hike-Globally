import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { articles } from '../data/content'
import Reveal from './Reveal'

export default function JournalSection({ onRead }) {
  const [featured, ...secondary] = articles

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
            <button className="inline-link" type="button" onClick={() => onRead(featured)}>
              Explore the journal <ArrowUpRight size={17} aria-hidden="true" />
            </button>
          </Reveal>
        </div>

        <Reveal as="article" className="featured-story">
          <button type="button" className="featured-story__image" onClick={() => onRead(featured)} aria-label={`Read ${featured.title}`}>
            <img src={featured.image} alt={featured.alt} loading="lazy" decoding="async" />
            <span>Field notes · 001</span>
          </button>
          <div className="featured-story__content">
            <div className="story-kicker">
              <span>{featured.category}</span>
              <span>{featured.readTime}</span>
            </div>
            <h3>{featured.title}</h3>
            <p>{featured.excerpt}</p>
            <div className="featured-story__foot">
              <time>{featured.date}</time>
              <button type="button" onClick={() => onRead(featured)}>
                Read article <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        </Reveal>

        <div className="secondary-stories">
          {secondary.map((article, index) => (
            <Reveal as="article" className="story-card" key={article.id} delay={index * 80}>
              <button type="button" className="story-card__image" onClick={() => onRead(article)} aria-label={`Read ${article.title}`}>
                <img src={article.image} alt={article.alt} loading="lazy" decoding="async" />
                <span>0{index + 2}</span>
              </button>
              <div className="story-kicker">
                <span>{article.category}</span>
                <span>{article.readTime}</span>
              </div>
              <h3><button type="button" onClick={() => onRead(article)}>{article.title}</button></h3>
              <p>{article.excerpt}</p>
              <footer>
                <time>{article.date}</time>
                <button type="button" onClick={() => onRead(article)} aria-label={`Read ${article.title}`}><ArrowUpRight size={18} /></button>
              </footer>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
