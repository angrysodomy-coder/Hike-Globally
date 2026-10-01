import type { CollectionConfig } from 'payload'

import { authenticated, canAccessAdminUI, isAdmin, isAdminField } from '@/access'

/**
 * Concept — an auth collection. Adding `auth: {}` makes Payload attach email,
 * password, salt/hash, reset-token and login-attempt fields, plus the
 * `/api/users/login`, `/logout`, `/forgot-password` and `/me` endpoints. You
 * never store or compare a password yourself.
 *
 * `admin.user` in payload.config.ts points at this collection, which makes it
 * the one that can sign in to /admin.
 */
export const Users: CollectionConfig<'users'> = {
  slug: 'users',

  admin: {
    useAsTitle: 'name',
    // Never a valid internal link target. See src/fields/defaultLexical.ts.
    enableRichTextLink: false,
    defaultColumns: ['name', 'email', 'roles'],
    group: 'Settings',
  },

  auth: {
    // 8 hours: an editing session, not a month-long cookie on a shared laptop.
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    cookies: {
      // 'Lax' not 'Strict': live preview loads the frontend in an iframe and
      // 'Strict' would strip the cookie, so drafts would render as 404s.
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },

  access: {
    read: authenticated,
    create: isAdmin,
    // Anyone may edit themselves; only admins may edit other people.
    update: ({ req: { user }, id }) => Boolean(user?.roles?.includes('admin')) || user?.id === id,
    delete: isAdmin,
    // Who may open /admin at all. Every user here is staff, so: any of them.
    admin: canAccessAdminUI,
  },

  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      /**
       * Field-level access. Without this an editor could PATCH
       * `{ roles: ['admin'] }` onto their own profile and escalate — the
       * collection-level `update` rule above explicitly allows them to edit
       * themselves. Collection access does not protect individual fields.
       */
      access: { create: isAdminField, update: isAdminField },
      options: [
        { label: 'Admin — full access including users and settings', value: 'admin' },
        { label: 'Editor — content, trips, media', value: 'editor' },
        { label: 'Operations — departures, enquiries only', value: 'operations' },
      ],
    },
  ],
}
