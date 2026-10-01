import type { Metadata } from 'next'

import { draftMode } from 'next/headers'
import React from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { getAllPageSlugs, getPageBySlug } from '@/lib/queries/pages'
import { breadcrumbJsonLd } from '@/lib/seo/jsonLd'
import { generateMeta } from '@/lib/seo/generateMeta'

export async function generateStaticParams() {
  const slugs = await getAllPageSlugs()
  // 'home' is rendered by app/(frontend)/page.tsx at `/`, not here.
  return slugs.filter((slug) => slug !== 'home').map((slug) => ({ slug: [slug] }))
}

export const dynamicParams = true
export const revalidate = 3600

type Params = Promise<{ slug?: string[] }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug = [] } = await params
  const page = await getPageBySlug(slug.join('/'))

  return page ? generateMeta({ doc: page, pathname: `/${slug.join('/')}` }) : {}
}

export default async function CatchAllPage({ params }: { params: Params }) {
  const { slug = [] } = await params
  const path = slug.join('/')
  const { isEnabled: draft } = await draftMode()

  const page = await getPageBySlug(path)

  /**
   * Before 404ing, check the redirects table. A renamed slug should 301 to
   * its new home, not die — this is the difference between keeping a page's
   * accumulated ranking and losing it.
   */
  if (!page) return <PayloadRedirects url={`/${path}`} />

  return (
    <>
      {/* Still consulted on a resolved page: a redirect created for a slug
          that has since been reused must win over the stale document. */}
      <PayloadRedirects disableNotFound url={`/${path}`} />
      {draft ? <LivePreviewListener /> : null}

      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: page.title, url: `/${path}` },
        ])}
      />

      <main id="main-content">
        <RenderBlocks blocks={page.layout} />
      </main>
    </>
  )
}
