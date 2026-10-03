import type { CollectionConfig } from 'payload'
import { authenticated } from '@/lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  // Keep the login contract explicit. Payload enables email login by default,
  // but making it explicit prevents a future auth/dashboard configuration
  // change from switching the login form to username mode. The admin panel
  // always submits the email field.
  auth: {
    loginWithUsername: false,
  },
  admin: { useAsTitle: 'email', group: 'Admin' },
  access: {
    admin: authenticated,
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
    },
  ],
}
