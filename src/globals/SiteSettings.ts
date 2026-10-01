import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { CURRENCY_OPTIONS } from '@/fields/options'
import { revalidateGlobal } from '@/hooks/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',

  admin: { group: 'Site' },

  access: { read: anyone, update: authenticated },

  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Brand',
          fields: [
            { name: 'siteName', type: 'text', required: true, defaultValue: 'Hike Globally' },
            { name: 'tagline', type: 'text' },
            { name: 'logo', type: 'upload', relationTo: 'media' },
            {
              name: 'defaultOgImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: '1200×630. Used whenever a page has no SEO image of its own.',
              },
            },
          ],
        },
        {
          label: 'Organisation',
          fields: [
            {
              name: 'legalName',
              type: 'text',
              required: true,
              admin: { description: 'Used in Organization structured data.' },
            },
            { name: 'email', type: 'email', required: true },
            { name: 'phone', type: 'text' },
            {
              name: 'address',
              type: 'group',
              fields: [
                { name: 'street', type: 'text' },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'city',
                      type: 'text',
                      defaultValue: 'Kathmandu',
                      admin: { width: '33%' },
                    },
                    {
                      name: 'region',
                      type: 'text',
                      defaultValue: 'Bagmati',
                      admin: { width: '33%' },
                    },
                    { name: 'postalCode', type: 'text', admin: { width: '34%' } },
                  ],
                },
                {
                  name: 'country',
                  type: 'text',
                  defaultValue: 'NP',
                  admin: { description: 'ISO 3166-1 alpha-2.' },
                },
              ],
            },
            {
              name: 'socials',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'platform',
                      type: 'select',
                      required: true,
                      admin: { width: '40%' },
                      options: [
                        { label: 'Instagram', value: 'instagram' },
                        { label: 'Facebook', value: 'facebook' },
                        { label: 'YouTube', value: 'youtube' },
                        { label: 'Tripadvisor', value: 'tripadvisor' },
                        { label: 'LinkedIn', value: 'linkedin' },
                      ],
                    },
                    { name: 'url', type: 'text', required: true, admin: { width: '60%' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Defaults',
          fields: [
            {
              name: 'defaultCurrency',
              type: 'select',
              defaultValue: 'USD',
              options: CURRENCY_OPTIONS,
            },
            {
              name: 'enquiryEmail',
              type: 'email',
              admin: { description: 'Where booking enquiries are sent.' },
            },
            { name: 'metaTitleSuffix', type: 'text', defaultValue: ' | Hike Globally' },
            { name: 'metaDescriptionFallback', type: 'textarea', maxLength: 200 },
          ],
        },
      ],
    },
  ],

  hooks: { afterChange: [revalidateGlobal('site-settings')] },

  versions: { drafts: false, max: 20 },
}
