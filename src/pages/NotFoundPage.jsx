import { ArrowLeft, Compass } from 'lucide-react'
import { Link, usePageMeta } from '../lib/router'

export default function NotFoundPage() {
  usePageMeta({
    title: '404 · Page Not Found — Hike Globally',
    description: 'The requested page could not be found on the trail.',
  })

  return (
    <main className="not-found-page section-pad text-center">
      <div className="shell">
        <div className="not-found-icon">
          <Compass size={48} strokeWidth={1.5} />
        </div>
        <p className="eyebrow"><span>404</span> Off The Trail</p>
        <h2>This path has ended.</h2>
        <p className="not-found-lead">
          The page or journey you are looking for has been moved, renamed, or does not exist.
        </p>
        <div className="not-found-actions">
          <Link href="/" className="button button--primary">
            <ArrowLeft size={16} /> Return to Homepage
          </Link>
          <Link href="/trips" className="button button--secondary">
            Explore All Journeys
          </Link>
        </div>
      </div>
    </main>
  )
}
