import Link from 'next/link'
import React from 'react'

import type { Post } from '@/payload-types'

import { CMSImage } from '@/components/CMSImage'
import { longDate } from '@/components/TripPage/format'

/** See the note on `TripCardData` — list queries return partial documents. */
export type PostCardData = Pick<
  Post,
  | 'authors'
  | 'categories'
  | 'excerpt'
  | 'heroImage'
  | 'id'
  | 'publishedAt'
  | 'readingTime'
  | 'slug'
  | 'title'
>

export function PostCard({
  post,
  sizes = '(max-width: 768px) 86vw, 32vw',
  variant = 'grid',
}: {
  post: PostCardData
  sizes?: string
  variant?: 'grid' | 'lead' | 'list'
}) {
  const category = post.categories?.find((c) => typeof c === 'object')
  const author = post.authors?.find((a) => typeof a === 'object')

  return (
    <article className={`card-post card-post--${variant}`}>
      <Link className="card-post__link" href={`/blog/${post.slug}`}>
        <div className="card-post__media">
          <CMSImage resource={post.heroImage} sizes={sizes} />
        </div>

        <div className="card-post__body">
          {category ? <p className="card-post__kicker">{category.title}</p> : null}
          <h3 className="card-post__title">{post.title}</h3>
          <p className="card-post__excerpt">{post.excerpt}</p>

          <p className="card-post__meta">
            {author ? <span>{author.name}</span> : null}
            {post.publishedAt ? <time dateTime={post.publishedAt}>{longDate(post.publishedAt)}</time> : null}
            {post.readingTime ? <span>{post.readingTime} min read</span> : null}
          </p>
        </div>
      </Link>
    </article>
  )
}
