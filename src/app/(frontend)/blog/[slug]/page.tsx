import type { Metadata } from 'next'

import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { CMSImage } from '@/components/CMSImage'
import { JsonLd } from '@/components/JsonLd'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { RichText } from '@/components/RichText'
import { longDate } from '@/components/TripPage/format'
import { getAllPostSlugs, getPostBySlug } from '@/lib/queries/posts'
import { breadcrumbJsonLd } from '@/lib/seo/jsonLd'
import { generateMeta } from '@/lib/seo/generateMeta'
import { getServerSideURL } from '@/lib/utils/getURL'

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export const dynamicParams = true
export const revalidate = 3600

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  return generateMeta({ doc: post, pathname: `/blog/${slug}` })
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params
  const { isEnabled: draft } = await draftMode()

  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const authors = (post.authors ?? []).filter((a) => typeof a === 'object')
  const categories = (post.categories ?? []).filter((c) => typeof c === 'object')
  const hero = typeof post.heroImage === 'object' ? post.heroImage : null

  return (
    <main className="post" id="main-content">
      {draft ? <LivePreviewListener /> : null}

      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            author: authors.map((a) => ({ '@type': 'Person', name: a.name })),
            dateModified: post.updatedAt,
            datePublished: post.publishedAt ?? post.createdAt,
            description: post.excerpt,
            headline: post.title,
            image: hero?.url
              ? [hero.url.startsWith('http') ? hero.url : `${getServerSideURL()}${hero.url}`]
              : [],
            mainEntityOfPage: `${getServerSideURL()}/blog/${post.slug}`,
            publisher: { '@type': 'Organization', name: 'Hike Globally' },
          },
          breadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Journal', url: '/blog' },
            { name: post.title, url: `/blog/${post.slug}` },
          ]),
        ]}
      />

      <header className="post__head">
        <div className="shell">
          <nav aria-label="Breadcrumb" className="post__crumbs">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/blog">Journal</Link>
          </nav>

          {categories.length ? (
            <p className="eyebrow">{categories.map((c) => c.title).join(' · ')}</p>
          ) : null}
          <h1>{post.title}</h1>
          <p className="post__excerpt">{post.excerpt}</p>

          <div className="post__byline">
            {authors.map((author) => (
              <span className="post__author" key={author.id}>
                <span aria-hidden="true" className="post__avatar">
                  {author.initials || author.name.slice(0, 2).toUpperCase()}
                </span>
                <span>
                  <strong>{author.name}</strong>
                  <small>{author.role}</small>
                </span>
              </span>
            ))}
            <dl className="post__meta">
              {post.publishedAt ? (
                <div>
                  <dt>Published</dt>
                  <dd>
                    <time dateTime={post.publishedAt}>{longDate(post.publishedAt)}</time>
                  </dd>
                </div>
              ) : null}
              {post.readingTime ? (
                <div>
                  <dt>Reading time</dt>
                  <dd>{post.readingTime} min</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      </header>

      <figure className="post__hero">
        <div className="post__heroFrame">
          <CMSImage priority resource={post.heroImage} sizes="(max-width: 1100px) 100vw, 1100px" />
        </div>
      </figure>

      <article className="post__body shell">
        <RichText className="blk-prose" data={post.content} />
      </article>
    </main>
  )
}
