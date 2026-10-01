import type { Metadata } from 'next'

import { draftMode } from 'next/headers'
import React from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { getPageBySlug } from '@/lib/queries/pages'
import { getSiteSettings } from '@/lib/queries/globals'
import { generateMeta } from '@/lib/seo/generateMeta'
import { getServerSideURL } from '@/lib/utils/getURL'

export const revalidate = 3600

/**
 * The homepage is the Page whose slug is `home`, by the convention set in
 * `documentHref()`. Keeping it in the same collection means the homepage is
 * editable with the same blocks as any other page, rather than being a
 * special case nobody can change without a deploy.
 */
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('home')
  return generateMeta({ doc: page, pathname: '/' })
}

export default async function HomePage() {
  const { isEnabled: draft } = await draftMode()
  const [page, settings] = await Promise.all([getPageBySlug('home'), getSiteSettings()])

  return (
    <>
      {draft ? <LivePreviewListener /> : null}

      {/* Organisation schema belongs on the homepage only — repeating it on
          every page is a common and pointless duplication. */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'TravelAgency',
          address: {
            '@type': 'PostalAddress',
            addressCountry: settings.address?.country ?? 'NP',
            addressLocality: settings.address?.city ?? 'Kathmandu',
            postalCode: settings.address?.postalCode ?? undefined,
            streetAddress: settings.address?.street ?? undefined,
          },
          email: settings.email,
          name: settings.legalName || settings.siteName,
          sameAs: (settings.socials ?? []).map((s) => s.url),
          telephone: settings.phone ?? undefined,
          url: getServerSideURL(),
        }}
      />

      <main id="main-content">
        {page ? (
          <RenderBlocks blocks={page.layout} />
        ) : (
          <div className="shell section-pad">
            <h1>{settings.siteName}</h1>
            <p className="blk-intro">
              No homepage has been published yet. Create a Page with the slug{' '}
              <code>home</code> in the admin panel.
            </p>
          </div>
        )}
      </main>
    </>
  )
}
