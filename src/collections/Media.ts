import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/lib/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*', 'application/pdf'],
    // Editors mark the subject (a summit, a face) so crops keep it in frame.
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 480, height: 320, position: 'centre' },
      { name: 'card', width: 768, height: 512, position: 'centre' },
      { name: 'tablet', width: 1024 },
      { name: 'hero', width: 1920 },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    // Store renditions as WebP — trek photos arrive at 8–12 MB otherwise.
    formatOptions: { format: 'webp', options: { quality: 82 } },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe the image for accessibility and SEO.' },
    },
    { name: 'caption', type: 'text' },
    { name: 'credit', type: 'text', admin: { description: 'Photographer / source attribution.' } },
  ],
}
