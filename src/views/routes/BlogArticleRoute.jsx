'use client'

import BlogArticlePage from '../BlogArticlePage'
import { useSite } from '../../components/SiteShell'

export default function BlogArticleRoute({ slug }) {
  const { openBooking } = useSite()
  return <BlogArticlePage key={slug} slug={slug} onBook={openBooking} />
}
