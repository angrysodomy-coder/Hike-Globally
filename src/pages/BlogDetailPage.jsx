import { ArrowLeft, ArrowRight, ArrowUpRight, Clock3, RefreshCw, User, X } from 'lucide-react'
import { useBlog } from '../services/payload/blogs'
import { Link, useRouter, usePageMeta } from '../lib/router'
import SummerFamilyTreksBlog from '../components/SummerFamilyTreksBlog'

export default function BlogDetailPage({ slug, onBook }) {
  const { navigate } = useRouter()
  const { blog, loading, error, notFound, refetch } = useBlog(slug)

  usePageMeta({
    title: blog ? `${blog.title} — The Journal — Hike Globally` : 'Article — The Journal',
    description: blog?.metaDescription || blog?.excerpt || 'Field notes from the trail.',
  })

  // If this is the premium family treks guide, render the specialized full-length guide
  if (slug === 'best-summer-treks-family-nepal-beginners' || blog?.id === 'best-summer-treks-family-nepal-beginners') {
    return (
      <SummerFamilyTreksBlog
        onClose={() => navigate('/blog')}
        onBook={() => onBook?.()}
      />
    )
  }

  if (loading) {
    return (
      <main className="blog-detail-page section-pad">
        <div className="shell">
          <div className="detail-skeleton">
            <div className="skeleton-bar skeleton-bar--short" />
            <div className="skeleton-bar skeleton-bar--title" />
            <div className="skeleton-hero" />
          </div>
        </div>
      </main>
    )
  }

  if (notFound || (!blog && !loading && !error)) {
    return (
      <main className="blog-detail-page section-pad text-center">
        <div className="shell">
          <p className="eyebrow"><span>404</span> Article Not Found</p>
          <h2>This story has faded from the trail.</h2>
          <p className="detail-error__desc">
            The journal entry you are looking for does not exist or may have been updated.
          </p>
          <div className="detail-error__actions">
            <Link href="/blog" className="button button--primary">
              <ArrowLeft size={16} /> Return to the Journal
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (error && !blog) {
    return (
      <main className="blog-detail-page section-pad text-center">
        <div className="shell">
          <p className="eyebrow">Connection Notice</p>
          <h2>Unable to reach the journal archive</h2>
          <button type="button" className="button button--primary" onClick={() => refetch()}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </main>
    )
  }

  return (
    <article className="blog-detail-page">
      <header className="blog-bar">
        <Link href="/blog" className="blog-bar__close">
          <ArrowLeft size={16} aria-hidden="true" /> <span>The Journal</span>
        </Link>
        <p className="blog-bar__title">{blog.title}</p>
        <button className="blog-bar__cta" type="button" onClick={() => onBook?.()}>
          Plan my trip <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </header>

      <section className="blog-hero">
        <div className="blog-hero__media" aria-hidden="true">
          <img src={blog.image} alt={blog.alt || ''} />
        </div>
        <div className="blog-hero__inner shell">
          <div className="story-kicker">
            <span>{blog.category}</span>
            <span><Clock3 size={13} /> {blog.readTime}</span>
          </div>
          <h1>{blog.title}</h1>
          <div className="blog-byline">
            <span>Words by <strong>{blog.author}</strong></span>
            <span aria-hidden="true">·</span>
            <time>{blog.date}</time>
          </div>
        </div>
      </section>

      <div className="shell blog-body-shell">
        <div className="blog-prose-container">
          <p className="blog-standfirst">{blog.excerpt}</p>

          <div className="blog-prose-body">
            {blog.body && blog.body.length > 0 ? (
              blog.body.map((para, idx) => <p key={idx}>{para}</p>)
            ) : (
              <p>{blog.rawMarkdown}</p>
            )}
          </div>

          {blog.tags && blog.tags.length > 0 && (
            <div className="blog-tags">
              {blog.tags.map((tag) => (
                <span key={tag} className="blog-tag-pill">#{tag}</span>
              ))}
            </div>
          )}

          <aside className="blog-cta-box">
            <div>
              <h3>Ready to see it for yourself?</h3>
              <p>Our Kathmandu trip designers craft bespoke itineraries tailored to your pace.</p>
            </div>
            <button
              type="button"
              className="button button--primary"
              onClick={() => onBook?.()}
            >
              Plan a journey <ArrowRight size={17} />
            </button>
          </aside>
        </div>
      </div>
    </article>
  )
}
