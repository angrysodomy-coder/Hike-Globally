import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'
import { getPublishedPosts } from '@/lib/queries'
import { PostCard } from '@/components/blog/PostCard'
import { articles } from '@/data/content'

export const metadata: Metadata = {
  title: 'The Journal',
  description:
    'Trekking guides, gear advice and stories from the trail, written by the Hike Globally team in Kathmandu.',
}

// Safety-net ISR; the 'posts' cache tag is purged on publish for instant updates.
export const revalidate = 86400

type LegacyArticle = {
  id: string
  title: string
  excerpt: string
  category: string
  date: string
  readTime: string
  image: string
  alt: string
}

export default async function BlogPage() {
  const posts = await getPublishedPosts()
  const publishedSlugs = new Set(posts.map((post) => post.slug))
  const legacy = (articles as LegacyArticle[]).filter(
    (article) => !publishedSlugs.has(article.id),
  )

  return (
    <main id="main-content" className="cms-surface">
      <div className="mx-auto w-[min(1440px,calc(100vw-96px))] pt-[calc(var(--header-height)+clamp(40px,6vw,88px))] pb-20">
        <p className="cms-eyebrow">The journal</p>
        <h1 className="mt-5 max-w-4xl text-[clamp(2.2rem,1.5rem+3vw,4rem)] leading-[1.04] text-gray-900">
          Field notes from the Himalaya
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-gray-600">
          Route guides, gear advice, season planning and the stories our leaders bring back from
          the trail.
        </p>

        {posts.length > 0 && (
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {legacy.length > 0 && (
          <section className="mt-16">
            {posts.length > 0 && (
              <h2 className="text-[clamp(1.4rem,1.2rem+0.9vw,2rem)] text-gray-900">
                From the archive
              </h2>
            )}
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {legacy.map((article) => (
                <Link
                  key={article.id}
                  href={`/blog/${article.id}`}
                  className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative aspect-[3/2] overflow-hidden">
                    {/* Local, already-optimised assets — plain <img> keeps them
                        out of the Next image pipeline. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.image}
                      alt={article.alt}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-medium text-emerald-700">{article.category}</p>
                    <h3 className="mt-1 text-lg text-gray-900">{article.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{article.excerpt}</p>
                    <p className="mt-4 text-xs tracking-[0.12em] text-gray-500 uppercase">
                      {article.date} · {article.readTime}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
