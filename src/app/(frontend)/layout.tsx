import type { Metadata } from 'next'

import React from 'react'

import '@fontsource/dm-sans/latin-300.css'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/dm-sans/latin-700.css'
import '@fontsource/cal-sans/latin-400.css'
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/instrument-serif/latin-400-italic.css'

import '@/styles.css'
import '@/styles/destinations.css'
import '@/styles/trips.css'
import '@/styles/blog.css'
import '@/styles/detail.css'
import '@/styles/trip-single.css'
import '@/styles/trip-single-next.css'
import '@/styles/blocks.css'

import { SiteFooter } from '@/components/chrome/SiteFooter'
import { SiteHeader } from '@/components/chrome/SiteHeader'
import { getServerSideURL } from '@/lib/utils/getURL'

/**
 * Root layout for the public site.
 *
 * This is a SECOND root layout — `(payload)` has its own. Next allows one per
 * route group, which is what keeps the admin panel's styles completely
 * isolated from the marketing site's global CSS. Neither can leak into the
 * other, so `styles.css` resetting `:root` cannot break the admin UI.
 *
 * Fonts are imported as @fontsource CSS rather than via `next/font` so the
 * stack stays byte-identical to the Vite build during the migration — the
 * `--display` / `--sans` custom properties in styles.css name these families
 * directly.
 *
 * Payload is the source of truth for every public route. Rendering this route
 * group dynamically keeps `next build` independent of Postgres: Vercel can
 * create a deployment even when Neon is waking up or temporarily refuses a
 * build-worker connection. The pages still query Payload at request time.
 *
 * Do not replace this with build-time static generation unless the deployment
 * pipeline is deliberately allowed to depend on database availability.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  description:
    'Locally led Himalayan journeys — small groups, two leaders, every permit handled.',
  metadataBase: new URL(getServerSideURL()),
  title: { default: 'Hike Globally', template: '%s | Hike Globally' },
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
