import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayloadClient, getPostBySlug } from '@/lib/queries'
import { redirectOrNotFound } from '@/lib/redirects'
import { generatePostMeta } from '@/lib/generateMeta'
import { postJsonLd } from '@/lib/structuredData'
import { formatDate } from '@/lib/formatters'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { PayloadImage } from '@/components/PayloadImage'
import { TripCard } from '@/components/trips/TripCard'
import BlogArticleRoute from '@/views/routes/BlogArticleRoute'
import { articles } from '@/data/content'
import type { Category, Trip } from '@/payload-types'

type Args = { params: Promise<{ slug: string }> }

export const revalidate = 86400
export const dynamicParams = true

const legacyArticle = (slug: string) =>
  (articles as Array<{ id: string; title: string; excerpt: string; image: string }>).find(
    (article) => article.id === slug,
  )

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const posts = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    select: { slug: true },
    limit: 1000,
    pagination: false,
  })
  return posts.docs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (post) return generatePostMeta(post)

  const legacy = legacyArticle(slug)
  if (!legacy) return {}

  return {
    title: legacy.title,
    description: legacy.excerpt,
    openGraph: {
      title: legacy.title,
      description: legacy.excerpt,
      type: 'article',
      images: legacy.image ? [legacy.image] : undefined,
    },
  }
}

/* Payload first; the original journal stories keep rendering from
   `src/data/content.js` until an editor re-publishes them in the CMS. */
export default async function PostPage({ params }: Args) {
  const { slug } = await params
  const { isEnabled: draft } = await draftMode()
  const post = await getPostBySlug(slug)

  if (!post) {
    if (legacyArticle(slug)) return <BlogArticleRoute slug={slug} />
    return redirectOrNotFound(`/blog/${slug}`)
  }

  const categories = (post.categories ?? []).filter(
    (c): c is Category => typeof c === 'object' && c !== null,
  )
  const relatedTrips = (post.relatedTrips ?? []).filter(
    (t): t is Trip => typeof t === 'object' && t !== null && t._status === 'published',
  )

  return (
    <article className="cms-surface" id="main-content">
      {draft && <LivePreviewListener />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd(post)) }}
      />

      {/* Hero */}
      <header className="relative h-[58vh] min-h-[400px] w-full">
        <PayloadImage media={post.heroImage} sizeName="hero" fill priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1b2c]/85 via-[#0b1b2c]/25 to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 mx-auto max-w-3xl px-6 pb-12 text-white">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full border border-white/35 bg-white/10 px-3 py-1 text-[0.7rem] font-medium tracking-[0.14em] uppercase backdrop-blur"
                >
                  {c.title}
                </span>
              ))}
            </div>
          )}
          <h1 className="mt-4 text-[clamp(2rem,1.4rem+2.6vw,3.4rem)] leading-[1.06]">
            {post.title}
          </h1>
          <p className="mt-4 text-sm text-white/75">
            {post.publishedAt && formatDate(post.publishedAt)}
            {post.authorName && ` · ${post.authorName}`}
          </p>
        </div>
      </header>

      {/* Body */}
      <div className="cms-prose mx-auto max-w-3xl px-6 py-16">
        <RichText data={post.content} />
      </div>

      {/* Cross-sell: related trips */}
      {relatedTrips.length > 0 && (
        <aside className="mx-auto w-[min(1440px,calc(100vw-96px))] border-t border-gray-200 pt-14 pb-20">
          <p className="cms-eyebrow">Walk it yourself</p>
          <h2 className="mt-4 text-[clamp(1.6rem,1.3rem+1.2vw,2.3rem)] text-gray-900">
            Trips featured in this article
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </aside>
      )}
    </article>
  )
}
