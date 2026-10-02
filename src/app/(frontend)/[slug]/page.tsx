import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import React from 'react'
import { getPayloadClient, getPageBySlug } from '@/lib/queries'
import { redirectOrNotFound } from '@/lib/redirects'
import { generatePageMeta } from '@/lib/generateMeta'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { RenderBlocks } from '@/components/RenderBlocks'
import { safeStaticParams } from '@/lib/safeStaticParams'

type Args = { params: Promise<{ slug: string }> }

export const revalidate = 86400
export const dynamicParams = true

export async function generateStaticParams() {
  return safeStaticParams('pages/[slug]', async () => {
    const payload = await getPayloadClient()
    const pages = await payload.find({
      collection: 'pages',
      where: { _status: { equals: 'published' } },
      select: { slug: true },
      limit: 1000,
      pagination: false,
    })
    return pages.docs
      .filter(({ slug }) => slug !== 'home') // home is served by app/(frontend)/page.tsx
      .map(({ slug }) => ({ slug }))
  })
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  return generatePageMeta(page)
}

export default async function CmsPage({ params }: Args) {
  const { slug } = await params
  const { isEnabled: draft } = await draftMode()
  const page = await getPageBySlug(slug)

  if (!page) return redirectOrNotFound(`/${slug}`)

  return (
    <main id="main-content" className="cms-surface cms-page">
      {draft && <LivePreviewListener />}
      <RenderBlocks blocks={page.layout} />
    </main>
  )
}
