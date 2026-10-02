/**
 * OPTIONAL: CMS-driven homepage.
 *
 * Rename this file to `page.tsx` (replacing your current homepage) once you
 * want the homepage managed in Payload. It renders the Pages doc with slug
 * 'home' — which `pnpm seed:content` creates — through the same block
 * renderer as every other CMS page. Until then, your existing page.tsx
 * keeps serving the homepage and nothing breaks.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import React from 'react'
import { getPageBySlug } from '@/lib/queries'
import { generatePageMeta } from '@/lib/generateMeta'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { RenderBlocks } from '@/components/RenderBlocks'

export const revalidate = 86400

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('home')
  return generatePageMeta(page)
}

export default async function HomePage() {
  const { isEnabled: draft } = await draftMode()
  const page = await getPageBySlug('home')

  if (!page) notFound()

  return (
    <main>
      {draft && <LivePreviewListener />}
      <RenderBlocks blocks={page.layout} />
    </main>
  )
}
