import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import { isAdmin, publicRead } from '../access'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: publicRead,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'createdAt'],
    description: 'Images and media assets for journeys, destinations, and journal articles.',
  },
  upload: {
    staticDir: path.resolve(dirname, '../../public/media'),
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/avif'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 320,
        height: 240,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 512,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Descriptive text for accessibility and SEO (required).',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional caption or photography credit.',
      },
    },
  ],
}
