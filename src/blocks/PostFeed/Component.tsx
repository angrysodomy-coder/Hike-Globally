import React from 'react'

import type { Post, PostFeedBlock } from '@/payload-types'

import { PostCard } from '@/components/cards/PostCard'
import { getPayloadClient } from '@/lib/payload'

export async function PostFeedBlockComponent({
  categories,
  heading,
  intro,
  layout,
  limit,
  posts,
  source,
}: PostFeedBlock) {
  let docs: Post[] = []

  if (source === 'manual') {
    docs = (posts ?? []).filter((p): p is Post => typeof p === 'object')
  } else {
    const payload = await getPayloadClient()
    const and: Record<string, unknown>[] = [{ _status: { equals: 'published' } }]

    if (categories?.length) {
      and.push({ categories: { in: categories.map((c) => (typeof c === 'object' ? c.id : c)) } })
    }

    const result = await payload.find({
      collection: 'posts',
      depth: 1,
      limit: limit ?? 3,
      overrideAccess: false,
      sort: '-publishedAt',
      where: { and } as never,
    })
    docs = result.docs
  }

  if (!docs.length) return null

  // In 'lead' layout the first post is rendered large and the rest listed.
  const [lead, ...rest] = docs

  return (
    <section className="blk-postFeed section-pad">
      <div className="shell">
        {heading ? <h2>{heading}</h2> : null}
        {intro ? <p className="blk-intro">{intro}</p> : null}

        {layout === 'lead' ? (
          <div className="blk-postFeed__lead">
            <PostCard post={lead} sizes="(max-width: 768px) 100vw, 55vw" variant="lead" />
            <div className="blk-postFeed__rest">
              {rest.map((post) => (
                <PostCard key={post.id} post={post} sizes="(max-width: 768px) 100vw, 25vw" variant="list" />
              ))}
            </div>
          </div>
        ) : (
          <div className={`blk-postFeed__${layout}`}>
            {docs.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                sizes={layout === 'list' ? '(max-width: 768px) 100vw, 30vw' : '(max-width: 768px) 86vw, 32vw'}
                variant={layout}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
