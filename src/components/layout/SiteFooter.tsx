import Link from 'next/link'
import React from 'react'
import { getFooter } from '@/lib/queries'
import Logo from '@/components/Logo'

/** Server component — drop into your (frontend) layout below {children}. */
export const SiteFooter: React.FC = async () => {
  const footer = await getFooter()

  return (
    <footer className="cms-surface border-t border-gray-200 bg-gray-900 text-gray-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <Logo light />
          {footer?.aboutText && <p className="mt-3 text-sm text-gray-400">{footer.aboutText}</p>}
        </div>

        {(footer?.columns ?? []).map((col) => (
          <div key={col.id}>
            <p className="font-semibold text-white">{col.heading}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {(col.links ?? []).map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className="hover:text-emerald-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="font-semibold text-white">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-gray-400">
            {footer?.contact?.phone && <li>{footer.contact.phone}</li>}
            {footer?.contact?.email && (
              <li>
                <a href={`mailto:${footer.contact.email}`} className="hover:text-emerald-400">
                  {footer.contact.email}
                </a>
              </li>
            )}
            {footer?.contact?.address && <li className="whitespace-pre-line">{footer.contact.address}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-5 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Hike Globally. All rights reserved.
      </div>
    </footer>
  )
}
