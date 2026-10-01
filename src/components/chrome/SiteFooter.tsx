import React from 'react'

import { CMSImage } from '@/components/CMSImage'
import { CMSLink } from '@/components/CMSLink'
import { getFooter, getSiteSettings } from '@/lib/queries/globals'

export async function SiteFooter() {
  const [footer, settings] = await Promise.all([getFooter(), getSiteSettings()])

  return (
    <footer className="site-footer">
      <div className="site-footer__inner shell">
        <div className="site-footer__brand">
          <p className="site-footer__name">{settings.siteName}</p>
          {settings.tagline ? <p className="site-footer__tagline">{settings.tagline}</p> : null}

          <address className="site-footer__contact">
            <a href={`mailto:${settings.email}`}>{settings.email}</a>
            {settings.phone ? <a href={`tel:${settings.phone}`}>{settings.phone}</a> : null}
            {settings.address?.city ? (
              <span>
                {[settings.address.city, settings.address.country].filter(Boolean).join(', ')}
              </span>
            ) : null}
          </address>

          {settings.socials?.length ? (
            <ul className="site-footer__socials">
              {settings.socials.map((social, i) => (
                <li key={social.id ?? i}>
                  <a href={social.url} rel="noopener noreferrer me" target="_blank">
                    {social.platform}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {footer.columns?.length ? (
          <div className="site-footer__columns">
            {footer.columns.map((column, i) => (
              <nav aria-label={column.title} key={column.id ?? i}>
                <p className="site-footer__colTitle">{column.title}</p>
                <ul>
                  {(column.links ?? []).map((item, j) => (
                    <li key={item.id ?? j}>
                      <CMSLink link={item.link} />
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        ) : null}
      </div>

      {footer.certifications?.length ? (
        <ul className="site-footer__certs shell">
          {footer.certifications.map((cert, i) => (
            <li key={cert.id ?? i}>
              {cert.logo ? (
                <span className="site-footer__certLogo">
                  <CMSImage resource={cert.logo} sizes="90px" />
                </span>
              ) : (
                cert.title
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="site-footer__legal shell">
        <p>
          {footer.legalLine ||
            `© ${new Date().getFullYear()} ${settings.legalName}. All rights reserved.`}
        </p>
        {footer.legalLinks?.length ? (
          <ul>
            {footer.legalLinks.map((item, i) => (
              <li key={item.id ?? i}>
                <CMSLink link={item.link} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </footer>
  )
}
