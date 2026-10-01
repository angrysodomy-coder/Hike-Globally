import BlogPage from './BlogPage'
/* The article body IS the markdown file at the repository root, imported raw and
 * rendered as written — no rewritten or summarised copy lives in this component.
 * scripts/check-blog-content.mjs renders this component and fails if its text
 * differs from the .md file by a single character. */
import sourceMarkdown from '../../Best Summer Treks For Family in Nepal For Beginners.md?raw'
import { ARTICLE_TITLE } from '../lib/articleMarkdown'

export default function SummerFamilyTreksBlog({ onBook }) {
  return (
    <BlogPage
      title={ARTICLE_TITLE}
      markdown={sourceMarkdown}
      image="/images/blog-family-summer-hero.jpg"
      imageAlt="Happy family trekking in Nepal during summer monsoon season with lush green Himalayan backdrop"
      kicker="Family Guides"
      readTime="10 min read"
      date="September 16, 2026"
      author="Nima Sherpa"
      articleId="best-summer-treks-family-nepal-beginners"
      onBook={onBook}
    />
  )
}
