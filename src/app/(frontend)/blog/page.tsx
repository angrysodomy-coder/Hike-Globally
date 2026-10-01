import type { Metadata } from 'next'

import Link from 'next/link'
import React from 'react'

import { PostCard } from '@/components/cards/PostCard'
import { JsonLd } from '@/components/JsonLd'
import { getPosts } from '@/lib/queries/posts'
import { breadcrumbJsonLd } from '@/lib/seo/jsonLd'
import { generateMeta } from '@/lib/seo/generateMeta'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    doc: {
      meta: {
        description: 'Field notes, route guides and trip reports from the Hike Globally team.',
        title: 'Journal | Hike Globally',
      },
      title: 'Journal',
    },
    pathname: '/blog',
  })
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const result = await getPosts({ limit: 9, page: Number(page) || 1 })

  return (
    <main className="blog-index" id="main-content">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Journal', url: '/blog' },
        ])}
      />

      <header className="section-pad">
        <div className="shell">
          <p className="eyebrow">Field notes</p>
          <h1>Journal</h1>
        </div>
      </header>

      <div className="shell">
        {result.docs.length ? (
          <div className="blk-postFeed__grid">
            {result.docs.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="blk-intro">Nothing published yet.</p>
        )}

        {result.totalPages > 1 ? (
          <nav aria-label="Pagination" className="trips-index__pages">
            {result.hasPrevPage ? <Link href={`/blog?page=${result.page! - 1}`}>← Previous</Link> : null}
            <span>
              Page {result.page} of {result.totalPages}
            </span>
            {result.hasNextPage ? <Link href={`/blog?page=${result.page! + 1}`}>Next →</Link> : null}
          </nav>
        ) : null}
      </div>
    </main>
  )
}
