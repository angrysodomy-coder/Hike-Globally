import Link from 'next/link'
import React from 'react'
import { getHeader } from '@/lib/queries'
import Logo from '@/components/Logo'

/**
 * Server component — drop into your (frontend) layout:
 *   <SiteHeader />
 * Nav items come from the Header global; cached with tag 'global-header'
 * and purged the moment an editor saves the global.
 */
export const SiteHeader: React.FC = async () => {
  const header = await getHeader()

  return (
    <header className="cms-surface sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="Hike Globally home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-6">
          {(header?.navItems ?? []).map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="text-sm font-medium text-gray-700 hover:text-emerald-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
