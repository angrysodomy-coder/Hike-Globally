import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Destinations } from './collections/Destinations'
import { Trips } from './collections/Trips'
import { Blogs } from './collections/Blogs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const allowedOrigins: string[] = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://hikeglobally.com',
  'https://www.hikeglobally.com',
  'https://cms.hikeglobally.com',
]

if (process.env.PAYLOAD_CORS_ORIGIN) {
  process.env.PAYLOAD_CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .forEach((origin) => {
      if (!allowedOrigins.includes(origin)) allowedOrigins.push(origin)
    })
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Categories, Destinations, Trips, Blogs],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-payload-secret-must-be-at-least-32-characters-long',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:54329/hikeglobally',
    },
  }),
  cors: allowedOrigins,
  csrf: allowedOrigins,
  sharp,
})
