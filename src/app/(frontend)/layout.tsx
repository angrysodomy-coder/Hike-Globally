import type { Metadata, Viewport } from 'next'
import React from 'react'

import '@fontsource/dm-sans/latin-300.css'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/dm-sans/latin-700.css'
import '@fontsource/cal-sans/latin-400.css'
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/instrument-serif/latin-400-italic.css'

import '../../styles.css'
import '../../styles/destinations.css'
import '../../styles/trips.css'
import '../../styles/blog.css'
import '../../styles/detail.css'
import '../../styles/trip-single.css'
import '../../styles/cms.css'

import SiteShell from '@/components/SiteShell'
import { getHeader } from '@/lib/queries'

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(serverURL),
  title: {
    default: 'Hike Globally — Premium Himalayan Journeys',
    template: '%s | Hike Globally',
  },
  description:
    'Small-group Himalayan journeys, crafted by local experts. Explore premium treks through Everest, Annapurna, Manaslu, Langtang and Upper Mustang.',
  keywords: [
    'Nepal trekking',
    'Everest Base Camp',
    'Annapurna trek',
    'Manaslu Circuit',
    'luxury adventure travel',
  ],
  openGraph: {
    title: 'Hike Globally — Journeys beyond the ordinary',
    description:
      'Curated Himalayan journeys designed to stay with you long after the trail ends.',
    type: 'website',
    images: ['/images/hero-himalaya.webp'],
  },
  icons: {
    // The brand mark: teal disc, ivory ridgeline (see src/components/Logo.jsx).
    icon: `data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#0f8378"/><path d="M16 70 41 31l13 19 10-14 20 34" fill="none" stroke="#F1FAEE" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    )}`,
  },
}

export const viewport: Viewport = {
  themeColor: '#0f8378',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

/** Nav items from the Payload `header` global. The site must still render if
 *  the database is unreachable (or empty before the first seed), so a failure
 *  here degrades to the hand-authored nav in `src/data/content.js`. */
async function getNavItems() {
  try {
    const header = await getHeader()
    return (header?.navItems ?? []).map(({ label, href }) => ({ label, href }))
  } catch (error) {
    console.error('[header global]', error)
    return []
  }
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const navItems = await getNavItems()

  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          as="image"
          href="/images/hero-himalaya.webp"
          media="(min-width: 768px)"
        />
        <link
          rel="preload"
          as="image"
          href="/images/hero-himalaya-mobile.webp"
          media="(max-width: 767px)"
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <SiteShell navItems={navItems}>{children}</SiteShell>
      </body>
    </html>
  )
}
