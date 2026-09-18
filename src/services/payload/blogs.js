import { useEffect, useState, useCallback } from 'react'
import { payloadFetch } from './client'
import { getMediaUrl, getMediaAlt } from './media'
import { articles as fallbackArticles } from '../../data/content'

/**
 * Formats a date string into an editorial date format (e.g. "September 16, 2026").
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return 'September 2026'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

/**
 * Normalizes a blog document from Payload CMS.
 */
export function normalizeBlog(doc) {
  if (!doc) return null

  const categoryLabel =
    doc.categoryName ||
    (typeof doc.category === 'object' && doc.category !== null ? doc.category.name : doc.category) ||
    'Travel Guides'

  const resolvedImage = getMediaUrl(doc.featuredImage, 'card', doc.imageUrl || '/images/journal-kathmandu.webp')
  const resolvedAlt = getMediaAlt(doc.featuredImage, doc.alt || doc.title)

  const bodyParagraphs = doc.rawMarkdown
    ? doc.rawMarkdown.split('\n\n').filter(Boolean)
    : doc.excerpt
      ? [doc.excerpt]
      : []

  return {
    id: doc.slug || String(doc.id),
    cmsId: doc.id,
    title: doc.title,
    slug: doc.slug,
    category: categoryLabel,
    excerpt: doc.excerpt || '',
    content: doc.content || null,
    rawMarkdown: doc.rawMarkdown || '',
    body: bodyParagraphs,
    author: doc.author || 'Hike Globally',
    date: formatDisplayDate(doc.publishedDate),
    readTime: doc.readTime || '6 min read',
    image: resolvedImage,
    alt: resolvedAlt,
    premium: Boolean(doc.premium),
    tags: Array.isArray(doc.tags) ? doc.tags.map((t) => (typeof t === 'string' ? t : t.tag)) : [],
    metaTitle: doc.metaTitle || `${doc.title} — The Journal — Hike Globally`,
    metaDescription: doc.metaDescription || doc.excerpt,
  }
}

/**
 * Fetch all published blog articles from Payload CMS.
 */
export async function getBlogs() {
  const res = await payloadFetch('/api/blogs', {
    params: {
      limit: 50,
      'where[_status][equals]': 'published',
      sort: '-publishedDate',
      depth: 1,
    },
  })

  if (res.data && Array.isArray(res.data.docs) && res.data.docs.length > 0) {
    return {
      blogs: res.data.docs.map(normalizeBlog),
      total: res.data.totalDocs,
      error: null,
    }
  }

  return {
    blogs: fallbackArticles,
    total: fallbackArticles.length,
    error: res.error,
  }
}

/**
 * Fetch a single blog article by slug.
 */
export async function getBlogBySlug(slug) {
  if (!slug) return { blog: null, error: new Error('No slug provided') }

  const res = await payloadFetch('/api/blogs', {
    params: {
      'where[slug][equals]': slug,
      'where[_status][equals]': 'published',
      depth: 2,
    },
  })

  if (res.data && Array.isArray(res.data.docs) && res.data.docs.length > 0) {
    return {
      blog: normalizeBlog(res.data.docs[0]),
      error: null,
      notFound: false,
    }
  }

  const fallback = fallbackArticles.find((a) => a.id === slug || a.slug === slug)
  if (fallback) {
    return {
      blog: {
        ...fallback,
        slug: fallback.id,
      },
      error: res.error,
      notFound: false,
    }
  }

  return {
    blog: null,
    error: res.error,
    notFound: true,
  }
}

/**
 * React hook for blog listing.
 */
export function useBlogs() {
  const [blogs, setBlogs] = useState(fallbackArticles)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getBlogs()
    if (result.blogs && result.blogs.length > 0) {
      setBlogs(result.blogs)
    }
    setError(result.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { blogs, loading, error, refetch: load }
}

/**
 * React hook for a single blog article.
 */
export function useBlog(slug) {
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    const result = await getBlogBySlug(slug)
    setBlog(result.blog)
    setError(result.error)
    setNotFound(result.notFound)
    setLoading(false)
  }, [slug])

  useEffect(() => {
    load()
  }, [load])

  return { blog, loading, error, notFound, refetch: load }
}
