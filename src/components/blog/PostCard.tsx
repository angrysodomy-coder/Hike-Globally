import Link from 'next/link'
import React from 'react'
import type { Category, Post } from '@/payload-types'
import { PayloadImage } from '@/components/PayloadImage'
import { formatDate } from '@/lib/formatters'

export const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const categories = (post.categories ?? []).filter(
    (c): c is Category => typeof c === 'object' && c !== null,
  )

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <PayloadImage
          media={post.heroImage}
          sizeName="card"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c.id}
                className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
              >
                {c.title}
              </span>
            ))}
          </div>
        )}
        <h3 className="mt-2 text-lg font-bold text-gray-900">{post.title}</h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{post.excerpt}</p>}
        <p className="mt-3 text-xs text-gray-500">
          {post.publishedAt && formatDate(post.publishedAt)}
          {post.authorName && ` · ${post.authorName}`}
        </p>
      </div>
    </Link>
  )
}
