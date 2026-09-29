import { ArrowLeft, ArrowRight, ArrowUpRight, Clock3 } from 'lucide-react'
import { articles } from '../data/content'
import { Link, useRouter, usePageMeta } from '../lib/router'
import SummerFamilyTreksBlog from '../components/SummerFamilyTreksBlog'
import Reveal from '../components/Reveal'

/* ------------------------------------------------------------------
   BlogArticlePage — the standalone page every journal story resolves
   to (`/blog/<slug>`). The premium markdown guide keeps its dedicated
   long-form renderer; every other article gets the editorial page
   layout below.
   ------------------------------------------------------------------ */

function NotFound() {
  usePageMeta({ title: 'Article not found — Hike Globally' })
  return (
    <main id="main-content" className="article-page article-page--missing">
      <div className="shell">
        <p className="eyebrow"><span>—</span> Lost page</p>
        <h1>We couldn’t find that story.</h1>
        <p>The article you followed doesn’t match anything in the journal.</p>
        <Link className="button button--dark" href="/#journal">
          <span>Back to the journal</span><ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </main>
  )
}

export default function BlogArticlePage({ slug, onBook }) {
  const { navigate } = useRouter()
  const article = articles.find((item) => item.id === slug)

  usePageMeta({
    title: article ? `${article.title} — Hike Globally` : 'Article not found — Hike Globally',
    description: article?.excerpt,
  })

  if (!article) return <NotFound />

  /* The premium guide is rendered verbatim from its markdown source. */
  if (article.premium) {
    return (
      <SummerFamilyTreksBlog
        onClose={() => navigate('/#journal')}
        onBook={() => onBook()}
      />
    )
  }

  return (
    <main id="main-content" className="article-page">
      <section className="article-page__hero">
        <div className="article-page__hero-media" aria-hidden="true">
          <img src={article.image} alt="" />
        </div>
        <div className="article-page__hero-inner shell">
          <Link className="article-page__back" href="/#journal">
            <ArrowLeft size={15} aria-hidden="true" /> The journal
          </Link>
          <div className="story-kicker">
            <span>{article.category}</span>
            <span><Clock3 size={13} aria-hidden="true" /> {article.readTime}</span>
          </div>
          <h1>{article.title}</h1>
        </div>
      </section>

      <div className="article-page__layout shell">
        <article className="article-page__body">
          <Reveal>
            <p className="article-page__standfirst">{article.excerpt}</p>
            <div className="article-page__byline">
              <span>Words by <strong>Nima Sherpa</strong></span>
              <time>{article.date}</time>
            </div>
          </Reveal>
          <Reveal className="article-page__copy">
            {article.body?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </Reveal>
          <Reveal as="aside" className="article-page__cta">
            <span>Ready to see it for yourself?</span>
            <button type="button" onClick={() => onBook()}>
              Plan a journey <ArrowRight size={17} aria-hidden="true" />
            </button>
          </Reveal>
        </article>

        <aside className="article-page__more">
          <p className="eyebrow"><span>More</span> from the journal</p>
          <ul>
            {articles
              .filter((item) => item.id !== article.id)
              .slice(0, 3)
              .map((item) => (
                <li key={item.id}>
                  <Link href={`/blog/${item.id}`}>
                    <small>{item.category}</small>
                    {item.title}
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
          </ul>
        </aside>
      </div>
    </main>
  )
}
