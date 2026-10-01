import Link from 'next/link'
import React from 'react'

import { CMSLink } from '@/components/CMSLink'
import { getHeader, getSiteSettings } from '@/lib/queries/globals'

/**
 * Site navigation, driven by the Header global.
 *
 * A server component: the nav is identical for every visitor, so there is no
 * reason to ship it as JS. The mobile menu is a `<details>` disclosure, which
 * keeps that true — the usual `useState` hamburger would turn the whole
 * header into a client component.
 */
export async function SiteHeader() {
  const [header, settings] = await Promise.all([getHeader(), getSiteSettings()])

  const items = header.navItems ?? []

  return (
    <header className="site-header">
      <div className="site-header__inner shell">
        <Link className="site-header__brand" href="/">
          {settings.siteName || 'Hike Globally'}
        </Link>

        <nav aria-label="Primary" className="site-header__nav">
          <ul>
            {items.map((item, i) => (
              <li key={item.id ?? i}>
                {item.children?.length ? (
                  <details name="site-nav">
                    <summary>{item.link.label}</summary>
                    <ul className="site-header__sub">
                      {item.children.map((child, j) => (
                        <li key={child.id ?? j}>
                          <CMSLink link={child.link} />
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <CMSLink link={item.link} />
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          {/* The Header global stores only a LABEL for the CTA, not a link
              field — the destination is always the enquiry form. */}
          {header.ctaLabel ? (
            <Link className="blk-btn blk-btn--primary blk-btn--sm" href="/#enquire">
              {header.ctaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}
